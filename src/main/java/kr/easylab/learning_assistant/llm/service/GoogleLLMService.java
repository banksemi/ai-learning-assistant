package kr.easylab.learning_assistant.llm.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.core.converter.AnnotatedType;
import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.core.converter.ResolvedSchema;
import io.swagger.v3.oas.models.media.Schema;
import jakarta.annotation.PostConstruct;
import jakarta.validation.constraints.NotNull;
import kr.easylab.learning_assistant.llm.dto.LLMMessage;
import kr.easylab.learning_assistant.llm.dto.genai.*;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class GoogleLLMService implements LLMService {
    private final String baseURL;
    private final String apiKey;
    private final String model;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final GoogleSchemaMappingService schemaMappingService;
    private final GoogleSchemaMappingService googleSchemaMappingService;

    public GoogleLLMService(
            @Value("${llm.google.base_url}") String baseURL,
            @Value("${llm.google.api_key}") String apiKey,
            @Value("${llm.google.model}") String model,
            ObjectMapper objectMapper,
            GoogleSchemaMappingService schemaMappingService,
            GoogleSchemaMappingService googleSchemaMappingService) {
        this.baseURL = baseURL;
        this.apiKey = apiKey;
        this.model = model;
        this.objectMapper = objectMapper;
        this.schemaMappingService = schemaMappingService;

        this.webClient = WebClient.builder()
                .baseUrl(baseURL)
                .build();
        this.googleSchemaMappingService = googleSchemaMappingService;
    }

    private String mapRole(LLMMessage.Role role) {
        switch (role) {
            case USER:
                return "user";
            case ASSISTANT:
                return "model";
            default:
                throw new IllegalArgumentException("invalid role");
        }
    }

    private String call(String prompt, List<LLMMessage> messages, GenerationConfig config) {
        List<Content> contents = messages.stream().map(
                message -> {
                    return Content.builder()
                            .role(mapRole(message.getRole()))
                            .parts(List.of(new Part(message.getText())))
                            .build();
                }
        ).toList(); // 수정 불가능

        GenerateContentRequest request = GenerateContentRequest.builder()
                .systemInstruction(new SystemInstruction(prompt))
                .contents(contents)
                .generationConfig(config)
                .build();

        Mono<GenerateContentResponse> stringMono = webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1beta/models/" + model + ":generateContent")
                        .queryParam("key", apiKey)
                        .build())
                .bodyValue(request)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError,
                        clientResponse -> {
                            log.error("Google AI Error (status_code): {}", clientResponse.statusCode().value());
                            return clientResponse.bodyToMono(String.class)
                                    .flatMap(errorBody -> {
                                        log.error("Google AI Error (response): {}", errorBody);
                                        return Mono.error(new RuntimeException("Google AI Error"));
                                    });
                        })

                .bodyToMono(GenerateContentResponse.class);

        GenerateContentResponse responseString = stringMono
                .timeout(Duration.ofSeconds(240))
                .block();

        Content responseContent = responseString.getCandidates().get(0).getContent();
        for (Part part : responseContent.getParts()) {
            if (part.getText() != null) {
                log.info("API Response:\n{}", part.getText());
                return part.getText();
            }
        }
        return null;
    }
    @Override
    public String generate(String prompt, List<LLMMessage> messages) {
        return call(prompt, messages, null);
    }

    @Override
    public Flux<String> generateStream(String prompt, List<LLMMessage> messages) {
        List<Content> contents = messages.stream().map(
                message -> {
                    return Content.builder()
                            .role(mapRole(message.getRole()))
                            .parts(List.of(new Part(message.getText())))
                            .build();
                }
        ).toList(); // 수정 불가능

        GenerateContentRequest request = GenerateContentRequest.builder()
                .systemInstruction(new SystemInstruction(prompt))
                .contents(contents)
                .build();

        ParameterizedTypeReference<ServerSentEvent<GenerateContentResponse>> typeRef =
                new ParameterizedTypeReference<>() {};

        return webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1beta/models/" + model + ":streamGenerateContent")
                        .queryParam("key", apiKey)
                        .queryParam("alt", "sse")
                        .build())
                .bodyValue(request)
                .retrieve()
                .onStatus(HttpStatusCode::isError, // 4xx, 5xx 에러 처리
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("Google AI API Error ({}): {}", clientResponse.statusCode(), errorBody);
                                    return Mono.error(new RuntimeException("Google AI API Error: " + clientResponse.statusCode() + " - " + errorBody));
                                }))
                .bodyToFlux(typeRef)
                .doOnNext(sse -> log.trace("Received SSE: id={}, event={}, data={}", sse.id(), sse.event(), sse.data()))
                .mapNotNull(ServerSentEvent::data)
                .concatMap(response -> {
                    Content responseContent = response.getCandidates().get(0).getContent();
                    for (Part part : responseContent.getParts()) {
                        if (part.getText() != null) {
                            return Mono.just(part.getText());
                        }
                    }
                    return Mono.empty();
                })
                .doOnError(error -> log.error("Error processing Google AI stream: ", error))
                .doOnComplete(() -> log.info("Google AI stream processing completed."));
    }

    @Override
    public <T> T generate(String prompt, List<LLMMessage> messages, Class<T> clazz) {
        ResolvedSchema resolvedSchema = ModelConverters.getInstance()
                .resolveAsResolvedSchema(new AnnotatedType(clazz).resolveAsRef(false));

        String responseText = call(
                prompt,
                messages,
                GenerationConfig.builder()
                        .responseMimeType("application/json")
                        .responseSchema(googleSchemaMappingService.mapToGoogleSchema(resolvedSchema.schema))
                        .build()
        );

        try {
            return objectMapper.readValue(responseText, clazz);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}

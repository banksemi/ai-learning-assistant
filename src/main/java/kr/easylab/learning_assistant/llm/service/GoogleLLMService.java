package kr.easylab.learning_assistant.llm.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.module.jsonSchema.JsonSchema;
import com.fasterxml.jackson.module.jsonSchema.factories.SchemaFactoryWrapper;
import jakarta.annotation.PostConstruct;
import jakarta.validation.constraints.NotNull;
import kr.easylab.learning_assistant.llm.dto.LLMMessage;
import kr.easylab.learning_assistant.llm.dto.genai.*;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class GoogleLLMService implements LLMService {
    private final String baseURL;
    private final String apiKey;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public GoogleLLMService(
            @Value("${llm.google.base_url}") String baseURL,
            @Value("${llm.google.api_key}") String apiKey,
            ObjectMapper objectMapper
    ) {
        this.baseURL = baseURL;
        this.apiKey = apiKey;
        this.objectMapper = objectMapper;

        this.webClient = WebClient.builder()
                .baseUrl(baseURL)
                .build();
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
                        .path("/v1beta/models/gemini-2.0-flash:generateContent")
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
                .timeout(Duration.ofSeconds(30))
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

    private <T> Schema generateSchemaForClass(Class<T> clazz) {
        SchemaFactoryWrapper visitor = new SchemaFactoryWrapper();
        try {
            objectMapper.acceptJsonFormatVisitor(
                    objectMapper.constructType(clazz), visitor);

            JsonSchema jsonSchema = visitor.finalSchema();

            String schemaJsonString = objectMapper.writeValueAsString(jsonSchema);
            log.info("Generated JSON Schema string for {}: {}", clazz.getName(), schemaJsonString);

            return objectMapper.readValue(schemaJsonString, Schema.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to generate schema for class: {}", clazz.getName(), e);
            return null;
        }

    }
    @Override
    public <T> T generate(String prompt, List<LLMMessage> messages, Class<T> clazz) {

        Schema schema = generateSchemaForClass(clazz); // 업데이트된 메서드 호출
        if (schema == null) {
            log.error("Failed to generate schema for class: {}", clazz.getName());
            throw new IllegalArgumentException("Could not generate schema for the given class.");
        }


        String responseText = call(
                prompt,
                messages,
                GenerationConfig.builder()
                        .responseMimeType("application/json")
                        .responseSchema(schema)
                        .build()
        );

        try {
            return objectMapper.readValue(responseText, clazz);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}

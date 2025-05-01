package kr.easylab.learning_assistant.llm.service;

import jakarta.annotation.PostConstruct;
import kr.easylab.learning_assistant.llm.dto.LLMMessage;
import kr.easylab.learning_assistant.llm.dto.genai.*;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    public GoogleLLMService(@Value("${llm.google.base_url}") String baseURL, @Value("${llm.google.api_key}") String apiKey) {
        this.baseURL = baseURL;
        this.apiKey = apiKey;

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

    @Override
    public String generate(String prompt, List<LLMMessage> messages) {
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

        Mono<GenerateContentResponse> stringMono = webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1beta/models/gemini-2.0-flash:generateContent")
                        .queryParam("key", apiKey)
                        .build())
                .bodyValue(request)
                .retrieve()
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
    public <T> T generate(String prompt, List<LLMMessage> messages, Class<T> clazz) {
        throw new UnsupportedOperationException("not implemented yet");
    }
}

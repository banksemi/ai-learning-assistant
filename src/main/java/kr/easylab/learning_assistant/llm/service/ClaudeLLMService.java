package kr.easylab.learning_assistant.llm.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.core.converter.AnnotatedType;
import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.core.converter.ResolvedSchema;
import kr.easylab.learning_assistant.llm.dto.LLMConfig;
import kr.easylab.learning_assistant.llm.dto.LLMMessage;
import kr.easylab.learning_assistant.llm.dto.claude.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@ConditionalOnProperty(prefix = "llm", name = "provider", havingValue = "anthropic")
@Slf4j
public class ClaudeLLMService implements LLMService {
    private static final String ANTHROPIC_VERSION = "2023-06-01";
    private static final long MAX_TOKENS = 16000L;
    private static final long THINKING_BUDGET_TOKENS = 10000L;

    private final String apiKey;
    private final String model;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final GoogleSchemaMappingService schemaMappingService;

    public ClaudeLLMService(
            @Value("${llm.anthropic.base_url}") String baseUrl,
            @Value("${llm.anthropic.api_key}") String apiKey,
            @Value("${llm.anthropic.model}") String model,
            ObjectMapper objectMapper,
            GoogleSchemaMappingService schemaMappingService) {
        this.apiKey = apiKey;
        this.model = model;
        this.objectMapper = objectMapper;
        this.schemaMappingService = schemaMappingService;

        // Configure WebClient with SNAKE_CASE ObjectMapper so field names match Claude's API
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("x-api-key", apiKey)
                .defaultHeader("anthropic-version", ANTHROPIC_VERSION)
                .codecs(configurer -> {
                    configurer.defaultCodecs().jackson2JsonEncoder(new Jackson2JsonEncoder(objectMapper));
                    configurer.defaultCodecs().jackson2JsonDecoder(new Jackson2JsonDecoder(objectMapper));
                })
                .build();
    }

    private String mapRole(LLMMessage.Role role) {
        return switch (role) {
            case USER -> "user";
            case ASSISTANT -> "assistant";
        };
    }

    private List<ClaudeMessage> toClaudeMessages(List<LLMMessage> messages) {
        return messages.stream()
                .map(m -> ClaudeMessage.builder()
                        .role(mapRole(m.getRole()))
                        .content(m.getText())
                        .build())
                .toList();
    }

    private ClaudeThinking buildThinking(LLMConfig config) {
        if (config.getThinking() == LLMConfig.ThinkingMode.yes) {
            return ClaudeThinking.builder().type("enabled").budgetTokens(THINKING_BUDGET_TOKENS).build();
        }
        return null;
    }

    private String extractText(ClaudeResponse response) {
        if (response == null || response.getContent() == null) return null;
        for (ClaudeContentBlock block : response.getContent()) {
            if ("text".equals(block.getType()) && block.getText() != null) {
                log.info("API Response:\n{}", block.getText());
                return block.getText();
            }
        }
        return null;
    }

    private Map<String, Object> addAdditionalPropertiesFalse(Map<String, Object> schema) {
        if ("object".equals(schema.get("type"))) {
            schema.put("additionalProperties", false);
        }
        Object properties = schema.get("properties");
        if (properties instanceof Map<?, ?> propsMap) {
            for (Object value : propsMap.values()) {
                if (value instanceof Map<?, ?> propSchema) {
                    addAdditionalPropertiesFalse((Map<String, Object>) propSchema);
                }
            }
        }
        Object items = schema.get("items");
        if (items instanceof Map<?, ?> itemsMap) {
            addAdditionalPropertiesFalse((Map<String, Object>) itemsMap);
        }
        return schema;
    }

    @Override
    public String generate(List<LLMMessage> messages, LLMConfig config) {
        ClaudeRequest request = ClaudeRequest.builder()
                .model(model)
                .maxTokens(MAX_TOKENS)
                .system(config.getPrompt())
                .messages(toClaudeMessages(messages))
                .thinking(buildThinking(config))
                .build();

        ClaudeResponse response = webClient.post()
                .uri("/v1/messages")
                .bodyValue(request)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("Anthropic API Error ({}): {}", clientResponse.statusCode(), errorBody);
                                    return Mono.error(new RuntimeException("Anthropic API Error: " + errorBody));
                                }))
                .bodyToMono(ClaudeResponse.class)
                .timeout(Duration.ofSeconds(240))
                .block();

        String text = extractText(response);
        if (text == null) {
            throw new RuntimeException("No text content in Claude response");
        }
        return text;
    }

    @Override
    public Flux<String> generateStream(List<LLMMessage> messages, LLMConfig config) {
        ClaudeRequest request = ClaudeRequest.builder()
                .model(model)
                .maxTokens(MAX_TOKENS)
                .system(config.getPrompt())
                .messages(toClaudeMessages(messages))
                .thinking(buildThinking(config))
                .stream(true)
                .build();

        ParameterizedTypeReference<ServerSentEvent<ClaudeStreamEvent>> typeRef =
                new ParameterizedTypeReference<>() {};

        return webClient.post()
                .uri("/v1/messages")
                .bodyValue(request)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("Anthropic API Error ({}): {}", clientResponse.statusCode(), errorBody);
                                    return Mono.error(new RuntimeException("Anthropic API Error: " + errorBody));
                                }))
                .bodyToFlux(typeRef)
                .doOnNext(sse -> log.trace("Received SSE: id={}, event={}", sse.id(), sse.event()))
                .mapNotNull(ServerSentEvent::data)
                .concatMap(event -> {
                    if ("error".equals(event.getType())) {
                        return Mono.error(new RuntimeException("Anthropic stream error: " + event.getError()));
                    }
                    if ("content_block_delta".equals(event.getType())
                            && event.getDelta() != null
                            && "text_delta".equals(event.getDelta().getType())) {
                        return Mono.just(event.getDelta().getText());
                    }
                    return Mono.empty();
                })
                .doOnError(error -> log.error("Error processing Anthropic stream: ", error))
                .doOnComplete(() -> log.info("Anthropic stream processing completed."));
    }

    @Override
    public <T> T generate(List<LLMMessage> messages, Class<T> clazz, LLMConfig config) {
        ResolvedSchema resolvedSchema = ModelConverters.getInstance()
                .resolveAsResolvedSchema(new AnnotatedType(clazz).resolveAsRef(false));

        Map<String, Object> schema = addAdditionalPropertiesFalse(
                schemaMappingService.mapToGoogleSchema(resolvedSchema.schema));

        ClaudeOutputConfig outputConfig = ClaudeOutputConfig.builder()
                .format(ClaudeOutputConfig.Format.builder()
                        .type("json_schema")
                        .schema(schema)
                        .build())
                .build();

        ClaudeRequest request = ClaudeRequest.builder()
                .model(model)
                .maxTokens(MAX_TOKENS)
                .system(config.getPrompt())
                .messages(toClaudeMessages(messages))
                .thinking(buildThinking(config))
                .outputConfig(outputConfig)
                .build();

        ClaudeResponse response = webClient.post()
                .uri("/v1/messages")
                .bodyValue(request)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("Anthropic API Error ({}): {}", clientResponse.statusCode(), errorBody);
                                    return Mono.error(new RuntimeException("Anthropic API Error: " + errorBody));
                                }))
                .bodyToMono(ClaudeResponse.class)
                .timeout(Duration.ofSeconds(240))
                .block();

        String text = extractText(response);
        if (text == null) {
            throw new RuntimeException("No text content in Claude response");
        }

        try {
            return objectMapper.readValue(text, clazz);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}

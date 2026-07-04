package kr.easylab.learning_assistant.llm.dto.claude;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Builder
@Getter
public class ClaudeOutputConfig {
    private Format format;

    @Builder
    @Getter
    public static class Format {
        private String type; // "json_schema"
        private Map<String, Object> schema;
    }
}

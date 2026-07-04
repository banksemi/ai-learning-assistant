package kr.easylab.learning_assistant.llm.dto.claude;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClaudeRequest {
    private String model;
    private long maxTokens;
    private String system;
    private List<ClaudeMessage> messages;
    private Boolean stream;
    private ClaudeThinking thinking;
    private ClaudeOutputConfig outputConfig;
}

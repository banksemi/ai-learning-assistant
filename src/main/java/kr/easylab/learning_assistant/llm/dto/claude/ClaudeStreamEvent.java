package kr.easylab.learning_assistant.llm.dto.claude;

import lombok.Getter;

import java.util.Map;

@Getter
public class ClaudeStreamEvent {
    private String type;    // "content_block_delta", "message_start", "error", etc.
    private Integer index;
    private ClaudeDelta delta;
    private Map<String, Object> error;
}

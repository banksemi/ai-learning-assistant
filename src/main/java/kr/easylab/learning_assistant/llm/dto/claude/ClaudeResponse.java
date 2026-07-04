package kr.easylab.learning_assistant.llm.dto.claude;

import lombok.Getter;

import java.util.List;

@Getter
public class ClaudeResponse {
    private String id;
    private String type;
    private String role;
    private List<ClaudeContentBlock> content;
    private String stopReason;
}

package kr.easylab.learning_assistant.llm.dto.claude;

import lombok.Getter;

@Getter
public class ClaudeContentBlock {
    private String type;    // "text" or "thinking"
    private String text;
    private String thinking;
}

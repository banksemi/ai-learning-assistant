package kr.easylab.learning_assistant.llm.dto.claude;

import lombok.Getter;

@Getter
public class ClaudeDelta {
    private String type;     // "text_delta" or "thinking_delta"
    private String text;
    private String thinking;
}

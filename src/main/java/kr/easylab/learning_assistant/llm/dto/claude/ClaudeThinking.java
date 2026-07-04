package kr.easylab.learning_assistant.llm.dto.claude;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class ClaudeThinking {
    private String type; // "enabled" or "disabled"
    private Long budgetTokens;
}

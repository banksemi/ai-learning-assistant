package kr.easylab.learning_assistant.llm.dto.genai;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ThinkingConfig {
    private Long thinkingBudget;
}

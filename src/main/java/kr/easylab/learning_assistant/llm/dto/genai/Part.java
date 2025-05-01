package kr.easylab.learning_assistant.llm.dto.genai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
@AllArgsConstructor
public class Part {
    private String text;
}

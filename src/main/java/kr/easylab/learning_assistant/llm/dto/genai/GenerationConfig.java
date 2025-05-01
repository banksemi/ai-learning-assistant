package kr.easylab.learning_assistant.llm.dto.genai;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class GenerationConfig {
    private String responseMimeType;
    private Schema responseSchema;
}

package kr.easylab.learning_assistant.llm.dto.genai;

import io.swagger.v3.oas.models.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Builder
@Getter
public class GenerationConfig {
    private String responseMimeType;
    private Map<String, Object> responseSchema;
}

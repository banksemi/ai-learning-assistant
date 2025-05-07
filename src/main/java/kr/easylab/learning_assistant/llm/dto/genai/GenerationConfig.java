package kr.easylab.learning_assistant.llm.dto.genai;

import io.swagger.v3.oas.models.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Builder
@Setter
@Getter
public class GenerationConfig {
    private String responseMimeType;
    private Map<String, Object> responseSchema;
    private ThinkingConfig thinkingConfig;
}

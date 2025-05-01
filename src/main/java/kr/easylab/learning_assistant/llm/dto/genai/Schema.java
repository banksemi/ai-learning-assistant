package kr.easylab.learning_assistant.llm.dto.genai;

import lombok.Data;

import java.util.Map;

@Data
public class Schema {
    private String type;
    private Map<String, Property> properties;
    private String description;
}

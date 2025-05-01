package kr.easylab.learning_assistant.llm.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import io.swagger.v3.oas.models.media.Schema;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.google.common.base.CaseFormat;


import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class GoogleSchemaMappingService {
    private final ObjectMapper objectMapper;
    private final Set<String> supportedFields = Set.of(
            "type", "format", "description", "nullable", "enum",
            "maxItems", "minItems", "properties", "required",
            "propertyOrdering", "items"
    );

    public Map<String, Object> mapToGoogleSchema(Schema<?> schema2) {
        Map<String, Object> schema = objectMapper.convertValue(schema2, Map.class);
        return filter(schema);
    }

    private String convertFieldName(String fieldName) {
        PropertyNamingStrategy strategy = objectMapper.getPropertyNamingStrategy();
        if (strategy instanceof PropertyNamingStrategies.SnakeCaseStrategy) {
            return CaseFormat.LOWER_CAMEL.to(CaseFormat.LOWER_UNDERSCORE, fieldName);
        }
        return fieldName;
    }

    private Map<String, Object> filter(Map<String, Object> schema) {
        Map<String, Object> filteredSchema = new HashMap<>();

        // 지원되는 필드만 추출
        for (String field : supportedFields) {
            if (schema.containsKey(field)) {
                Object value = schema.get(field);

                // properties 필드는 재귀적으로 처리
                if (field.equals("properties") && value instanceof Map) {
                    Map<String, Object> properties = (Map<String, Object>) value;
                    Map<String, Object> filteredProperties = new HashMap<>();

                    for (Map.Entry<String, Object> entry : properties.entrySet()) {
                        if (entry.getValue() instanceof Map) {
                            filteredProperties.put(
                                    convertFieldName(entry.getKey()),
                                    filter((Map<String, Object>) entry.getValue())
                            );
                        }
                    }

                    filteredSchema.put("properties", filteredProperties);
                }
                // items 필드도 재귀적으로 처리
                else if (field.equals("items") && value instanceof Map) {
                    filteredSchema.put("items", filter((Map<String, Object>) value));
                }
                else {
                    filteredSchema.put(field, value);
                }
            }
        }

        return filteredSchema;
    }

}

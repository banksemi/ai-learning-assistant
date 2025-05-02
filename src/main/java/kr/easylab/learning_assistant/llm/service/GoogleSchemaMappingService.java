package kr.easylab.learning_assistant.llm.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.google.common.base.CaseFormat;
import io.swagger.v3.oas.models.media.Schema;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class GoogleSchemaMappingService {
    private final ObjectMapper objectMapper;

    private final Map<String, Function<Schema<?>, Object>> fieldAccessors = Map.ofEntries(
            Map.entry("type", Schema::getType),
            Map.entry("format", Schema::getFormat),
            Map.entry("description", Schema::getDescription),
            Map.entry("nullable", Schema::getNullable),
            Map.entry("enum", Schema::getEnum),
            Map.entry("maxItems", Schema::getMaxItems),
            Map.entry("minItems", Schema::getMinItems),
            Map.entry("required", Schema::getRequired)
    );

    public Map<String, Object> mapToGoogleSchema(Schema<?> schema) {
        Map<String, Object> map = new HashMap<>();
        for (Map.Entry<String, Function<Schema<?>, Object>> entry : fieldAccessors.entrySet()) {
            String fieldName = entry.getKey();
            Object value = entry.getValue().apply(schema);
            if (value != null) {
                map.put(fieldName, value);
            }
        }
        if (schema.getProperties() != null) {
            Map<String, Object> properties = new HashMap<>();
            for (Map.Entry<String, Schema> entry: schema.getProperties().entrySet()) {
                properties.put(convertFieldName(entry.getKey()), mapToGoogleSchema(entry.getValue()));
            }
            map.put("properties", properties);
        }
        if (schema.getItems() != null) {
            map.put("items", mapToGoogleSchema(schema.getItems()));
        }
        return map;
    }

    private String convertFieldName(String fieldName) {
        PropertyNamingStrategy strategy = objectMapper.getPropertyNamingStrategy();
        if (strategy instanceof PropertyNamingStrategies.SnakeCaseStrategy) {
            return CaseFormat.LOWER_CAMEL.to(CaseFormat.LOWER_UNDERSCORE, fieldName);
        }
        return fieldName;
    }

}

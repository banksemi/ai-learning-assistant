package kr.easylab.learning_assistant.translation.dto;

import lombok.Data;

import java.util.List;

@Data
public class TranslatedResponse {
    private List<String> translated;
}

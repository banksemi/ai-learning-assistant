package kr.easylab.learning_assistant.exam.dto;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;

@Builder
@Data
public class Option {
    private String key;
    private String value;
}

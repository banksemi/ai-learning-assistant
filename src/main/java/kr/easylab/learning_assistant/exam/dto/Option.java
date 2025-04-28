package kr.easylab.learning_assistant.exam.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class Option {
    private String key;
    private String value;
}

package kr.easylab.learning_assistant.exam.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@Builder
public class ExamTranslationResponse {
    private String title;
    private Map<Long, String> answers;
    private String explanation;
}

package kr.easylab.learning_assistant.exam.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Builder
@Getter

public class ExamQuestionResponse {
    private Long questionId;
    private String title;
    private Long answerCount;
    private List<Option> options;
    private Boolean marker;

    @Setter
    private List<String> userAnswers;

    @Setter
    private List<String> actualAnswers;

    @Setter
    private String explanation;
}

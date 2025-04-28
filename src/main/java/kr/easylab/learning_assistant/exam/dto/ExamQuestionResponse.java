package kr.easylab.learning_assistant.exam.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder
@Getter
public class ExamQuestionResponse {
    private Long questionId;
    private String title;
    private Long answerCount;
    private List<Option> options;
    private Boolean marker;

    private List<Option> userAnswers;
    private List<Option> actualAnswers;
    private String explanation;
}

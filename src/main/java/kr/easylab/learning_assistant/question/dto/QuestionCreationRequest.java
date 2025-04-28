package kr.easylab.learning_assistant.question.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Builder
@Getter
@Setter
public class QuestionCreationRequest {
    private String title;
    private String[] correctAnswers;
    private String[] incorrectAnswers;
}

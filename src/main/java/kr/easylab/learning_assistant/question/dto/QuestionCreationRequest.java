package kr.easylab.learning_assistant.question.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Builder
@Getter
@Setter
public class QuestionCreationRequest {
    @NotEmpty
    private String title;

    @NotNull
    private String[] correctAnswers;

    @NotNull
    private String[] incorrectAnswers;

    private String explanation;
}

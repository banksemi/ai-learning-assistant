package kr.easylab.learning_assistant.exam.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class ExamCreationRequest {
    @NotNull
    private Long question_bank_id;

    @NotNull
    private String language;

    @NotNull
    private Long questions;
}

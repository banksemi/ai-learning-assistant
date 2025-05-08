package kr.easylab.learning_assistant.exam.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class ExamTranslationRequest {
    @NotNull
    private String title;

    @NotNull
    private List<String> options;

    @NotNull
    private String explanation;
}

package kr.easylab.learning_assistant.exam.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Builder
@Data
public class ExamTranslationRequest {
    @NotNull
    private String title;

    @NotNull
    private List<String> answers;

    @NotNull
    private String explanation;
}

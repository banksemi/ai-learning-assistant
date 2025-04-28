package kr.easylab.learning_assistant.exam.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder
@Getter
public class ExamResultQuestions {
    private List<ExamQuestionResponse> marked;
    private List<ExamQuestionResponse> incorrect;
}

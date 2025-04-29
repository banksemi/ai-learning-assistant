package kr.easylab.learning_assistant.exam.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExamResultResponse {
    private Long correctQuestions;
    private Long totalQuestions;
    private String summary;
    private ExamResultQuestions questions;
}

package kr.easylab.learning_assistant.exam.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public class ExamTotalQuestionCountResponse {
    private final Long totalQuestionCount;
}

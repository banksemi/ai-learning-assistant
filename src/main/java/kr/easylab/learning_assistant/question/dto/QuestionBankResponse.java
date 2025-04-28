package kr.easylab.learning_assistant.question.dto;

import lombok.*;

@Builder
@Getter
public class QuestionBankResponse {
    private final Long questionBankId;
    private final String title;
    private final Long questions;
}

package kr.easylab.learning_assistant.question.dto;

import lombok.Builder;

@Builder
public class QuestionBankResponse {
    public Long questionBankId;
    public String title;
    public Long questions;
}

package kr.easylab.learning_assistant.question.dto;

import lombok.Builder;

@Builder
public class QuestionCreationRequest {
    public Long questionBankId;
    public String questionText;
    public String[] correctAnswer;
    public String[] wrongAnswer;
}

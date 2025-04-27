package kr.easylab.learning_assistant.question.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public class QuestionBankCreationRequest {
    private final String title;
}

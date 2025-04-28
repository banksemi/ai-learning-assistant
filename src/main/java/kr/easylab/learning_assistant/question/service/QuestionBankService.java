package kr.easylab.learning_assistant.question.service;

import kr.easylab.learning_assistant.question.dto.QuestionBankResponse;
import kr.easylab.learning_assistant.question.dto.QuestionCreationRequest;
import kr.easylab.learning_assistant.question.entity.Language;
import kr.easylab.learning_assistant.question.entity.Question;
import kr.easylab.learning_assistant.question.entity.QuestionBank;
import kr.easylab.learning_assistant.question.exception.NotFoundQuestionBank;

import java.util.List;
import java.util.Optional;

public interface QuestionBankService {
    Long createQuestionBank(String title);
    QuestionBank getQuestionBank(Long questionBankId) throws NotFoundQuestionBank;
    List<QuestionBankResponse> getQuestionBanks();

    Long createQuestion(Long questionBankId, QuestionCreationRequest request);
    List<Question> getRandomQuestions(
            Long questionBankId,
            Long count
    )  throws NotFoundQuestionBank;

    Question getQuestion(Long questionId);
}

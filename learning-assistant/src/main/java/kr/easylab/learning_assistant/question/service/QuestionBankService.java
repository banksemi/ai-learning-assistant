package kr.easylab.learning_assistant.question.service;

import kr.easylab.learning_assistant.question.dto.QuestionCreationRequest;
import kr.easylab.learning_assistant.question.entity.Language;
import kr.easylab.learning_assistant.question.entity.Question;
import kr.easylab.learning_assistant.question.entity.QuestionBank;

import java.util.List;
import java.util.Optional;

public interface QuestionBankService {
    Long createQuestionBank(String title, Language language);
    QuestionBank getQuestionBank(Long questionBankId);
    List<QuestionBank> getQuestionBanks();

    Long createQuestion(QuestionCreationRequest request);
    List<Question> getRandomQuestions(
            Long questionBankId
    );

    Question getQuestion(Long questionId);
}

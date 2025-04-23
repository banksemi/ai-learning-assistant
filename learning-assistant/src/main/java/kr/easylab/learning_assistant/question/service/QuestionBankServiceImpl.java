package kr.easylab.learning_assistant.question.service;

import kr.easylab.learning_assistant.question.dto.QuestionCreationRequest;
import kr.easylab.learning_assistant.question.entity.Language;
import kr.easylab.learning_assistant.question.entity.Question;
import kr.easylab.learning_assistant.question.entity.QuestionBank;
import kr.easylab.learning_assistant.question.repository.QuestionBankRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class QuestionBankServiceImpl implements QuestionBankService {
    private final QuestionBankRepository questionBankRepository;

    @Override
    public Long createQuestionBank(String title, Language language) {
        if (title == null) {
            throw new IllegalArgumentException("title is null");
        }
        QuestionBank questionBank = QuestionBank.builder()
                .title(title)
                .language(language)
                .build();
        questionBankRepository.save(questionBank);
        return questionBank.getId();
    }

    @Override
    public QuestionBank getQuestionBank(Long questionBankId) {
        return questionBankRepository.findOne(questionBankId);
    }

    @Override
    public List<QuestionBank> getQuestionBanks() {
        return questionBankRepository.findAll();
    }

    @Override
    public Long createQuestion(QuestionCreationRequest request) {
        return 0L;
    }

    @Override
    public List<Question> getRandomQuestions(Long questionBankId) {
        return List.of();
    }

    @Override
    public Question getQuestion(Long questionId) {
        return null;
    }
}

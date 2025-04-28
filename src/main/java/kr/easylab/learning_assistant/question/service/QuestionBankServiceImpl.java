package kr.easylab.learning_assistant.question.service;

import kr.easylab.learning_assistant.question.dto.QuestionCreationRequest;
import kr.easylab.learning_assistant.question.entity.Answer;
import kr.easylab.learning_assistant.question.entity.Language;
import kr.easylab.learning_assistant.question.entity.Question;
import kr.easylab.learning_assistant.question.entity.QuestionBank;
import kr.easylab.learning_assistant.question.exception.NotFoundQuestionBank;
import kr.easylab.learning_assistant.question.repository.QuestionBankRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class QuestionBankServiceImpl implements QuestionBankService {
    private final QuestionBankRepository questionBankRepository;

    @Override
    public Long createQuestionBank(String title) {
        if (title == null) {
            throw new IllegalArgumentException("title is null");
        }
        QuestionBank questionBank = QuestionBank.builder()
                .title(title)
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
    public Long createQuestion(Long questionBankId, QuestionCreationRequest request) {
        QuestionBank questionBank = questionBankRepository.findOne(questionBankId);
        if (questionBank == null) {
            throw new NotFoundQuestionBank();
        }

        List<Answer> answerList = new ArrayList<>();

        for (String text: request.getCorrectAnswers())
            answerList.add(Answer.builder()
                    .text(text)
                    .correct(true)
                    .build()
            );
        for (String text: request.getIncorrectAnswers())
            answerList.add(Answer.builder()
                    .text(text)
                    .correct(false)
                    .build()
            );

        Question question = Question.builder()
                .questionBank(questionBank)
                .answer(answerList)
                .title(request.getTitle())
                .build();

        questionBankRepository.save(question);
        return question.getId();
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

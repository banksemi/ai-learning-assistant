package kr.easylab.learning_assistant.exam.service;

import kr.easylab.learning_assistant.exam.dto.*;
import kr.easylab.learning_assistant.exam.entity.Exam;
import kr.easylab.learning_assistant.exam.entity.ExamQuestion;
import kr.easylab.learning_assistant.exam.exception.NotFoundExam;
import kr.easylab.learning_assistant.exam.exception.NotFoundExamQuestion;
import kr.easylab.learning_assistant.exam.repository.ExamRepository;
import kr.easylab.learning_assistant.question.entity.Answer;
import kr.easylab.learning_assistant.question.entity.Question;
import kr.easylab.learning_assistant.question.service.QuestionBankService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Transactional
@Service
@RequiredArgsConstructor
public class ExamServiceImpl implements ExamService {
    private final QuestionBankService questionBankService;
    private final ExamRepository examRepository;
    private final ExamQuestionTranslationService examQuestionTranslationService;
    private final ExamQuestionMapper examQuestionMapper;

    @Override
    public Long createExam(ExamCreationRequest request) {
        List<Question> questions = questionBankService.getRandomQuestions(
                request.getQuestion_bank_id(),
                request.getQuestions()
        );

        List<ExamQuestion> examQuestions = new ArrayList<>();
        Exam exam = Exam.builder()
                .language(request.getLanguage())
                .examQuestions(examQuestions)
                .randomSeed(new Random().nextLong())
                .questionBank(questions.getFirst().getQuestionBank())
                .build();

        for (long i = 0; i < questions.size(); i++) {
            examQuestions.add(ExamQuestion.builder()
                    .exam(exam)
                    .question(questions.get((int)i))
                    .marked(false)
                    .no(i).build());
        }
        examRepository.save(exam);
        return exam.getId();
    }

    @Override
    public Exam getExam(Long examId) throws NotFoundExam {
        Exam exam = examRepository.findById(examId);
        if (exam == null) {
            throw new NotFoundExam();
        }
        return exam;
    }

    @Override
    public Long getQuestionCount(Long examId) {
        Exam exam = examRepository.findById(examId);
        if (exam == null) {
            throw new NotFoundExam();
        }
        return examRepository.getQuestionCount(examId);
    }

    private void prepareNextTranslation(ExamQuestion examQuestion) {
        examQuestionTranslationService.translate(
                examQuestion.getExam().getId(),
                examQuestion.getNo() + 1
        );
    }

    @Override
    public ExamQuestionResponse getQuestion(Long examId, Long no) throws NotFoundExamQuestion {
        ExamQuestion examQuestion = examRepository.findQuestion(examId, no);
        if (examQuestion == null) {
            throw new NotFoundExamQuestion();
        }
        prepareNextTranslation(examQuestion);
        return examQuestionMapper.mapToDto(examQuestion);
    }

    @Override
    public AnswerResponse submitAnswer(Long examId, Long no, ExamAnswerRequest request) {
        ExamQuestion examQuestion = examRepository.findQuestion(examId, no);
        if (examQuestion == null) {
            throw new NotFoundExamQuestion();
        }

        examQuestion.setUserAnswers(request.getUserAnswers());

        ExamQuestionResponse examQuestionResponse = examQuestionMapper.mapToDto(examQuestion);

        examQuestion.setCorrect(
                examQuestionResponse.getActualAnswers().size() == request.getUserAnswers().size() &&
                        new HashSet<>(examQuestionResponse.getActualAnswers())
                                .equals(new HashSet<>(request.getUserAnswers()))
        );
        return AnswerResponse.builder()
                .actualAnswers(examQuestionResponse.getActualAnswers())
                .explanation(examQuestionResponse.getExplanation())
                .build();
    }

    @Override
    public void markQuestion(Long examId, Long no) {
        ExamQuestion examQuestion = examRepository.findQuestion(examId, no);
        if (examQuestion == null) {
            throw new NotFoundExamQuestion();
        }

        examQuestion.setMarked(true);
    }

    @Override
    public void unmarkQuestion(Long examId, Long no) {
        ExamQuestion examQuestion = examRepository.findQuestion(examId, no);
        if (examQuestion == null) {
            throw new NotFoundExamQuestion();
        }

        examQuestion.setMarked(false);
    }
}

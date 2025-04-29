package kr.easylab.learning_assistant.exam.service;

import kr.easylab.learning_assistant.exam.dto.*;
import kr.easylab.learning_assistant.exam.entity.Exam;
import kr.easylab.learning_assistant.exam.entity.ExamQuestion;
import kr.easylab.learning_assistant.exam.exception.NotFoundExam;
import kr.easylab.learning_assistant.exam.exception.NotFoundExamQuestion;
import kr.easylab.learning_assistant.exam.repository.ExamRepository;
import kr.easylab.learning_assistant.question.entity.Answer;
import kr.easylab.learning_assistant.question.entity.Language;
import kr.easylab.learning_assistant.question.entity.Question;
import kr.easylab.learning_assistant.question.entity.QuestionBank;
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

    private ExamQuestionResponse mapToDto(ExamQuestion examQuestion) {
        // 복사본을 사용하여 원본 엔티티 순서에 영향이 가지 않도록 함.
        List<Answer> answerList = new ArrayList<>(examQuestion.getQuestion().getAnswer());

        // 항상 같은 순서로 섞이도록 id 기준 정렬
        answerList.sort(Comparator.comparing(Answer::getId));
        Long randomSeed = examQuestion.getExam().getRandomSeed();
        Random random = new Random(randomSeed);
        Collections.shuffle(answerList, random);

        List<String> actualAnswers = new ArrayList<>();
        List<Option> options = IntStream.range(0, answerList.size())
                .mapToObj(index -> {
                    char keyChar = (char) ('A' + index);
                    Answer answer = answerList.get(index);

                    if (answer.getCorrect())
                        actualAnswers.add(String.valueOf(keyChar));

                    return Option.builder()
                            .key(String.valueOf(keyChar))
                            .value(answer.getText())
                            .build();
                })
                .collect(Collectors.toList());

        ExamQuestionResponse examQuestionResponse = ExamQuestionResponse.builder()
                .questionId(examQuestion.getNo())
                .title(examQuestion.getQuestion().getTitle())
                .answerCount(examQuestion.getQuestion().getAnswer().stream().filter(
                        Answer::getCorrect
                ).count())
                .options(options)
                .marker(examQuestion.getMarked())
                .build();

        if (!examQuestion.getUserAnswers().isEmpty()) {
            examQuestionResponse.setExplanation(examQuestion.getQuestion().getExplanation());
            examQuestionResponse.setActualAnswers(actualAnswers);
        }
        return examQuestionResponse;
    }
    @Override
    public ExamQuestionResponse getQuestion(Long examId, Long no) throws NotFoundExamQuestion {
        ExamQuestion examQuestion = examRepository.findQuestion(examId, no);
        if (examQuestion == null) {
            throw new NotFoundExamQuestion();
        }
        return mapToDto(examQuestion);
    }

    @Override
    public AnswerResponse submitAnswer(Long examId, Long no, ExamAnswerRequest request) {
        ExamQuestion examQuestion = examRepository.findQuestion(examId, no);
        if (examQuestion == null) {
            throw new NotFoundExamQuestion();
        }

        examQuestion.setUserAnswers(request.getUserAnswers());

        ExamQuestionResponse examQuestionResponse = mapToDto(examQuestion);
        return AnswerResponse.builder()
                .actualAnswers(examQuestionResponse.getActualAnswers())
                .explanation(examQuestionResponse.getExplanation())
                .build();
    }

    @Override
    public void markQuestion(Long examId, Long no) {

    }

    @Override
    public void unmarkQuestion(Long examId, Long no) {

    }

    @Override
    public ExamResultResponse getResult(Long examId) {
        return null;
    }
}

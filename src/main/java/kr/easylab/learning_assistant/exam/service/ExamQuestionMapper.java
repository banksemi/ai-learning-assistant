package kr.easylab.learning_assistant.exam.service;

import kr.easylab.learning_assistant.exam.dto.ExamQuestionResponse;
import kr.easylab.learning_assistant.exam.dto.ExamTranslationResponse;
import kr.easylab.learning_assistant.exam.dto.Option;
import kr.easylab.learning_assistant.exam.entity.ExamQuestion;
import kr.easylab.learning_assistant.question.entity.Answer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class ExamQuestionMapper {
    private final ExamQuestionTranslationService examQuestionTranslationService;

    public ExamQuestionResponse mapToDto(ExamQuestion examQuestion) {
        // 복사본을 사용하여 원본 엔티티 순서에 영향이 가지 않도록 함.
        List<Answer> answerList = new ArrayList<>(examQuestion.getQuestion().getAnswer());

        // 항상 같은 순서로 섞이도록 id 기준 정렬
        answerList.sort(Comparator.comparing(Answer::getId));

        Random random = new Random(
                examQuestion.getExam().getRandomSeed() + examQuestion.getNo()
        );

        Collections.shuffle(answerList, random);

        ExamTranslationResponse translation = examQuestionTranslationService.translateAnswers(
                examQuestion.getExam().getId(),
                examQuestion.getNo()
        ).join();

        List<String> actualAnswers = new ArrayList<>();
        List<Option> options = IntStream.range(0, answerList.size())
                .mapToObj(index -> {
                    char keyChar = (char) ('A' + index);
                    Answer answer = answerList.get(index);

                    if (answer.getCorrect())
                        actualAnswers.add(String.valueOf(keyChar));

                    return Option.builder()
                            .key(String.valueOf(keyChar))
                            .value(translation.getAnswers().get(answer.getId()))
                            .build();
                })
                .collect(Collectors.toList());

        ExamQuestionResponse examQuestionResponse = ExamQuestionResponse.builder()
                .questionId(examQuestion.getNo())
                .title(translation.getTitle())
                .answerCount(examQuestion.getQuestion().getAnswer().stream().filter(
                        Answer::getCorrect
                ).count())
                .options(options)
                .marker(examQuestion.getMarked())
                .build();

        if (!examQuestion.getUserAnswers().isEmpty()) {
            examQuestionResponse.setUserAnswers(examQuestion.getUserAnswers());
            examQuestionResponse.setExplanation(examQuestionTranslationService.translateExplanation(
                    examQuestion.getExam().getId(),
                    examQuestion.getNo()
            ).join());
            examQuestionResponse.setActualAnswers(actualAnswers);
        }
        return examQuestionResponse;
    }
}

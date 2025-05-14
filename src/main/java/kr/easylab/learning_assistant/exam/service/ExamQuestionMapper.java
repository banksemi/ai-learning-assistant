package kr.easylab.learning_assistant.exam.service;

import kr.easylab.learning_assistant.exam.dto.ExamQuestionResponse;
import kr.easylab.learning_assistant.exam.dto.ExamTranslationResponse;
import kr.easylab.learning_assistant.exam.dto.Option;
import kr.easylab.learning_assistant.exam.entity.ExamQuestion;
import kr.easylab.learning_assistant.exam.service.translation.ExamTranslationPredictiveService;
import kr.easylab.learning_assistant.exam.service.translation.ExamTranslationService;
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
    private final ExamTranslationService examTranslationService;

    public ExamQuestionResponse mapToDto(ExamQuestion examQuestion) {
        // 복사본을 사용하여 원본 엔티티 순서에 영향이 가지 않도록 함.
        List<Answer> answerList = new ArrayList<>(examQuestion.getQuestion().getAnswer());

        // 항상 같은 순서로 섞이도록 id 기준 정렬
        answerList.sort(Comparator.comparing(Answer::getId));

        Random random = new Random(
                examQuestion.getExam().getRandomSeed() + examQuestion.getNo()
        );

        Collections.shuffle(answerList, random);

        ExamTranslationResponse translation = examTranslationService.translate(
                examQuestion.getExam().getId(),
                examQuestion.getNo()
        );

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
            examQuestionResponse.setExplanation(translation.getExplanation());
            examQuestionResponse.setActualAnswers(actualAnswers);
        }
        return examQuestionResponse;
    }

    public String mapToString(ExamQuestion examQuestion) {
        ExamQuestionResponse examQuestionResponse = mapToDto(examQuestion);
        StringBuilder sb = new StringBuilder();
        sb.append("## 문제 ").append(examQuestion.getNo() + 1).append(" ").append(examQuestion.getCorrect() ? "(정답)" : "(틀림)").append("\n");
        sb.append(examQuestionResponse.getTitle()).append("\n");
        sb.append("### 보기\n").append(formatOptions(examQuestionResponse.getOptions())).append("\n");
        sb.append("### 실제 정답\n").append(formatAnswers(examQuestionResponse.getActualAnswers())).append("\n");
        sb.append("### 선택한 답\n").append(formatAnswers(examQuestionResponse.getUserAnswers())).append("\n");
        sb.append("### 해설\n").append(examQuestionResponse.getExplanation()).append("\n");
        sb.append("\n");
        return sb.toString();
    }

    private String formatOptions(List<Option> options) {
        StringBuilder sb = new StringBuilder();
        for (Option option : options) {
            sb.append("- ").append(option.getKey()).append(": ").append(option.getValue()).append("\n");
        }
        return sb.toString();
    }

    private String formatAnswers(List<String> answers) {
        if (answers == null || answers.isEmpty()) {
            return "답 없음";
        }
        return String.join(", ", answers);
    }
}

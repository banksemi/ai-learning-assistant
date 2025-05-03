package kr.easylab.learning_assistant.exam.service;

import kr.easylab.learning_assistant.exam.dto.ExamTranslationResponse;
import kr.easylab.learning_assistant.exam.entity.ExamQuestion;
import kr.easylab.learning_assistant.exam.repository.ExamRepository;
import kr.easylab.learning_assistant.question.entity.Answer;
import kr.easylab.learning_assistant.translation.dto.Language;
import kr.easylab.learning_assistant.translation.service.TranslationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ExamQuestionTranslationService {
    private final TranslationService translationService;
    private final ExamRepository examRepository;

    @Async
    public CompletableFuture<String> translateExplanation(Long examId, Long no) {
        ExamQuestion examQuestion = examRepository.findQuestion(examId, no);
        if (examQuestion == null)
            return CompletableFuture.completedFuture(null);

        if (examQuestion.getQuestion().getExplanation() == null)
            return CompletableFuture.completedFuture(null);

        return CompletableFuture.completedFuture(translationService.translate(examQuestion.getQuestion().getExplanation(), Language.KOREAN));
    }

    @Async
    public CompletableFuture<ExamTranslationResponse> translateAnswers(Long examId, Long no) {
        ExamQuestion examQuestion = examRepository.findQuestion(examId, no);
        if (examQuestion == null)
            return CompletableFuture.completedFuture(null);

        String title = examQuestion.getQuestion().getTitle();
        List<Answer> answers = examQuestion.getQuestion().getAnswer();

        List<String> items = new ArrayList<>();
        items.add(title);
        items.addAll(answers.stream().map(Answer::getText).toList());

        List<String> translated = translationService.translate(items, Language.KOREAN);
        String translatedTitle = translated.getFirst();

        Map<Long, String> translatedAnswers = IntStream.range(0, answers.size())
                .mapToObj(index -> Map.entry(
                        answers.get(index).getId(),
                        translated.get(index+1)
                ))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        return CompletableFuture.completedFuture(ExamTranslationResponse.builder()
                .title(translatedTitle)
                .answers(translatedAnswers)
                .build());
    }
}

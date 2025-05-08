package kr.easylab.learning_assistant.exam.service.translation;

import kr.easylab.learning_assistant.exam.dto.ExamTranslationRequest;
import kr.easylab.learning_assistant.exam.dto.ExamTranslationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Primary;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Slf4j
@Primary
public class ExamTranslationPredictiveService implements ExamTranslationService {
    @Autowired
    @Lazy
    private ExamTranslationPredictiveService self;

    @Value( "${translation.prediction_count}")
    private int predictionCount;

    @Qualifier("translation-service-base")
    private final ExamTranslationService examTranslationService;

    @Cacheable(value = "exam-translation", sync=true)
    public ExamTranslationResponse performSingleTranslation(Long examId, Long no) {
            return examTranslationService.translate(examId, no);
    }

    @Async
    protected CompletableFuture<ExamTranslationResponse> asyncTranslate(Long examId, Long no) {
        return CompletableFuture.completedFuture(self.performSingleTranslation(examId, no));
    }

    public ExamTranslationResponse translate(Long examId, Long no) {
        CompletableFuture<ExamTranslationResponse> future = self.asyncTranslate(examId, no);
        for (int i = 0; i < predictionCount; i++) {
            self.asyncTranslate(examId, no + i + 1);
        }

        return future.join();
    }
}

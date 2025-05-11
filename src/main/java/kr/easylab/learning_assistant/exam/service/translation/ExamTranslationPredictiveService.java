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

import java.util.ArrayList;
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
    @Value( "${translation.prediction_count}")
    private int predictionCount;

    private final ExamTranslationAsyncService examTranslationAsyncService;


    public ExamTranslationResponse translate(Long examId, Long no) {
        List<CompletableFuture<ExamTranslationResponse>> tasks = new ArrayList<>();
        for (int i = 0; i < predictionCount + 1; i++) {
            tasks.add(examTranslationAsyncService.translate(examId, no + i));
        }
        return tasks.getFirst().join();
    }
}

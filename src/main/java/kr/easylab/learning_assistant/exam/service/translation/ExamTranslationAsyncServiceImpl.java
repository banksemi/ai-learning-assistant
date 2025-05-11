package kr.easylab.learning_assistant.exam.service.translation;

import kr.easylab.learning_assistant.exam.dto.ExamTranslationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class ExamTranslationAsyncServiceImpl implements ExamTranslationAsyncService {
    private final ExamTranslationService examTranslationService;

    public ExamTranslationAsyncServiceImpl(
            @Qualifier("translation-service-base") ExamTranslationService examTranslationService) {
        this.examTranslationService = examTranslationService;
    }

    @Override
    @Async
    public CompletableFuture<ExamTranslationResponse> translate(Long examId, Long no) {
        return CompletableFuture.completedFuture(examTranslationService.translate(examId, no));
    }
}

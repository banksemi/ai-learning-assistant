package kr.easylab.learning_assistant.exam.service.translation;

import kr.easylab.learning_assistant.exam.dto.ExamTranslationResponse;

import java.util.concurrent.CompletableFuture;

public interface ExamTranslationService {
    ExamTranslationResponse translate(Long examId, Long no);
}

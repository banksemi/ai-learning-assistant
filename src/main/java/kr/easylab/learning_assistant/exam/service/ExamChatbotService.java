package kr.easylab.learning_assistant.exam.service;

import kr.easylab.learning_assistant.exam.dto.ExamChatRequest;
import kr.easylab.learning_assistant.exam.dto.ExamChatResponse;

public interface ExamChatbotService {
    ExamChatResponse chat(Long examId, Long no, ExamChatRequest request);
}

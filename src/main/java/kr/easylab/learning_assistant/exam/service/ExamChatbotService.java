package kr.easylab.learning_assistant.exam.service;

import kr.easylab.learning_assistant.exam.dto.ExamChatRequest;
import kr.easylab.learning_assistant.exam.dto.ExamChatResponse;
import kr.easylab.learning_assistant.exam.dto.ExamChatbotPresetResponse;

import java.util.List;

public interface ExamChatbotService {
    ExamChatResponse chat(Long examId, Long no, ExamChatRequest request);
    ExamChatbotPresetResponse generatePresetMessages(Long examId, Long no);
}

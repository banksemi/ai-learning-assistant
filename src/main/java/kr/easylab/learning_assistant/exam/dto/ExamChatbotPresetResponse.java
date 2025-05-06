package kr.easylab.learning_assistant.exam.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Builder
@Data
public class ExamChatbotPresetResponse {
    private List<String> messages;
}

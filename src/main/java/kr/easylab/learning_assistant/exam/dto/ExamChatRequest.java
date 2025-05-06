package kr.easylab.learning_assistant.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
public class ExamChatRequest {
    private String user;
}

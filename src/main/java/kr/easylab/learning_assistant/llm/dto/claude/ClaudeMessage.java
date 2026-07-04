package kr.easylab.learning_assistant.llm.dto.claude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ClaudeMessage {
    private String role;
    private String content;
}

package kr.easylab.learning_assistant.llm.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class LLMMessage {
    public enum Role {
        USER, ASSISTANT
    }
    private Role role;
    private String text;
}

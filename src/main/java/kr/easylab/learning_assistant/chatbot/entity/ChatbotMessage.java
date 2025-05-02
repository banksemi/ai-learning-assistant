package kr.easylab.learning_assistant.chatbot.entity;

import jakarta.persistence.*;
import kr.easylab.learning_assistant.llm.dto.LLMMessage;
import lombok.*;

@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@Setter
public class ChatbotMessage {
    @Id
    @GeneratedValue
    @Column(name = "chatbot_message_id", nullable = false)
    private Long id;

    @JoinColumn(name = "chatbot_id", nullable = false)
    @ManyToOne
    private Chatbot chatbot;

    @Column
    private LLMMessage.Role role;

    @Column(nullable = false, length = 100000)
    private String message;
}

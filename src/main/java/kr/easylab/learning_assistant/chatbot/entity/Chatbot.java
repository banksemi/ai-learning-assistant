package kr.easylab.learning_assistant.chatbot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.*;

@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@Setter
public class Chatbot {
    @Id
    @GeneratedValue
    @Column(name = "chatbot_id", nullable = false)
    private Long id;

    @Column
    private String prefixPrompt;
}

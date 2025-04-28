package kr.easylab.learning_assistant.question.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class Answer {
    @Id
    @GeneratedValue
    @Column(name = "answer_id", nullable = false)
    private Long id;

    @Column(nullable = false, length = 10000)
    private String text;

    @Column(nullable = false)
    private Boolean correct;
}

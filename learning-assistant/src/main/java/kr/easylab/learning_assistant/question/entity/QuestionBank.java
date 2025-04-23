package kr.easylab.learning_assistant.question.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class QuestionBank {
    @Id
    @GeneratedValue
    @Column(name = "question_bank_id", nullable = false)
    private Long id;

    @Column(nullable = false)
    private String title;

    private Language language;
}

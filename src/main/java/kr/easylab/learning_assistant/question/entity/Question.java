package kr.easylab.learning_assistant.question.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class Question {
    @Id
    @GeneratedValue
    @Column(name = "question_id", nullable = false)
    private Long id;

    @Column(nullable = false, length = 10000)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_bank_id", nullable = false)
    private QuestionBank questionBank;

    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "question_id", nullable = false)
    private List<Answer> answer;

    @Column(nullable = true, length = 10000)
    private String explanation;
}

package kr.easylab.learning_assistant.exam.entity;

import jakarta.persistence.*;
import kr.easylab.learning_assistant.question.entity.Question;
import lombok.*;

import java.util.List;

@Entity
@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@Table(uniqueConstraints = {
    @UniqueConstraint(
        name = "UK_exam_question_exam_id_no",
        columnNames = {"exam_id", "no"}
    )
})
public class ExamQuestion {
    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(nullable = false)
    private Long no;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false)
    private Boolean marked;

    @ElementCollection
    @CollectionTable(
            name = "exam_question_user_answers",
            joinColumns = @JoinColumn(name = "exam_question_id")
    )
    @Column(name = "answer", nullable = false)
    @Setter
    private List<String> userAnswers;
}

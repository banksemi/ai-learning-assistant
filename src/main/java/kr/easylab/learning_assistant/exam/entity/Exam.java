package kr.easylab.learning_assistant.exam.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class Exam {
    @Id
    @GeneratedValue
    @Column(name = "exam_id", nullable = false)
    private Long id;

    @Column(nullable = false)
    private String language;

    @Column(nullable = false)
    private Long randomSeed;

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExamQuestion> examQuestions;
}

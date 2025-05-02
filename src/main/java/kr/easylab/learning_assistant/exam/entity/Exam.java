package kr.easylab.learning_assistant.exam.entity;

import jakarta.persistence.*;
import kr.easylab.learning_assistant.chatbot.entity.Chatbot;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.util.List;

@Entity
@Builder
@Getter
@NoArgsConstructor
@Setter
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
    @OrderBy("no ASC")
    private List<ExamQuestion> examQuestions;

    @JoinColumn(nullable = true)
    @OneToOne(cascade = CascadeType.ALL)
    private Chatbot chatbot;
}

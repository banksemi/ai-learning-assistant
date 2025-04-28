package kr.easylab.learning_assistant.exam.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import kr.easylab.learning_assistant.exam.entity.Exam;
import kr.easylab.learning_assistant.exam.entity.ExamQuestion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ExamRepository {
    private final EntityManager em;

    public void save(Exam exam) {
        em.persist(exam);
    }

    public Long getQuestionCount(Long examId) {
        return em.createQuery("SELECT COUNT(q) FROM ExamQuestion q WHERE q.exam.id = :examId", Long.class)
                .setParameter("examId", examId)
                .getSingleResult();
    }

    public Exam findById(Long examId) {
        return em.find(Exam.class, examId);
    }

    public ExamQuestion findQuestion(Long examId, Long no) {
        try {
            return em.createQuery("SELECT q FROM ExamQuestion q WHERE q.exam.id = :examId AND q.no = :no", ExamQuestion.class)
                    .setParameter("examId", examId)
                    .setParameter("no", no)
                    .getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }
}

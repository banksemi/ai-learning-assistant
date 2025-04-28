package kr.easylab.learning_assistant.question.repository;

import jakarta.persistence.EntityManager;
import kr.easylab.learning_assistant.question.entity.Question;
import kr.easylab.learning_assistant.question.entity.QuestionBank;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class QuestionBankRepository {
    private final EntityManager em;

    public QuestionBank findOne(Long question_id) {
        return em.find(QuestionBank.class, question_id);
    }

    public List<QuestionBank> findAll() {
        return em.createQuery("SELECT q FROM QuestionBank q", QuestionBank.class).getResultList();
    }

    public void save(QuestionBank question){
        em.persist(question);
    }

    public void save(Question question) {
        em.persist(question);
    }

}

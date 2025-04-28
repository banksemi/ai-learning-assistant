package kr.easylab.learning_assistant.question.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;
import kr.easylab.learning_assistant.question.dto.QuestionBankResponse;
import kr.easylab.learning_assistant.question.entity.Question;
import kr.easylab.learning_assistant.question.entity.QuestionBank;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class QuestionBankRepository {
    private final EntityManager em;

    public QuestionBank findOne(Long question_id) {
        return em.find(QuestionBank.class, question_id);
    }

    public List<QuestionBankResponse> findAllWithQuestionCount() {
        List<Tuple> resultList = em.createQuery("SELECT qb.id as id, qb.title as title, count(q) as questionCount FROM QuestionBank qb LEFT JOIN Question q ON qb = q.questionBank GROUP BY qb.id", Tuple.class).getResultList();

        return resultList.stream().map(tuple -> QuestionBankResponse.builder()
                .questionBankId(tuple.get("id", Long.class))
                .title(tuple.get("title", String.class))
                .questions(tuple.get("questionCount", Long.class))
                .build()
        ).collect(Collectors.toList());
    }

    public void save(QuestionBank question){
        em.persist(question);
    }

    public void save(Question question) {
        em.persist(question);
    }

}

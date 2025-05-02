package kr.easylab.learning_assistant.chatbot.repository;

import jakarta.persistence.EntityManager;
import kr.easylab.learning_assistant.chatbot.entity.Chatbot;
import kr.easylab.learning_assistant.chatbot.entity.ChatbotMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class SQLChatbotRepository implements ChatbotRepository {
    private final EntityManager em;

    @Override
    public Chatbot findChatbotById(Long id) {
        return em.find(Chatbot.class, id);
    }

    @Override
    public void save(Chatbot chatbot) {
        em.persist(chatbot);
    }

    @Override
    public void save(ChatbotMessage chatbotMessage) {
        em.persist(chatbotMessage);
    }

    @Override
    public List<ChatbotMessage> findChatbotMessagesByChatbotId(Long chatbotId, Long limit) {
        List<ChatbotMessage> messages = em.createQuery("SELECT c FROM ChatbotMessage as c WHERE c.chatbot.id = :chatbotId ORDER BY c.id DESC", ChatbotMessage.class)
                .setParameter("chatbotId", chatbotId)
                .setMaxResults(limit.intValue())
                .getResultList();
        Collections.reverse(messages);
        return messages;
    }
}

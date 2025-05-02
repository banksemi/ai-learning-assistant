package kr.easylab.learning_assistant.chatbot.repository;

import kr.easylab.learning_assistant.chatbot.entity.Chatbot;
import kr.easylab.learning_assistant.chatbot.entity.ChatbotMessage;

import java.util.List;
import java.util.Optional;

public interface ChatbotRepository {

    Chatbot findChatbotById(Long id);

    void save(Chatbot chatbot);
    void save(ChatbotMessage chatbotMessage);

    List<ChatbotMessage> findChatbotMessagesByChatbotId(Long chatbotId, Long limit);
}

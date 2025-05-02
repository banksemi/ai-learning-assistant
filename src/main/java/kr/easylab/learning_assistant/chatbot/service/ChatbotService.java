package kr.easylab.learning_assistant.chatbot.service;

import kr.easylab.learning_assistant.chatbot.entity.Chatbot;
import kr.easylab.learning_assistant.chatbot.entity.ChatbotMessage;

import java.util.List;

public interface ChatbotService {
    Long createChatbot(String prefixPrompt);
    Chatbot getChatbot(Long chatbotId);
    void addUserMessage(Long chatbotId, String userMessage);
    void addAssistantMessage(Long chatbotId, String assistantMessage);
    String generateMessage(Long chatbotId, String prompt);

    List<ChatbotMessage> getChatbotMessages(Long chatbotId, Long limit);
}

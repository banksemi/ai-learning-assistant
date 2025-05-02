package kr.easylab.learning_assistant.chatbot.service;

import jakarta.transaction.Transactional;
import kr.easylab.learning_assistant.chatbot.entity.Chatbot;
import kr.easylab.learning_assistant.chatbot.entity.ChatbotMessage;
import kr.easylab.learning_assistant.chatbot.exception.NotFoundChatbot;
import kr.easylab.learning_assistant.chatbot.repository.ChatbotRepository;
import kr.easylab.learning_assistant.llm.dto.LLMMessage;
import kr.easylab.learning_assistant.llm.service.LLMService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ChatbotServiceImpl implements ChatbotService {
    private final ChatbotRepository chatbotRepository;
    private final LLMService llmService;

    public Chatbot getChatbot(Long chatbotId) throws NotFoundChatbot {
        Chatbot chatbot = chatbotRepository.findChatbotById(chatbotId);
        if (chatbot == null)
            throw new NotFoundChatbot();
        return chatbot;
    }

    @Override
    public Long createChatbot(String prefixPrompt) {
        Chatbot chatbot = Chatbot.builder()
                .prefixPrompt(prefixPrompt)
                .build();
        chatbotRepository.save(chatbot);
        return chatbot.getId();
    }

    @Override
    public void addUserMessage(Long chatbotId, String userMessage) {
        Chatbot chatbot = getChatbot(chatbotId);

        ChatbotMessage message = ChatbotMessage.builder()
                .chatbot(chatbot)
                .role(LLMMessage.Role.USER)
                .message(userMessage)
                .build();
        chatbotRepository.save(message);
    }

    @Override
    public void addAssistantMessage(Long chatbotId, String assistantMessage) {
        Chatbot chatbot = getChatbot(chatbotId);

        ChatbotMessage message = ChatbotMessage.builder()
                .chatbot(chatbot)
                .role(LLMMessage.Role.ASSISTANT)
                .message(assistantMessage)
                .build();
        chatbotRepository.save(message);
    }

    @Override
    public String generateMessage(Long chatbotId, String prompt) {
        Chatbot chatbot = getChatbot(chatbotId);

        String finalPrompt = chatbot.getPrefixPrompt() + "\n" + prompt;
        List<LLMMessage> messages = chatbotRepository.findChatbotMessagesByChatbotId(chatbotId, 20L)
                .stream()
                .map(chatbotMessage -> {
                    return LLMMessage.builder()
                            .role(chatbotMessage.getRole())
                            .text(chatbotMessage.getMessage())
                            .build();
                }).toList();

        String generatedMessage = llmService.generate(finalPrompt, messages);
        addAssistantMessage(chatbotId, generatedMessage);

        return generatedMessage;
    }

    @Override
    public List<ChatbotMessage> getChatbotMessages(Long chatbotId, Long limit) {
        return List.of();
    }
}

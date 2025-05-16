package kr.easylab.learning_assistant.chatbot.service;

import jakarta.transaction.Transactional;
import kr.easylab.learning_assistant.chatbot.entity.Chatbot;
import kr.easylab.learning_assistant.chatbot.entity.ChatbotMessage;
import kr.easylab.learning_assistant.chatbot.exception.NotFoundChatbot;
import kr.easylab.learning_assistant.chatbot.repository.ChatbotRepository;
import kr.easylab.learning_assistant.llm.dto.LLMConfig;
import kr.easylab.learning_assistant.llm.dto.LLMMessage;
import kr.easylab.learning_assistant.llm.service.LLMService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.util.List;

@Service
@Transactional
public class ChatbotServiceImpl implements ChatbotService {
    private final ChatbotRepository chatbotRepository;
    private final LLMService llmService;

    private final ChatbotServiceImpl self;
    public ChatbotServiceImpl(ChatbotRepository chatbotRepository, LLMService llmService, @Lazy ChatbotServiceImpl self) {
        this.chatbotRepository = chatbotRepository;
        this.llmService = llmService;
        this.self = self;
    }

    private List<LLMMessage> getMessages(Long chatbotId) {
        return chatbotRepository.findChatbotMessagesByChatbotId(chatbotId, 20L)
                .stream()
                .map(chatbotMessage -> {
                    return LLMMessage.builder()
                            .role(chatbotMessage.getRole())
                            .text(chatbotMessage.getMessage())
                            .build();
                }).toList();
    }

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
        String generatedMessage = llmService.generate(getMessages(chatbotId), LLMConfig.builder().prompt(finalPrompt).build());
        addAssistantMessage(chatbotId, generatedMessage);

        return generatedMessage;
    }

    @Override
    public Flux<String> generateMessageStream(Long chatbotId, String prompt) {
        Chatbot chatbot = getChatbot(chatbotId);

        String finalPrompt = chatbot.getPrefixPrompt() + "\n" + prompt;
        StringBuilder sb = new StringBuilder();

        return llmService.generateStream(getMessages(chatbotId), LLMConfig.builder().prompt(finalPrompt).build())
                .doOnNext(sb::append)
                .publishOn(Schedulers.boundedElastic())
                .doOnComplete(() -> self.addAssistantMessage(chatbotId, sb.toString()));
    }

    @Override
    public List<ChatbotMessage> getChatbotMessages(Long chatbotId, Long limit) {
        return List.of();
    }
}

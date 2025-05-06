package kr.easylab.learning_assistant.llm.service;

import kr.easylab.learning_assistant.llm.dto.LLMMessage;
import reactor.core.publisher.Flux;

import java.util.List;

public interface LLMService {
    String generate(String prompt, List<LLMMessage> messages);
    Flux<String> generateStream(String prompt, List<LLMMessage> messages);
    <T> T generate(String prompt, List<LLMMessage> messages, Class<T> clazz);
}

package kr.easylab.learning_assistant.llm.service;

import kr.easylab.learning_assistant.llm.dto.LLMConfig;
import kr.easylab.learning_assistant.llm.dto.LLMMessage;
import reactor.core.publisher.Flux;

import java.util.List;

public interface LLMService {
    String generate(List<LLMMessage> messages, LLMConfig config);
    Flux<String> generateStream(List<LLMMessage> messages, LLMConfig config);
    <T> T generate(List<LLMMessage> messages, Class<T> clazz, LLMConfig config);
}

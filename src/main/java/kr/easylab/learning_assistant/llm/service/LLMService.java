package kr.easylab.learning_assistant.llm.service;

import kr.easylab.learning_assistant.llm.dto.LLMMessage;

import java.util.List;

public interface LLMService {
    String generate(String prompt, List<LLMMessage> messages);
    // with stream
    <T> T generate(String prompt, List<LLMMessage> messages, Class<T> clazz);
}

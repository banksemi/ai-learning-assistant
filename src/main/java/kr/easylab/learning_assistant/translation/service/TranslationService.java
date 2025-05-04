package kr.easylab.learning_assistant.translation.service;

import kr.easylab.learning_assistant.translation.dto.Language;

import java.util.List;

public interface TranslationService {
    String translate(String text, Language language);
    List<String> translate(List<String> texts, Language language);
    <T> T translate(T object, Language language, Class<T> clazz);
}

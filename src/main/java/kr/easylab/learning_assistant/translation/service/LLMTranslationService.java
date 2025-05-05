package kr.easylab.learning_assistant.translation.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.easylab.learning_assistant.llm.dto.LLMMessage;
import kr.easylab.learning_assistant.llm.service.LLMService;
import kr.easylab.learning_assistant.translation.dto.Language;
import kr.easylab.learning_assistant.translation.dto.TranslatedResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LLMTranslationService implements TranslationService {
    private final ObjectMapper objectMapper;
    private final LLMService llmService;
    private final String prompt = """
        당신은 입력된 데이터를 받아 정해진 언어로 번역을 해주는 AI입니다.
        번역 주의사항
        - 번역시 서비스 명칭인 경우 원문을 유지해주거나 원문 명칭과 번역된 서비스 명칭을 함께 표기해주세요.
        - 변수 명이나 지칭으로 사용되는 요소들은 원본 언어를 유지해주세요.
        - 원본 스키마와 동일한 스키마를 제공해야합니다.
        - 줄바꿈은 단순히 줄바꿈으로 입력하세요. (스키마에 포함된 List의 개수를 변경하지 마세요)
    """;

    @Override
    public String translate(String text, Language language) {
        return translate(List.of(text), language).get(0);
    }

    @Override
    public List<String> translate(List<String> texts, Language language) {
        try {
            String jsonText = objectMapper.writeValueAsString(texts);

            TranslatedResponse result = llmService.generate(
                    prompt + "# 목표 언어: \n" + language,
                    List.of(LLMMessage.builder()
                            .role(LLMMessage.Role.USER)
                            .text(jsonText)
                            .build()),
                    TranslatedResponse.class
            );
            log.info("translation result: {}", result);
            return result.getTranslated();
        } catch (JsonProcessingException e) {
            throw new RuntimeException("객체를 JSON으로 변환하는 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    public <T> T translate(T object, Language language, Class<T> clazz) {
        try {
            String jsonText = objectMapper.writeValueAsString(object);

            T result = llmService.generate(
                    prompt + "# 목표 언어: \n" + language,
                    List.of(LLMMessage.builder()
                            .role(LLMMessage.Role.USER)
                            .text(jsonText)
                            .build()),
                    clazz
            );
            log.info("translation result: {}", result);
            return result;
        } catch (JsonProcessingException e) {
            throw new RuntimeException("객체를 JSON으로 변환하는 중 오류가 발생했습니다.", e);
        }
    }
}

package kr.easylab.learning_assistant.translation.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.easylab.learning_assistant.llm.dto.LLMConfig;
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
        - 영어로된 서비스 명칭은 번역 명칭(원문 명칭)의 표기법을 사용해주세요.
        - 변수 명이나 지칭으로 사용되는 요소들은 의미를 유지해야합니다. 
        - 영어로 작성된 코드는 원문을 유지합니다.
        - 입력 스키마와 출력 스키마의 구조(배열 개수 등)가 모두 일치해야합니다.
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
                    List.of(LLMMessage.builder()
                            .role(LLMMessage.Role.USER)
                            .text(jsonText)
                            .build()),
                    TranslatedResponse.class,
                    LLMConfig.builder()
                            .prompt(prompt + "# 목표 언어: \n" + language)
                            .thinking(LLMConfig.ThinkingMode.no)
                            .build()
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
                    List.of(LLMMessage.builder()
                            .role(LLMMessage.Role.USER)
                            .text(jsonText)
                            .build()),
                    clazz,
                    LLMConfig.builder()
                            .prompt(prompt + "# 목표 언어: \n" + language)
                            .thinking(LLMConfig.ThinkingMode.no)
                            .build()
            );
            log.info("translation result: {}", result);
            return result;
        } catch (JsonProcessingException e) {
            throw new RuntimeException("객체를 JSON으로 변환하는 중 오류가 발생했습니다.", e);
        }
    }
}

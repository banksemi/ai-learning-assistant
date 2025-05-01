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
        번역시 서비스 명칭인 경우 원문을 유지해주거나 원문 명칭과 번역된 서비스 명칭을 함께 표기해주세요.
        
        입력한 배열 내의 항목 수와 출력되는 배열 내의 항목 수가 동일해야합니다.
        입력된 텍스트의 형식을 유지해주세요.
        
        # 예시
        입력 (항목 수 5개):
        "[\\"You have chosen AWS Elastic Beanstalk to upload your application code and allow it to handle details such as provisioning resources and monitoring.\n\nWhen creating configuration files for AWS Elastic Beanstalk which naming convention should you follow?\\",\\".config/<mysettings>.ebextensions\\",\\".config_<mysettings>.ebextensions\\",\\".ebextensions_<mysettings>.config\\",\\".ebextensions/<mysettings>.config\\"]"
        
        출력 (항목 수 5개):
        {
          "translated_texts": [
            "애플리케이션 코드를 업로드하고 리소스 프로비저닝 및 모니터링과 같은 세부 사항을 처리하도록 AWS Elastic Beanstalk를 선택했습니다.\n\nAWS Elastic Beanstalk에 대한 구성 파일을 만들 때 따라야 할 명명 규칙은 무엇입니까?",
            ".config/<mysettings>.ebextensions",
            ".config_<mysettings>.ebextensions",
            ".ebextensions_<mysettings>.config",
            ".ebextensions/<mysettings>.config"
          ]
        }
    """;

    @Override
    @Cacheable("translations")
    public String translate(String text, Language language) {
        return translate(List.of(text), language).get(0);
    }

    @Override
    @Cacheable("translations")
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
            return result.getTranslatedTexts();
        } catch (JsonProcessingException e) {
            throw new RuntimeException("객체를 JSON으로 변환하는 중 오류가 발생했습니다.", e);
        }
    }
}

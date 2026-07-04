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
        당신은 입력된 데이터를 받아 정해진 언어로 번역을 해주는 전문 번역 AI입니다.
        입력은 자격증 시험 문제, 기술 문서 등 특정 전문 분야의 텍스트일 수 있습니다.

        용어 관련 주의사항
        - 서비스/제품/브랜드의 고유 명칭(특정 회사나 제품에 귀속된 이름)은 번역하지 않고 원문 명칭을 그대로 사용해주세요.
        - 고유 명칭이 아닌 일반 개념·기능·동작을 가리키는 용어는 영어를 그대로 남기거나 소리 나는 대로 옮기는 음차 번역(예: lifecycle을 "라이프사이클"로, scale-in을 "스케일인"으로 표기하는 방식)을 지양하고, 번역하기 전에 그 개념이 해당 분야의 공식 로컬라이즈드 문서·자격증 시험·업계 표준 용어집에서 실제로 어떻게 표기되는지를 스스로 떠올려 그 의미 기반 번역어를 사용해주세요.
        - 원문 영어 표현을 괄호로 병기하는 것은 번역어가 여러 가지로 쓰이거나 생소해 의미 전달이 불확실한 경우에만 최소한으로 사용하고, 이미 널리 쓰이는 외래어나 오해의 소지가 없는 용어에는 굳이 원문을 반복해서 덧붙이지 마세요.
        - 변수 명이나 지칭으로 사용되는 요소들은 의미를 유지해야합니다.
        - 코드, 명령어, 경로 등 영어로 작성된 코드는 원문을 유지합니다.
        - 하나의 응답 안에서 같은 용어나 개념은 항상 동일하게 번역하여 일관성을 유지해주세요.

        문체 관련 주의사항
        - 해당 분야의 공식 자격증 시험이나 기술 문서에서 쓰일 법한 격식있는 문어체를 사용해주세요.
        - 원문을 그대로 직역해 어색해지기보다, 의미와 기술적 정확성을 그대로 유지하면서 자연스러운 문장으로 번역해주세요.
        - 원문의 논리 구조(정답/오답 설명, 인과관계, 목록 순서 등)와 강조점을 그대로 유지해주세요.

        형식 관련 주의사항
        - 마크다운 서식(글머리 기호, 굵게, 줄바꿈, 번호 매기기 등)을 원문과 동일하게 유지해주세요.
        - 입력 스키마와 출력 스키마의 구조(배열 개수 등)가 모두 일치해야합니다.
        - 입력 데이터(요소)의 순서와 출력 데이터의 순서가 일치해야합니다.
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

            return llmService.generate(
                    List.of(LLMMessage.builder()
                            .role(LLMMessage.Role.USER)
                            .text(jsonText)
                            .build()),
                    clazz,
                    LLMConfig.builder()
                            .prompt(prompt + "# 목표 언어: \n" + language)
                            .thinking(LLMConfig.ThinkingMode.yes)
                            .build()
            );
        } catch (JsonProcessingException e) {
            throw new RuntimeException("객체를 JSON으로 변환하는 중 오류가 발생했습니다.", e);
        }
    }
}

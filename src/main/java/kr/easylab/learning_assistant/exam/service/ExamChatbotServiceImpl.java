package kr.easylab.learning_assistant.exam.service;

import kr.easylab.learning_assistant.chatbot.entity.Chatbot;
import kr.easylab.learning_assistant.chatbot.service.ChatbotService;
import kr.easylab.learning_assistant.exam.dto.*;
import kr.easylab.learning_assistant.exam.entity.Exam;
import kr.easylab.learning_assistant.exam.entity.ExamQuestion;
import kr.easylab.learning_assistant.exam.exception.NotFoundExamQuestion;
import kr.easylab.learning_assistant.exam.repository.ExamRepository;
import kr.easylab.learning_assistant.llm.dto.LLMMessage;
import kr.easylab.learning_assistant.llm.service.LLMService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamChatbotServiceImpl implements ExamChatbotService {
    private final ExamQuestionMapper examQuestionMapper;
    private final ChatbotService chatbotService;
    private final ExamRepository examRepository;
    private final LLMService llmService;

    @Override
    @Transactional
    public ExamChatResponse chat(Long examId, Long no, ExamChatRequest request) {
        ExamQuestion examQuestion = examRepository.findQuestion(examId, no);
        if (examQuestion == null) {
            throw new NotFoundExamQuestion();
        }

        Chatbot chatbot = examQuestion.getChatbot();
        if (chatbot == null) {
            Long chatbotId = chatbotService.createChatbot(null);
            chatbot = chatbotService.getChatbot(chatbotId);
            examQuestion.setChatbot(chatbot);
        }
        chatbotService.addUserMessage(chatbot.getId(), request.getUser());

        String prompt = """
        사용자가 문제를 잘 학습할 수 있도록 돕는 AI 챗봇 입니다.
        입력된 정보를 기반으로 사용자가 어려워할 수 있는 개념을 쉽게 설명해주세요.
        """ + examQuestionMapper.mapToString(examQuestion);

        String message = chatbotService.generateMessage(chatbot.getId(), prompt);

        return new ExamChatResponse(message);
    }


    @Override
    @Transactional(readOnly = true)
    public ExamChatbotPresetResponse generatePresetMessages(Long examId, Long no) {
        ExamQuestion examQuestion = examRepository.findQuestion(examId, no);
        if (examQuestion == null) {
            throw new NotFoundExamQuestion();
        }

        String prompt = """
        학습 문제에 대해 사용자가 할만한 질문들을 생성해야합니다. (최소 3개, 최대 7개)
        주요 키워드를 중점으로 짦은 문장들로 만들어주세요.
        비슷한 답변이 나올 수 있는 질문들은 하나로 출력하세요.
        생성된 질문에는 전반적인 설명을 요청하는 질문이 제일 앞에 포함되어있어야합니다.
        
        생성된 질문 예시
        - 이해하기 쉽게 설명해주세요.
        - 제가 선택한 보기(D)는 답이 아닌 이유가 무언인가요?
        - SSM Parameter Store와 SSM Audil Trail의 차이를 모르겠어요.
        - Secrets Manager로도 문제를 해결할 수 있을까요?
        
        출력 언어:""" + examQuestion.getExam().getLanguage();
        return llmService.generate(prompt,
                List.of(
                        LLMMessage.builder().role(LLMMessage.Role.USER).text(examQuestionMapper.mapToString(examQuestion)).build()
                ), ExamChatbotPresetResponse.class);
    }
}

package kr.easylab.learning_assistant.exam.service;

import kr.easylab.learning_assistant.chatbot.entity.Chatbot;
import kr.easylab.learning_assistant.chatbot.service.ChatbotService;
import kr.easylab.learning_assistant.exam.dto.ExamChatRequest;
import kr.easylab.learning_assistant.exam.dto.ExamChatResponse;
import kr.easylab.learning_assistant.exam.dto.ExamQuestionResponse;
import kr.easylab.learning_assistant.exam.dto.Option;
import kr.easylab.learning_assistant.exam.entity.Exam;
import kr.easylab.learning_assistant.exam.entity.ExamQuestion;
import kr.easylab.learning_assistant.exam.exception.NotFoundExamQuestion;
import kr.easylab.learning_assistant.exam.repository.ExamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ExamChatbotServiceImpl implements ExamChatbotService {
    private final ExamQuestionMapper examQuestionMapper;
    private final ChatbotService chatbotService;
    private final ExamRepository examRepository;

    @Override
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
}

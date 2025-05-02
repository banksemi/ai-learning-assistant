package kr.easylab.learning_assistant.exam.service;

import kr.easylab.learning_assistant.chatbot.entity.Chatbot;
import kr.easylab.learning_assistant.chatbot.service.ChatbotService;
import kr.easylab.learning_assistant.exam.dto.ExamChatRequest;
import kr.easylab.learning_assistant.exam.dto.ExamChatResponse;
import kr.easylab.learning_assistant.exam.dto.ExamQuestionResponse;
import kr.easylab.learning_assistant.exam.dto.Option;
import kr.easylab.learning_assistant.exam.entity.Exam;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ExamChatbotServiceImpl implements ExamChatbotService {
    private final ExamService examService;
    private final ChatbotService chatbotService;

    @Override
    public ExamChatResponse chat(Long examId, Long no, ExamChatRequest request) {
        Exam exam = examService.getExam(examId); // throws NotFoundExam
        ExamQuestionResponse question = examService.getQuestion(examId, no);

        Chatbot chatbot = exam.getChatbot();
        if (exam.getChatbot() == null) {
            Long chatbotId = chatbotService.createChatbot(null);
            chatbot = chatbotService.getChatbot(chatbotId);
            exam.setChatbot(chatbot);
        }
        chatbotService.addUserMessage(chatbot.getId(), request.getUser());

        String prompt = """
        사용자가 문제를 잘 학습할 수 있도록 돕는 AI 챗봇 입니다.
        입력된 정보를 기반으로 사용자가 어려워할 수 있는 개념을 쉽게 설명해주세요.
        
        # 입력
        ## 문제
        %s
        
        ## 보기
        %s
        
        ## 답
        %s
        
        ## 해설
        %s
        """.formatted(
                    question.getTitle(),
                    formatOptions(question.getOptions()),
                    formatAnswers(question.getActualAnswers()),
                    question.getExplanation() != null ? question.getExplanation() : "해설 없음"
        );

        String message = chatbotService.generateMessage(chatbot.getId(), prompt);

        return new ExamChatResponse(message);
    }

    private String formatOptions(List<Option> options) {
        StringBuilder sb = new StringBuilder();
        for (Option option : options) {
            sb.append("- ").append(option.getKey()).append(": ").append(option.getValue()).append("\n");
        }
        return sb.toString();
    }

    private String formatAnswers(List<String> answers) {
        if (answers == null || answers.isEmpty()) {
            return "답 없음";
        }
        return String.join(", ", answers);
    }

}

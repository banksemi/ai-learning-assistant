package kr.easylab.learning_assistant.exam.service;

import kr.easylab.learning_assistant.chatbot.entity.Chatbot;
import kr.easylab.learning_assistant.exam.dto.*;
import kr.easylab.learning_assistant.exam.entity.Exam;
import kr.easylab.learning_assistant.exam.entity.ExamQuestion;
import kr.easylab.learning_assistant.exam.exception.NotFoundExam;
import kr.easylab.learning_assistant.exam.repository.ExamRepository;
import kr.easylab.learning_assistant.llm.dto.LLMMessage;
import kr.easylab.learning_assistant.llm.service.LLMService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamReportService {
    private final ExamQuestionMapper examQuestionMapper;
    private final ExamRepository examRepository;
    private final LLMService llmService;


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

    private String generateSummary(Exam exam) {
        String promptQuestions = "";

        for (ExamQuestionResponse examQuestion : exam.getExamQuestions().stream().map(examQuestionMapper::mapToDto).toList()) {
            promptQuestions += "## " + examQuestion.getTitle() + "\n";
            promptQuestions += "### 보기\n" + formatOptions(examQuestion.getOptions()) + "\n";
            promptQuestions += "### 정답\n" + formatAnswers(examQuestion.getActualAnswers()) + "\n";
            promptQuestions += "### 선택한 답\n" + formatAnswers(examQuestion.getUserAnswers()) + "\n";
            promptQuestions += "### 마킹 여부\n" + examQuestion.getMarker().toString() + "\n";
            promptQuestions += "### 해설\n" + examQuestion.getExplanation() + "\n";
            promptQuestions += "\n";
        }
        String prompt = """
        당신은 전문 티칭 어시스턴트입니다. 사용자가 입력한 시험 문제지를 기반으로 학습 피드백을 제시하세요.
        
        어떤 문제는 사용자가 헷갈려서 마킹했을수도 있으며 오답을 체크했을 수도 있습니다.
        이러한 문제들을 종합하여 사용자가 어려워하는 부분을 식별하고 공부 전략을 제시해주어야합니다.
        특히 자주 헷갈리는 개념이나 요소를 비교하거나 요약 및 정리하여 제시해주세요.
        
        사용자가 의욕을 가질 수 있도록 적절한 격려의 메세지를 포함해주세요.
        
        ## 주요 지침
        - 첫 문장은 격려의 메세지로 시작합니다. (단 "격려의 메세지" 헤더를 그대로 노출하지 마세요)
        - 3레벨 헤더 (###)로 섹션을 나눠서 제시해주세요. (1레벨, 2레벨 헤더는 사용하지 않습니다)
        """;

        return llmService.generate(prompt, List.of(LLMMessage.builder().role(LLMMessage.Role.USER).text(promptQuestions).build()));
    }

    public ExamResultResponse getResult(Long examId) {
        Exam exam = examRepository.findById(examId); // throw NotFoundExam

        if (exam == null)
            throw new NotFoundExam();

        ExamResultResponse result = new ExamResultResponse();
        result.setTotalQuestions(
                exam.getExamQuestions().stream().count()
        );
        result.setCorrectQuestions(
                exam.getExamQuestions().stream().filter(ExamQuestion::getCorrect).count()
        );
        result.setSummary(generateSummary(exam));
        result.setQuestions(
                ExamResultQuestions.builder()
                        .marked(
                                exam.getExamQuestions()
                                        .stream()
                                        .filter(ExamQuestion::getMarked)
                                        .map(examQuestionMapper::mapToDto)
                                        .collect(Collectors.toList())
                        ).incorrect(
                                exam.getExamQuestions()
                                        .stream()
                                        .filter(examQuestion -> !examQuestion.getCorrect())
                                        .map(examQuestionMapper::mapToDto)
                                        .collect(Collectors.toList())
                        ).build()
        );
        return result;
    }
}

package kr.easylab.learning_assistant.exam.service;

import kr.easylab.learning_assistant.chatbot.entity.Chatbot;
import kr.easylab.learning_assistant.exam.dto.*;
import kr.easylab.learning_assistant.exam.entity.Exam;
import kr.easylab.learning_assistant.exam.entity.ExamQuestion;
import kr.easylab.learning_assistant.exam.exception.NotFoundExam;
import kr.easylab.learning_assistant.exam.repository.ExamRepository;
import kr.easylab.learning_assistant.llm.dto.LLMMessage;
import kr.easylab.learning_assistant.llm.service.LLMService;
import kr.easylab.learning_assistant.question.entity.Answer;
import kr.easylab.learning_assistant.question.entity.Question;
import kr.easylab.learning_assistant.question.service.QuestionBankService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamReportService {
    private final ExamQuestionMapper examQuestionMapper;
    private final ExamRepository examRepository;
    private final QuestionBankService questionBankService;
    private final LLMService llmService;


    private String generateSummary(Exam exam) {
        StringBuilder userMessage = new StringBuilder("# 사용자가 푼 문제 목록\n");
        StringBuilder knowledge = new StringBuilder("# 지식 베이스 (문제 은행)\n");

        for (Question question: questionBankService.getAllQuestions(exam.getQuestionBank().getId())) {
            knowledge.append("## ").append(question.getTitle()).append("\n");
            knowledge.append("### 정답\n");
            for (Answer answer: question.getAnswer()) {
                if (answer.getCorrect()) {
                    knowledge.append("- ").append(answer.getText()).append("\n");
                }
            }
            knowledge.append(question.getExplanation()).append("\n");

        }
        for (ExamQuestion examQuestion : exam.getExamQuestions()) {
            userMessage.append(examQuestionMapper.mapToString(examQuestion)).append("\n");
        }

        String prompt = """
        당신은 전문 티칭 어시스턴트입니다. 사용자가 입력한 시험 문제지를 기반으로 학습 피드백을 제시하세요.
        
        # 보고서 전략
        - 어떤 문제는 사용자가 헷갈려서 마킹했을수도 있으며 오답을 체크했을 수도 있습니다.
        - 이러한 문제들을 종합하여 사용자가 어려워하는 부분을 식별할 수 있습니다.
        - 지식 베이스를 적극 활용하세요. 이는 보고서의 오류를 줄이고 시험에 자주 등장하는 개념이나 질문을 파악할 수 있습니다.
        - 사용자가 자주 헷갈리는 개념이나 요소를 비교하거나 요약 및 정리하여 제시할 수  있습니다.
        - 사용자가 의욕을 가질 수 있도록 적절한 격려의 메세지를 포함해주세요.
        
        # 주요 지침
        - 첫 문장은 격려의 메세지로 시작합니다. (단 "격려의 메세지" 헤더를 그대로 노출하지 마세요)
        - 전체 문항 수나 틀린 문항 수는 이미 별도의 보고서로 제시되어 다시 언급할 필요가 없습니다.
        - 3레벨 헤더 (###)로 섹션을 나눠서 제시해주세요. (1레벨, 2레벨 헤더는 사용하지 않습니다)
        - 이 보고서는 시험 마지막에 제공되므로 'A', 'B' 와 같은 보기 지칭은 도움이 되지 않습니다.
        - 눈에 잘 들어오도록 장문의 글보다는 핵심 키워드 위주로 정리해주세요.
        
        """ + knowledge;

        return llmService.generate(
                prompt,
                List.of(LLMMessage.builder()
                        .role(LLMMessage.Role.USER)
                        .text(userMessage.toString())
                        .build())
        );
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

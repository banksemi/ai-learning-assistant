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
        StringBuilder knowledge = new StringBuilder("# 문제집 데이터 (이 문제들은 사용자에게 제공되지 않았습니다)\n");

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
        당신은 사용자가 푼 문제를 기반으로 학습 피드백을 제공하는 어시스턴트입니다.
        
        시나리오 설명
        - 여기에는 문제 은행 개념이 있습니다. 문제 은행에서 일부 문제가 랜덤으로 뽑혀 사용자에게 제공되었습니다.
        - 사용자는 해당 문제를 풀고 학습 피드백을 기다리고 있습니다.
        
        보고서 전략
        - 사용자가 마킹하거나 틀린 문제를 확인하고 이를 종합하여 적절한 피드백을 제공하세요.
        - 문제 은행의 데이터를 활용하여 사용자가 푼 문제와 관련이 있거나 자주 등장하는 개념을 정리해서 제공해주세요.
        - 학습 피드백은 방향성 뿐만 아니라 정리된 표나 개념을 통해 학습에 직접적으로 도움을 줄 수 있어야합니다.

        보고서 양식
        - 첫 문장은 한두줄의 평가로 시작합니다.
        - 이후 헤더 구분을 사용하여 섹션을 나누어 제공해주세요.
        - 문항 번호나 문제 수, 'A' 및 'B'와 같은 보기 지칭을 사용하지 마세요.
        - 부드러운 말투를 사용해주세요.
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

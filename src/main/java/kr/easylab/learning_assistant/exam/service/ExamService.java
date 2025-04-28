package kr.easylab.learning_assistant.exam.service;

import kr.easylab.learning_assistant.exam.dto.AnswerResponse;
import kr.easylab.learning_assistant.exam.dto.ExamCreationRequest;
import kr.easylab.learning_assistant.exam.dto.ExamQuestionResponse;
import kr.easylab.learning_assistant.exam.dto.ExamResultResponse;
import kr.easylab.learning_assistant.exam.entity.Exam;
import kr.easylab.learning_assistant.exam.exception.NotFoundExam;
import kr.easylab.learning_assistant.exam.exception.NotFoundExamQuestion;
import kr.easylab.learning_assistant.question.entity.Language;

public interface ExamService {
    Long createExam(ExamCreationRequest request);
    Exam getExam(Long examId) throws NotFoundExam;

    Long getQuestionCount(Long examId);

    ExamQuestionResponse getQuestion(Long examId, Long no) throws NotFoundExamQuestion;
    AnswerResponse submitAnswer(Long examId, Long no, String answerKey);
    void markQuestion(Long examId, Long no);
    void unmarkQuestion(Long examId, Long no);

    ExamResultResponse getResult(Long examId);
}

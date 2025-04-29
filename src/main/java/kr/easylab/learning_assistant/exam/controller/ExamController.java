package kr.easylab.learning_assistant.exam.controller;

import jakarta.validation.Valid;
import kr.easylab.learning_assistant.admin.dto.OkResponse;
import kr.easylab.learning_assistant.common.dto.ListResponse;
import kr.easylab.learning_assistant.exam.dto.*;
import kr.easylab.learning_assistant.exam.service.ExamService;
import kr.easylab.learning_assistant.question.dto.QuestionBankCreationRequest;
import kr.easylab.learning_assistant.question.dto.QuestionBankCreationResponse;
import kr.easylab.learning_assistant.question.dto.QuestionBankResponse;
import kr.easylab.learning_assistant.question.dto.QuestionCreationRequest;
import kr.easylab.learning_assistant.question.service.QuestionBankService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/1/exams")
@RequiredArgsConstructor
public class ExamController {
    private final ExamService examService;


    @PostMapping()
    public ExamCreationResponse post(@RequestBody @Valid ExamCreationRequest request) {
        Long exam_id = examService.createExam(request);
        return ExamCreationResponse.builder().exam_id(exam_id).build();
    }

    @GetMapping("/{exam_id}/total_questions")
    public ExamTotalQuestionCountResponse getTotalQuestionCount(@PathVariable Long exam_id) {
        return new ExamTotalQuestionCountResponse(
                examService.getQuestionCount(exam_id)
        );
    }

    @GetMapping("/{exam_id}/questions/{no}")
    public ExamQuestionResponse getQuestion(@PathVariable Long exam_id, @PathVariable Long no) {
        return examService.getQuestion(exam_id, no);
    }

    @PostMapping("/{exam_id}/questions/{no}/answer")
    public AnswerResponse submitAnswer(@PathVariable Long exam_id, @PathVariable Long no, @RequestBody @Valid ExamAnswerRequest request) {
        return examService.submitAnswer(exam_id, no, request);
    }

    @PostMapping("/{exam_id}/questions/{no}/marker")
    public ResponseEntity<OkResponse> addMarker(@PathVariable Long exam_id, @PathVariable Long no) {
        examService.markQuestion(exam_id, no);
        return new ResponseEntity<>(new OkResponse(), HttpStatus.NO_CONTENT);
    }

    @DeleteMapping("/{exam_id}/questions/{no}/marker")
    public ResponseEntity<OkResponse> removeMarker(@PathVariable Long exam_id, @PathVariable Long no) {
        examService.unmarkQuestion(exam_id, no);
        return new ResponseEntity<>(new OkResponse(), HttpStatus.NO_CONTENT);
    }
}

package kr.easylab.learning_assistant.exam.controller;

import jakarta.validation.Valid;
import kr.easylab.learning_assistant.admin.dto.OkResponse;
import kr.easylab.learning_assistant.common.dto.ListResponse;
import kr.easylab.learning_assistant.exam.dto.ExamCreationRequest;
import kr.easylab.learning_assistant.exam.dto.ExamCreationResponse;
import kr.easylab.learning_assistant.exam.dto.ExamQuestionResponse;
import kr.easylab.learning_assistant.exam.dto.ExamTotalQuestionCountResponse;
import kr.easylab.learning_assistant.exam.service.ExamService;
import kr.easylab.learning_assistant.question.dto.QuestionBankCreationRequest;
import kr.easylab.learning_assistant.question.dto.QuestionBankCreationResponse;
import kr.easylab.learning_assistant.question.dto.QuestionBankResponse;
import kr.easylab.learning_assistant.question.dto.QuestionCreationRequest;
import kr.easylab.learning_assistant.question.service.QuestionBankService;
import lombok.RequiredArgsConstructor;
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
}

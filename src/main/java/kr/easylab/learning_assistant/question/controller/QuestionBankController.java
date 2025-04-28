package kr.easylab.learning_assistant.question.controller;

import jakarta.validation.Valid;
import kr.easylab.learning_assistant.admin.dto.OkResponse;
import kr.easylab.learning_assistant.common.dto.ListResponse;
import kr.easylab.learning_assistant.question.dto.QuestionBankCreationRequest;
import kr.easylab.learning_assistant.question.dto.QuestionBankCreationResponse;
import kr.easylab.learning_assistant.question.dto.QuestionBankResponse;
import kr.easylab.learning_assistant.question.dto.QuestionCreationRequest;
import kr.easylab.learning_assistant.question.entity.QuestionBank;
import kr.easylab.learning_assistant.question.service.QuestionBankService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/1/question-banks")
@RequiredArgsConstructor
public class QuestionBankController {
    private final QuestionBankService questionBankService;

    @GetMapping()
    public ListResponse<QuestionBankResponse> get() {
        List<QuestionBankResponse> questionBankResponses = new ArrayList<>();
        for (QuestionBank bank: questionBankService.getQuestionBanks()) {
            questionBankResponses.add(QuestionBankResponse.builder()
                            .questionBankId(bank.getId())
                            .questions(0L)
                            .title(bank.getTitle())
                    .build());
        }
        return ListResponse.<QuestionBankResponse>builder()
                .total((long) questionBankResponses.size())
                .data(questionBankResponses)
                .build();
    }

    @PostMapping()
    @PreAuthorize("hasRole('ADMIN')")
    public QuestionBankCreationResponse post(@RequestBody @Valid QuestionBankCreationRequest request) {
        Long id = questionBankService.createQuestionBank(request.getTitle());
        return new QuestionBankCreationResponse(id);
    }

    @PostMapping("{questionBankId}/questions")
    @PreAuthorize("hasRole('ADMIN')")
    public OkResponse postQuestion(@PathVariable Long questionBankId, @RequestBody @Valid QuestionCreationRequest request) {
        questionBankService.createQuestion(questionBankId, request);
        return new OkResponse();
    }
}

package kr.easylab.learning_assistant.question.controller;

import kr.easylab.learning_assistant.question.dto.ListResponse;
import kr.easylab.learning_assistant.question.dto.QuestionBankResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/1/question-banks")
@RequiredArgsConstructor
public class QuestionBankController {

    @GetMapping()
    public ListResponse<QuestionBankResponse> get() {
        return new ListResponse<QuestionBankResponse>();
    }
}

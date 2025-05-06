package kr.easylab.learning_assistant.exam.controller;

import jakarta.validation.Valid;
import kr.easylab.learning_assistant.admin.dto.OkResponse;
import kr.easylab.learning_assistant.chatbot.service.ChatbotService;
import kr.easylab.learning_assistant.common.dto.ListResponse;
import kr.easylab.learning_assistant.exam.dto.*;
import kr.easylab.learning_assistant.exam.service.ExamChatbotService;
import kr.easylab.learning_assistant.exam.service.ExamReportService;
import kr.easylab.learning_assistant.exam.service.ExamService;
import kr.easylab.learning_assistant.question.dto.QuestionBankCreationRequest;
import kr.easylab.learning_assistant.question.dto.QuestionBankCreationResponse;
import kr.easylab.learning_assistant.question.dto.QuestionBankResponse;
import kr.easylab.learning_assistant.question.dto.QuestionCreationRequest;
import kr.easylab.learning_assistant.question.service.QuestionBankService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/1/exams")
@RequiredArgsConstructor
public class ExamController {
    private final ExamService examService;
    private final ExamChatbotService examChatbotService;
    private final ExamReportService examReportService;

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

    @GetMapping("/{exam_id}/result")
    public ExamResultResponse getQuestion(@PathVariable Long exam_id) {
        return examReportService.getResult(exam_id);
    }

    @PostMapping("/{exam_id}/questions/{no}/chat")
    public ExamChatResponse addMarker(@PathVariable Long exam_id, @PathVariable Long no, @RequestBody @Valid ExamChatRequest request) {
        return examChatbotService.chat(exam_id, no, request);
    }

    @GetMapping("/{exam_id}/questions/{no}/chat/preset")
    public ExamChatbotPresetResponse getPresetChat(@PathVariable Long exam_id, @PathVariable Long no) {
        return examChatbotService.generatePresetMessages(exam_id, no);
    }
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    @PostMapping(value = "/{exam_id}/questions/{no}/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamLlmResponse(@PathVariable Long exam_id, @PathVariable Long no, @RequestBody @Valid ExamChatRequest request) {
        SseEmitter emitter = new SseEmitter(240_000L);
        Flux<String> flux = examChatbotService.chatStream(exam_id, no, request);
        flux
                .doOnError(emitter::completeWithError)
                .doOnComplete(emitter::complete)
                .subscribe(str -> {
                        try {
                            emitter.send(SseEmitter.event().data(new ExamChatResponse(str)).build());
                        } catch (IOException e) {
                            emitter.completeWithError(e);
                            throw new RuntimeException(e);
                        }
                });

        emitter.onTimeout(() -> {
            System.out.println("SSE Emitter timed out");
            emitter.complete();
        });

        emitter.onCompletion(() -> System.out.println("SSE Emitter completed"));
        emitter.onError(e -> System.err.println("SSE Emitter error: " + e.getMessage()));

        return emitter;
    }
}

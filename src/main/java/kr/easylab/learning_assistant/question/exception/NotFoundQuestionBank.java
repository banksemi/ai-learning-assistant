package kr.easylab.learning_assistant.question.exception;

import kr.easylab.learning_assistant.common.annotation.HTTPResponseAnnotation;
import kr.easylab.learning_assistant.common.exception.KnownException;
import org.springframework.http.HttpStatus;

@HTTPResponseAnnotation(status = HttpStatus.NOT_FOUND, errorCode = "NOT_FOUND_QUESTION_BANK")
public class NotFoundQuestionBank extends KnownException {
    public NotFoundQuestionBank() {
        super("문제 은행을 찾을 수 없습니다.");
    }
}

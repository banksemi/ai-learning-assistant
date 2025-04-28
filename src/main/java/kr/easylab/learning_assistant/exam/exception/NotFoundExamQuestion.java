package kr.easylab.learning_assistant.exam.exception;

import kr.easylab.learning_assistant.common.annotation.HTTPResponseAnnotation;
import kr.easylab.learning_assistant.common.exception.KnownException;
import org.springframework.http.HttpStatus;

@HTTPResponseAnnotation(status = HttpStatus.NOT_FOUND, errorCode = "NOT_FOUND_EXAM_QUESTION")
public class NotFoundExamQuestion extends KnownException {
    public NotFoundExamQuestion() {
        super("시험 문제를 찾을 수 없습니다.");
    }
}

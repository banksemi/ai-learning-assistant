package kr.easylab.learning_assistant.admin.exception;

import kr.easylab.learning_assistant.common.annotation.HTTPResponseAnnotation;
import kr.easylab.learning_assistant.common.exception.KnownException;
import org.springframework.http.HttpStatus;


@HTTPResponseAnnotation(status = HttpStatus.FORBIDDEN, errorCode = "PASSWORD_ERROR")
public class PasswordException extends KnownException {
    public PasswordException() {
        super("비밀번호가 올바르지 않습니다.");
    }
}

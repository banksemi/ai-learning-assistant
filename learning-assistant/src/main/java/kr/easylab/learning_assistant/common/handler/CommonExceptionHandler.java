package kr.easylab.learning_assistant.common.handler;

import kr.easylab.learning_assistant.common.annotation.HTTPResponseAnnotation;
import kr.easylab.learning_assistant.common.dto.APIExceptionResponse;
import kr.easylab.learning_assistant.common.exception.KnownException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.View;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class CommonExceptionHandler {
    private final View error;

    public CommonExceptionHandler(View error) {
        this.error = error;
    }

    private ResponseEntity<APIExceptionResponse> buildErrorResponse(HttpStatus status, String errorCode, String message) {
        APIExceptionResponse response = APIExceptionResponse.builder()
                .errorCode(errorCode)
                .message(message)
                .build();
        return new ResponseEntity<>(response, status);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<APIExceptionResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {

        return buildErrorResponse(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getBindingResult()
                .getFieldErrors()
                .get(0)
                .getDefaultMessage()
        );
    }

    @ExceptionHandler(KnownException.class)
    public ResponseEntity<APIExceptionResponse> handleGlobalException(KnownException ex) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String errorCode = "INTERNAL_SERVER_ERROR";
        String message = "Internal Server Error";

        // Annotation 으로 HTTP 코드를 조회할 수 있을까?
        HTTPResponseAnnotation annotation = ex.getClass().getAnnotation(HTTPResponseAnnotation.class);
        List<Map<String, Object>> errors = new ArrayList<>();
        if (annotation != null) {
            status = annotation.status();
            errorCode = annotation.errorCode();
            message = ex.getMessage();
        }
        return buildErrorResponse(status, errorCode, message);
    }
}

package kr.easylab.learning_assistant.chatbot.exception;

import kr.easylab.learning_assistant.common.annotation.HTTPResponseAnnotation;
import org.springframework.http.HttpStatus;

@HTTPResponseAnnotation(status = HttpStatus.NOT_FOUND, errorCode = "NOT_FOUND_CHATBOT")
public class NotFoundChatbot extends RuntimeException {
    public NotFoundChatbot() {
        super("Chatbot 정보를 찾을 수 없습니다.");
    }
}

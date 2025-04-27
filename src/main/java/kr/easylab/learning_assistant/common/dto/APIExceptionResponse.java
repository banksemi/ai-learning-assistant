package kr.easylab.learning_assistant.common.dto;

import lombok.Builder;

@Builder
public class APIExceptionResponse {
    public String errorCode;
    public String message;
}

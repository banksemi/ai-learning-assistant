package kr.easylab.learning_assistant.admin.dto;

import jakarta.validation.constraints.NotNull;

public class PasswordRequest {
    @NotNull(message = "비밀번호는 필수 입력 필드입니다.")
    public String password;
}

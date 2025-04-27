package kr.easylab.learning_assistant.admin.controller;

import jakarta.validation.Valid;
import kr.easylab.learning_assistant.SecurityConfig;
import kr.easylab.learning_assistant.admin.dto.OkResponse;
import kr.easylab.learning_assistant.admin.dto.PasswordRequest;
import kr.easylab.learning_assistant.admin.exception.PasswordException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/1")
public class AdminController {
    private final SecurityConfig securityConfig;

    @RequestMapping("/login")
    public OkResponse login(@RequestBody @Valid PasswordRequest request) {
        if (!request.password.equals(securityConfig.getAdminPassword())) {
            throw new PasswordException();
        }
        return new OkResponse();
    }
}

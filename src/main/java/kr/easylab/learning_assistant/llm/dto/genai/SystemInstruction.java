package kr.easylab.learning_assistant.llm.dto.genai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder
@Getter
@AllArgsConstructor
public class SystemInstruction {
    private List<Part> parts;
    public SystemInstruction(String text) {
        parts = List.of(new Part(text));
    }
}

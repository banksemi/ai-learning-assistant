package kr.easylab.learning_assistant.llm.dto.genai;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
public class GenerateContentResponse {
    List<Candidate> candidates;
}

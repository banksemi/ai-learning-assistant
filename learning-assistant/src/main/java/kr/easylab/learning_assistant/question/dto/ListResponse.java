package kr.easylab.learning_assistant.question.dto;

import java.util.List;

public class ListResponse<T> {
    public Long total;
    private List<T> data;
}

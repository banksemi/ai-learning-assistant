package kr.easylab.learning_assistant.common.dto;

import lombok.Builder;

import java.util.List;

@Builder
public class ListResponse<T> {
    public Long total;
    public List<T> data;
}

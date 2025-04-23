package kr.easylab.learning_assistant.question.service;

import kr.easylab.learning_assistant.question.entity.Language;
import kr.easylab.learning_assistant.question.entity.QuestionBank;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class QuestionBankTest {
    @Autowired
    private QuestionBankService questionBankService;

    @Test
    void createQuestionBank() {
        Long questionBankId = questionBankService.createQuestionBank("test", Language.KOREAN);
        QuestionBank questionBank = questionBankService.getQuestionBank(questionBankId);

        assertNotNull(questionBankId);
        assertEquals(questionBankId, questionBank.getId());
        assertEquals("test", questionBank.getTitle());
    }

    @Test
    void createQuestionBankNotitle() {
        assertThrows(IllegalArgumentException.class, () -> questionBankService.createQuestionBank(null, null));
    }

    @Test
    void getQuestionBanks() {
        List<QuestionBank> questionBanks = questionBankService.getQuestionBanks();
        assertEquals(0, questionBanks.size());

        questionBankService.createQuestionBank("test", Language.KOREAN);
        questionBankService.createQuestionBank("test2", Language.KOREAN);

        questionBanks = questionBankService.getQuestionBanks();
        assertEquals(2, questionBanks.size());
    }
}
package kr.easylab.learning_assistant.exam.service.translation;

import kr.easylab.learning_assistant.exam.dto.ExamTranslationRequest;
import kr.easylab.learning_assistant.exam.dto.ExamTranslationResponse;
import kr.easylab.learning_assistant.exam.entity.ExamQuestion;
import kr.easylab.learning_assistant.exam.repository.ExamRepository;
import kr.easylab.learning_assistant.question.entity.Answer;
import kr.easylab.learning_assistant.translation.dto.Language;
import kr.easylab.learning_assistant.translation.service.TranslationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Slf4j
@Qualifier("translation-service-base")
public class ExamTranslationServiceImpl implements ExamTranslationService {
    private final TranslationService translationService;
    private final ExamRepository examRepository;

    @Cacheable(value = "exam-translation", sync=true)
    public ExamTranslationResponse translate(Long examId, Long no) {
        ExamQuestion examQuestion = examRepository.findQuestion(examId, no);
        if (examQuestion == null)
            return null;

        Language targetLanguage = examQuestion.getExam().getLanguage();

        String title = examQuestion.getQuestion().getTitle();
        List<Answer> answers = examQuestion.getQuestion().getAnswer();

        ExamTranslationRequest request = ExamTranslationRequest.builder()
                .title(title)
                .options(answers.stream().map(Answer::getText).toList())
                .explanation(examQuestion.getQuestion().getExplanation())
                .build();


        ExamTranslationRequest translated = translationService.translate(request, targetLanguage, ExamTranslationRequest.class);

        Map<Long, String> translatedAnswers = IntStream.range(0, answers.size())
                .mapToObj(index -> Map.entry(
                        answers.get(index).getId(),
                        translated.getOptions().get(index)
                ))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        return ExamTranslationResponse.builder()
                .title(translated.getTitle())
                .answers(translatedAnswers)
                .explanation(translated.getExplanation())
                .build();
    }
}

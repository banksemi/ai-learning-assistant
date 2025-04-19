import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

// Added 'complete' key
const translations = {
  en: {
    language: 'Language',
    progress: 'Progress',
    complete: 'Complete', // New key
    question: 'Question',
    questions: 'questions', // Added for bank selection
    of: 'of',
    submit: 'Submit',
    nextQuestion: 'Next Question',
    correct: 'Correct!',
    incorrect: 'Incorrect',
    explanation: 'Explanation',
    askAI: 'Ask AI',
    closeChat: 'Close Chat',
    chatWelcome: 'Ask me anything about the current question!',
    typeAnswer: 'Type your message...',
    quizComplete: 'Quiz Complete!',
    restartQuiz: 'Restart Quiz',
    selectOption: 'Select your answer(s)',
    pleaseSelect: 'Please select an answer.',
    multipleChoiceHint: '(Select all that apply)',
    // Results Page Translations
    resultsTitle: 'Quiz Results',
    congratsMessage: "Congratulations! You've completed all the questions.",
    accuracy: 'Accuracy',
    scoreOutOfTotal: '{score} out of {totalQuestions} correct',
    aiAdviceTitle: 'AI Feedback',
    aiAdvicePlaceholder: 'Based on your results, you seem strong in [Area X] but could improve on [Area Y]. Focus on reviewing concepts related to [Specific Topic].',
    incorrectAnswersTitle: 'Review Incorrect Answers',
    showExplanation: 'Show Explanation',
    hideExplanation: 'Hide Explanation',
    yourAnswer: 'Your Answer',
    correctAnswer: 'Correct Answer',
    // Marker Feature Translations
    markQuestion: 'Mark this question for review',
    unmarkQuestion: 'Unmark this question',
    markedQuestionsTitle: 'Marked for Review',
    // Question Bank Selection Page Translations
    selectQuizTitle: 'Configure Your Quiz',
    selectBankLabel: 'Select Question Bank',
    selectBankPlaceholder: 'Choose a question bank...',
    selectNumQuestionsLabel: 'Number of Questions',
    numQuestionsInputPlaceholder: 'Enter number (e.g., 10)',
    maxQuestionsAvailable: '(Max: {count})',
    startQuizButton: 'Start Quiz',
    pleaseSelectBank: 'Please select a question bank.',
    pleaseEnterNumQuestions: 'Please enter the number of questions.',
    invalidNumberError: 'Please enter a valid positive number.',
    numberTooHighError: 'Number exceeds available questions ({count}).',
    errorFetchingBanks: 'Failed to load question banks. Please try again later.',
    errorStartingQuiz: 'Failed to start the quiz. Please try again.',
    noBanksAvailable: 'No question banks available.',
    startingQuiz: 'Starting...',
    // New Error/Loading Translations
    errorFetchingQuestions: 'Failed to load questions. Please try restarting the quiz.',
    errorFetchingResults: 'Failed to fetch quiz results.',
    errorSubmittingAnswer: 'Failed to submit answer. Please try again.',
    errorMarkingQuestion: 'Failed to update bookmark status.',
    errorChattingAI: 'Failed to get response from AI. Please try again.',
  },
  ko: {
    language: '언어',
    progress: '진행률',
    complete: '완료', // 새 키
    question: '문제',
    questions: '문제', // 은행 선택용 추가
    of: '/',
    submit: '제출',
    nextQuestion: '다음 문제',
    correct: '정답!',
    incorrect: '오답',
    explanation: '설명',
    askAI: 'AI에게 물어보기',
    closeChat: '채팅 닫기',
    chatWelcome: '현재 문제에 대해 무엇이든 물어보세요!',
    typeAnswer: '메시지를 입력하세요...',
    quizComplete: '퀴즈 완료!',
    restartQuiz: '퀴즈 다시 시작',
    selectOption: '정답을 선택하세요',
    pleaseSelect: '답변을 선택해주세요.',
    multipleChoiceHint: '(모두 선택)',
    // Results Page Translations
    resultsTitle: '퀴즈 결과',
    congratsMessage: '축하합니다! 모든 문제를 완료했습니다.',
    accuracy: '정확도',
    scoreOutOfTotal: '총 {totalQuestions}문제 중 {score}개 정답',
    aiAdviceTitle: 'AI 피드백',
    aiAdvicePlaceholder: '결과를 바탕으로 볼 때, [X 영역]에 강점을 보이지만 [Y 영역]은 개선이 필요해 보입니다. [특정 주제] 관련 개념을 복습하는 데 집중해 보세요.',
    incorrectAnswersTitle: '오답 다시보기',
    showExplanation: '설명 보기',
    hideExplanation: '설명 숨기기',
    yourAnswer: '선택한 답',
    correctAnswer: '정답',
    // Marker Feature Translations
    markQuestion: '나중에 다시 볼 문제로 표시',
    unmarkQuestion: '문제 표시 해제',
    markedQuestionsTitle: '표시한 문제',
    // Question Bank Selection Page Translations
    selectQuizTitle: '퀴즈 설정',
    selectBankLabel: '문제 은행 선택',
    selectBankPlaceholder: '문제 은행을 선택하세요...',
    selectNumQuestionsLabel: '문제 수',
    numQuestionsInputPlaceholder: '숫자 입력 (예: 10)',
    maxQuestionsAvailable: '(최대: {count}개)',
    startQuizButton: '퀴즈 시작',
    pleaseSelectBank: '문제 은행을 선택해주세요.',
    pleaseEnterNumQuestions: '문제 수를 입력해주세요.',
    invalidNumberError: '유효한 양수를 입력해주세요.',
    numberTooHighError: '선택 가능한 문제 수({count}개)를 초과했습니다.',
    errorFetchingBanks: '문제 은행을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.',
    errorStartingQuiz: '퀴즈를 시작하는데 실패했습니다. 다시 시도해주세요.',
    noBanksAvailable: '사용 가능한 문제 은행이 없습니다.',
    startingQuiz: '시작 중...',
    // New Error/Loading Translations
    errorFetchingQuestions: '문제를 불러오는데 실패했습니다. 퀴즈를 다시 시작해주세요.',
    errorFetchingResults: '퀴즈 결과를 불러오는데 실패했습니다.',
    errorSubmittingAnswer: '답변 제출에 실패했습니다. 다시 시도해주세요.',
    errorMarkingQuestion: '북마크 상태 변경에 실패했습니다.',
    errorChattingAI: 'AI 응답을 가져오는데 실패했습니다. 다시 시도해주세요.',
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ko'); // Default language
  // Helper function for translations with replacements
  const t = (key, replacements = {}) => {
    let translation = translations[language]?.[key] || key;
    Object.keys(replacements).forEach(placeholder => {
        const regex = new RegExp(`{${placeholder}}`, 'g');
        translation = translation.replace(regex, replacements[placeholder]);
    });
    return translation;
  };


  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

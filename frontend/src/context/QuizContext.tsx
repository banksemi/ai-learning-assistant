import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import {
    Question, // Frontend Question type
    QuizSettings,
    UserAnswer, // Keep for potential local tracking if needed, but API is primary
    QuizResult, // Frontend Result type
    Language,
    ApiQuestionResponse, // API response type for a question
    ApiAnswerResponse, // API response type for submitting an answer
    ChatMessage, // Frontend Chat message type
    ApiChatResponse, // API response for chat
    ApiResultResponse, // API response for results
    QuestionOption, // Frontend Option type
    ApiQuestionOption, // API Option type
    ApiResultQuestionDetail, // API Result question detail type
    QuestionBank as FrontendQuestionBank, // Import Frontend QuestionBank type
    ApiPresetChatResponse, // Import NEW type
} from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner"; // Using sonner for notifications
import * as api from '@/services/api'; // Import API service functions

// Helper function to map API question response to frontend Question type
const mapApiQuestionToFrontend = (apiQuestion: ApiQuestionResponse, lang: Language): Question => {
    // The API response doesn't include language-specific text directly in title/explanation
    // Assuming the API returns text based on the language set during exam creation.
    // If API provided ko/en fields, mapping would be needed here.
    return {
        id: apiQuestion.question_id,
        text: apiQuestion.title, // Assuming API returns correct language
        options: apiQuestion.options.map((opt: ApiQuestionOption): QuestionOption => ({
            id: opt.key,
            text: opt.value, // Assuming API returns correct language
        })),
        correctAnswerIds: [], // Correct answers are fetched *after* submission via API
        explanation: '', // Explanation is fetched *after* submission via API
        type: apiQuestion.answer_count > 1 ? 'multiple' : 'single',
        isMarked: apiQuestion.marker,
        presetMessages: null, // Initialize presetMessages as null
        // We might not need userSelectedIds if results API provides it
    };
};

// Helper function to map API result question detail to frontend Question type
const mapApiResultQuestionToFrontend = (apiDetail: ApiResultQuestionDetail): Question => {
     // Determine type based on actual_answers length
     const type = apiDetail.actual_answers.length > 1 ? 'multiple' : 'single';
     return {
         id: apiDetail.question_id,
         text: apiDetail.title,
         options: apiDetail.options.map((opt: ApiQuestionOption): QuestionOption => ({
             id: opt.key,
             text: opt.value,
         })),
         correctAnswerIds: apiDetail.actual_answers,
         explanation: apiDetail.explanation,
         type: type,
         isMarked: false, // Marked status is handled separately in the result structure
         userSelectedIds: apiDetail.user_answers, // Store user's selection from result
         presetMessages: null, // Initialize presetMessages as null for result questions too
     };
 };


interface QuizContextProps {
  settings: QuizSettings | null;
  selectedBankName: string | null; // Added state for bank name
  examId: number | null; // Added examId state
  currentQuestion: Question | null; // Store the currently fetched question
  questions: Question[]; // Keep original questions list for results page (original index)
  currentQuestionIndex: number;
  totalQuestions: number; // Total questions for the current exam
  setCurrentQuestionIndex: (index: number) => void;
  userAnswers: UserAnswer[]; // Keep track of answers locally for immediate feedback/review state
  submitAnswer: (questionId: number, selectedOptionIds: string[]) => Promise<ApiAnswerResponse | null>; // Now async, returns API response
  result: QuizResult | null;
  startQuiz: (settings: QuizSettings) => Promise<void>; // Now async
  resetQuiz: () => void;
  // getCurrentQuestion: () => Question | null; // Replaced by currentQuestion state + fetch logic
  isQuizFinished: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  finishQuiz: () => Promise<void>; // Now async, doesn't need finalAnswers param
  // Marker related state and functions
  // markedQuestionIds: string[]; // Replaced by isMarked in Question type, driven by API
  toggleMarkQuestion: (questionId: number) => Promise<void>; // Now async
  isQuestionMarked: (questionId: number) => boolean; // Checks currentQuestion.isMarked
  // Loading and Error states
  isLoading: boolean;
  error: string | null;
  clearError: () => void; // Ensure clearError is in the interface
  // AI Chat
  sendChatMessage: (questionId: number, message: string) => Promise<ApiChatResponse | null>; // Added for AI chat
  // fetchPresetMessages: (questionId: number) => Promise<ApiPresetChatResponse | null>; // REMOVED: No longer needed externally
}

const QuizContext = createContext<QuizContextProps | undefined>(undefined);

export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<QuizSettings | null>(null);
  const [selectedBankName, setSelectedBankName] = useState<string | null>(null); // State for bank name
  const [examId, setExamId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]); // Keep state for original questions
  const [currentQuestionIndex, setCurrentQuestionIndexState] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]); // Store answers with correctness status after API call
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isQuizFinished, setIsQuizFinished] = useState<boolean>(false);
  const [language, setLanguageState] = useState<Language>('ko');
  // Loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Define clearError function
  const clearError = useCallback(() => setError(null), []);

  // --- Fetch Current Question Logic ---
  const fetchQuestion = useCallback(async (examIdToFetch: number, index: number, lang: Language) => {
    if (examIdToFetch === null) return;
    setIsLoading(true);
    setError(null); // Use setError directly or call clearError()
    try {
      // API uses 0-based index for fetching questions
      const apiQuestion = await api.getQuestion(examIdToFetch, index);
      const frontendQuestion = mapApiQuestionToFrontend(apiQuestion, lang);
      setCurrentQuestion(frontendQuestion);
      // Store fetched question in the main questions list if needed for results page
      // This assumes questions are fetched sequentially and index matches array index
      setQuestions(prev => {
          const newQuestions = [...prev];
          // Ensure the array is large enough
          if (index >= newQuestions.length) {
              // Fill gaps with null or handle appropriately if non-sequential fetch is possible
              newQuestions.length = index + 1;
          }
          newQuestions[index] = frontendQuestion;
          return newQuestions;
      });

    } catch (err: any) {
      console.error("Error fetching question:", err);
      setError(err.message || `Failed to load question ${index + 1}`);
      setCurrentQuestion(null); // Clear question on error
      // Potentially navigate back or show error message prominently
    } finally {
      setIsLoading(false);
    }
  }, []); // Removed setError from dependencies as it's stable

  // Effect to fetch question when index or examId changes
  useEffect(() => {
    if (examId !== null && !isQuizFinished && totalQuestions > 0 && currentQuestionIndex < totalQuestions) {
        // Fetch if the question at the current index hasn't been fetched yet
        // Also check if the currentQuestion state is null (e.g., after reset or initial load)
        // Or if the current question doesn't match the one in the array (e.g., after state reset)
        if (!questions[currentQuestionIndex] || !currentQuestion || currentQuestion.id !== questions[currentQuestionIndex]?.id) {
             fetchQuestion(examId, currentQuestionIndex, language);
        } else if (questions[currentQuestionIndex] && currentQuestion?.id === questions[currentQuestionIndex].id) {
            // If already fetched and matches, ensure currentQuestion state is up-to-date
            // This handles cases where preset messages might have been added to the array question object
            setCurrentQuestion(questions[currentQuestionIndex]);
        }
    }
  // Added currentQuestion to dependencies to handle refetch/reset scenarios
  }, [examId, currentQuestionIndex, isQuizFinished, fetchQuestion, language, totalQuestions, questions, currentQuestion]);

  // Define finishQuiz *before* setCurrentQuestionIndex
  const finishQuiz = useCallback(async () => {
    if (examId === null || !settings) {
      setError("Cannot finish quiz: Exam ID or settings missing.");
      return;
    }
    // 1. Navigate to calculating page immediately
    navigate('/calculating-results');
    // 2. Set loading state for the API call
    setIsLoading(true);
    clearError();

    try {
      // 3. Fetch results
      const apiResult: ApiResultResponse = await api.getResults(examId);

      const score = apiResult.total_questions > 0
        ? Math.round((apiResult.correct_questions / apiResult.total_questions) * 100)
        : 0;

      // Map API result questions to frontend Question type
      const markedQuestions = apiResult.questions.marked.map(mapApiResultQuestionToFrontend);
      const incorrectQuestions = apiResult.questions.incorrect.map(mapApiResultQuestionToFrontend);

      const finalResult: QuizResult = {
        settings: settings,
        score,
        summary: apiResult.summary,
        markedQuestions: markedQuestions,
        incorrectQuestions: incorrectQuestions,
        totalQuestions: apiResult.total_questions,
        correctCount: apiResult.correct_questions,
      };

      // 4. Set the result state *before* navigating away
      setResult(finalResult);
      setIsQuizFinished(true);

      // 5. Navigate to the results page *after* state is set
      navigate('/results');

    } catch (err: any) {
      console.error("Error finishing quiz:", err);
      setError(err.message || 'Failed to load results.');
      // On error, navigate to results page, which will show the error state
      navigate('/results');
    } finally {
      // 6. Set loading false *after* everything, including navigation attempts
      setIsLoading(false);
    }
  }, [examId, settings, navigate, clearError]); // Added dependencies


  const setCurrentQuestionIndex = useCallback((index: number) => {
    if (index >= 0 && index < totalQuestions) {
        setCurrentQuestionIndexState(index);
        // Fetching is handled by the useEffect hook now
    } else if (index >= totalQuestions) {
        // Attempting to go beyond the last question, trigger finishQuiz
        finishQuiz(); // Now finishQuiz is guaranteed to be initialized
    }
  }, [totalQuestions, finishQuiz]); // Keep finishQuiz dependency


  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    // Note: Changing language mid-quiz might require refetching the current question
    // if the API doesn't handle it automatically based on exam settings.
    // For simplicity, we assume the API uses the language set during exam creation.
    if (settings) {
      setSettingsState({ ...settings, language: lang });
    }
  }, [settings]); // Added settings dependency

  const startQuiz = useCallback(async (newSettings: QuizSettings) => {
    setIsLoading(true);
    clearError(); // Use clearError here
    let fetchedBanks: FrontendQuestionBank[] = []; // Variable to store fetched banks

    try {
      // Fetch available banks to get the name
      try {
          const banksResponse = await api.getQuestionBanks();
          fetchedBanks = banksResponse.data.map(bank => ({
              id: bank.question_bank_id,
              name: bank.title,
              questions: bank.questions
          }));
      } catch (bankError: any) {
          console.error("Error fetching banks during startQuiz:", bankError);
          // Decide if this error should prevent the quiz from starting
          throw new Error("Failed to load question bank details.");
      }

      // Find the selected bank name
      const bankDetails = fetchedBanks.find(b => b.id === newSettings.questionBankId);
      const bankName = bankDetails ? bankDetails.name : null;

      // Create the exam
      const examData = await api.createExam({
        question_bank_id: newSettings.questionBankId,
        language: newSettings.language,
        questions: newSettings.numberOfQuestions,
      });
      const newExamId = examData.exam_id;

      // Fetch total questions for the created exam
      const totalData = await api.getTotalQuestions(newExamId);
      const fetchedTotalQuestions = totalData.total_questions;

      // Basic validation
      if (fetchedTotalQuestions <= 0) {
          throw new Error("No questions found for this exam configuration.");
      }
       // Ensure requested number doesn't exceed available
       if (newSettings.numberOfQuestions > fetchedTotalQuestions) {
           console.warn(`Requested ${newSettings.numberOfQuestions} questions, but only ${fetchedTotalQuestions} available in the bank. Starting with ${fetchedTotalQuestions}.`);
           newSettings.numberOfQuestions = fetchedTotalQuestions; // Adjust settings
       }


      setSettingsState(newSettings);
      setSelectedBankName(bankName); // Set the bank name state
      setExamId(newExamId);
      setTotalQuestions(newSettings.numberOfQuestions); // Use the adjusted number
      setCurrentQuestionIndexState(0); // Reset index to 0
      setUserAnswers([]);
      setResult(null);
      setIsQuizFinished(false);
      setLanguageState(newSettings.language);
      setCurrentQuestion(null); // Clear previous question before fetching new one
      setQuestions([]); // Clear previous full questions list

      // Initial fetch for the first question (index 0) is handled by useEffect

      navigate('/quiz');
    } catch (err: any) {
      console.error("Error starting quiz:", err);
      setError(err.message || 'Failed to start quiz. Please try again.');
      // Reset state partially on error
      setExamId(null);
      setTotalQuestions(0);
      setSelectedBankName(null); // Reset bank name on error
    } finally {
      setIsLoading(false);
    }
  }, [navigate, clearError]); // Added clearError dependency

  const submitAnswer = useCallback(async (questionId: number, selectedOptionIds: string[]): Promise<ApiAnswerResponse | null> => {
    if (examId === null) {
        setError("Exam ID is missing.");
        return null;
    }
    setIsLoading(true);
    clearError(); // Use clearError here

    try {
      // 1. Submit the answer
      const response = await api.submitAnswer(examId, questionId, { user_answers: selectedOptionIds });

      // 2. Determine correctness based on API response
      const correctIds = response.actual_answers.sort();
      const selectedIdsSorted = [...selectedOptionIds].sort();
      const isCorrect = JSON.stringify(correctIds) === JSON.stringify(selectedIdsSorted);

      const newUserAnswer: UserAnswer = { questionId, selectedOptionIds, isCorrect };

      // 3. Update userAnswers state
      setUserAnswers(prevAnswers => {
        const existingAnswerIndex = prevAnswers.findIndex(a => a.questionId === questionId);
        if (existingAnswerIndex > -1) {
          const updatedAnswers = [...prevAnswers];
          updatedAnswers[existingAnswerIndex] = newUserAnswer;
          return updatedAnswers;
        } else {
          return [...prevAnswers, newUserAnswer];
        }
      });

       // 4. Update current question with explanation and correct answers (IMMEDIATELY)
       //    Set presetMessages to null initially to indicate loading has started
       setCurrentQuestion(prev => prev ? ({
           ...prev,
           correctAnswerIds: response.actual_answers,
           explanation: response.explanation,
           userSelectedIds: selectedOptionIds, // Store user selection for review
           presetMessages: null, // Set to null to indicate loading start
       }) : null);

       // 5. Update the main questions list as well (IMMEDIATELY, set presets to null)
       setQuestions(prevQs => prevQs.map(q => q.id === questionId ? {
           ...q,
           correctAnswerIds: response.actual_answers,
           explanation: response.explanation,
           userSelectedIds: selectedOptionIds,
           presetMessages: null, // Set to null to indicate loading start
       } : q));

      // 6. --- Start PRELOADING PRESET MESSAGES (Non-blocking) ---
      // Do NOT await this promise
      api.getPresetChatMessages(examId, questionId)
          .then(presetResponse => {
              const fetchedPresets = presetResponse.messages;
              // Update state asynchronously when presets are fetched
              setCurrentQuestion(prev => prev?.id === questionId ? ({ ...prev, presetMessages: fetchedPresets }) : prev);
              setQuestions(prevQs => prevQs.map(q => q.id === questionId ? { ...q, presetMessages: fetchedPresets } : q));
          })
          .catch(presetError => {
              // Log error but don't block UI
              console.error("Error fetching preset messages in background:", presetError);
              // Set presets to an empty array on error to indicate loading finished but failed
              setCurrentQuestion(prev => prev?.id === questionId ? ({ ...prev, presetMessages: [] }) : prev);
              setQuestions(prevQs => prevQs.map(q => q.id === questionId ? { ...q, presetMessages: [] } : q));
          });
      // --- END PRELOAD ---

      setIsLoading(false); // Set loading false *before* returning
      return response; // Return the full API response immediately

    } catch (err: any) {
      console.error("Error submitting answer:", err);
      setError(err.message || 'Failed to submit answer.');
      setIsLoading(false); // Ensure loading is false on error
      return null;
    }
  }, [examId, clearError]); // Added clearError dependency

  const toggleMarkQuestion = useCallback(async (questionId: number) => {
    if (examId === null || !currentQuestion) {
        setError("Cannot mark question: Exam ID or question missing.");
        return;
    }
    const newMarkState = !currentQuestion.isMarked;
    // Optimistically update UI first
    setCurrentQuestion(prev => prev ? { ...prev, isMarked: newMarkState } : null);
     // Update the main questions list as well
     setQuestions(prevQs => prevQs.map(q => q.id === questionId ? { ...q, isMarked: newMarkState } : q));

    try {
      await api.toggleMarker(examId, questionId, newMarkState);
      // API call successful, UI already updated
       toast(newMarkState ? "북마크 추가됨" : "북마크 제거됨", { // Use Sonner toast
           description: newMarkState ? "나중에 다시 볼 수 있도록 문제를 표시했습니다." : "문제를 검토 목록에서 제거했습니다.",
           duration: 2000,
       });
    } catch (err: any) {
      console.error("Error toggling marker:", err);
      setError(err.message || 'Failed to update bookmark.');
      // Revert optimistic update on error
      setCurrentQuestion(prev => prev ? { ...prev, isMarked: !newMarkState } : null);
      setQuestions(prevQs => prevQs.map(q => q.id === questionId ? { ...q, isMarked: !newMarkState } : q));
       toast.error("북마크 업데이트 실패"); // Use Sonner error toast
    }
  }, [examId, currentQuestion]); // Added currentQuestion dependency

  const isQuestionMarked = useCallback((questionId: number): boolean => {
    // Check the isMarked property of the currentQuestion state
    return currentQuestion?.id === questionId && currentQuestion.isMarked;
  }, [currentQuestion]); // Added currentQuestion dependency


  const resetQuiz = useCallback(() => {
    setSettingsState(null);
    setSelectedBankName(null); // Reset bank name
    setExamId(null);
    setCurrentQuestion(null);
    setQuestions([]); // Clear questions list on reset
    setCurrentQuestionIndexState(0);
    setTotalQuestions(0);
    setUserAnswers([]);
    setResult(null);
    setIsQuizFinished(false);
    setLanguageState('ko');
    setIsLoading(false);
    setError(null); // Use setError directly or call clearError()
    navigate('/');
  }, [navigate]); // Added navigate dependency

   // --- AI Chat Function ---
   const sendChatMessage = useCallback(async (questionId: number, message: string): Promise<ApiChatResponse | null> => {
       if (examId === null) {
           setError("Cannot send chat message: Exam ID missing.");
           return null;
       }
       // No loading state change here, handled in component maybe? Or add specific chat loading state?
       clearError(); // Use clearError here
       try {
           const response = await api.postChatMessage(examId, questionId, { user: message });
           return response;
       } catch (err: any) {
           console.error("Error sending chat message:", err);
           // Display error via toast in the component?
           toast.error(err.message || 'Failed to send message to AI.');
           return null;
       }
   }, [examId, clearError]); // Added clearError dependency

   // REMOVED fetchPresetMessages function as it's now internal to submitAnswer


  // Ensure all functions and state values provided by the context are stable
  // by wrapping function definitions in useCallback and including them in useMemo dependencies.
  const contextValue = useMemo(() => ({
    settings,
    selectedBankName, // Provide bank name
    examId,
    currentQuestion,
    questions, // Provide original questions list
    currentQuestionIndex,
    totalQuestions,
    setCurrentQuestionIndex, // Use the memoized version
    userAnswers,
    submitAnswer, // Use the memoized version
    result,
    startQuiz, // Use the memoized version
    resetQuiz, // Use the memoized version
    isQuizFinished,
    language,
    setLanguage, // Use the memoized version
    finishQuiz, // Use the memoized version
    toggleMarkQuestion, // Use the memoized version
    isQuestionMarked, // Use the memoized version
    isLoading,
    error,
    clearError, // Use the memoized version
    sendChatMessage, // Use the memoized version
    // fetchPresetMessages, // REMOVED
  }), [
      settings, selectedBankName, examId, currentQuestion, questions, currentQuestionIndex, totalQuestions, userAnswers, result,
      isQuizFinished, language, isLoading, error,
      // Add all memoized functions as dependencies for useMemo
      setCurrentQuestionIndex, submitAnswer, startQuiz, resetQuiz, setLanguage,
      finishQuiz, toggleMarkQuestion, isQuestionMarked, clearError, sendChatMessage,
      // fetchPresetMessages // REMOVED
  ]);


  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = (): QuizContextProps => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback, useRef } from 'react';
import {
    Question,
    QuizSettings,
    UserAnswer,
    QuizResult,
    Language,
    ApiQuestionResponse,
    ApiAnswerResponse,
    ChatMessage,
    // ApiChatResponse, // No longer used for stream response directly
    ApiResultResponse,
    QuestionOption,
    ApiQuestionOption,
    ApiResultQuestionDetail,
    QuestionBank as FrontendQuestionBank,
    ApiPresetChatResponse,
    StreamCallbacks, // Import StreamCallbacks type
} from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import * as api from '@/services/api';

// Helper function to map API question response to frontend Question type
const mapApiQuestionToFrontend = (apiQuestion: ApiQuestionResponse, lang: Language): Question => {
    return {
        id: apiQuestion.question_id,
        text: apiQuestion.title,
        options: apiQuestion.options.map((opt: ApiQuestionOption): QuestionOption => ({
            id: opt.key,
            text: opt.value,
        })),
        correctAnswerIds: [],
        explanation: '',
        type: apiQuestion.answer_count > 1 ? 'multiple' : 'single',
        isMarked: apiQuestion.marker,
        presetMessages: null,
    };
};

// Helper function to map API result question detail to frontend Question type
const mapApiResultQuestionToFrontend = (apiDetail: ApiResultQuestionDetail): Question => {
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
         isMarked: false,
         userSelectedIds: apiDetail.user_answers,
         presetMessages: null,
     };
 };


interface QuizContextProps {
  settings: QuizSettings | null;
  selectedBankName: string | null;
  examId: number | null;
  currentQuestion: Question | null;
  questions: Question[];
  currentQuestionIndex: number;
  totalQuestions: number;
  setCurrentQuestionIndex: (index: number) => void;
  userAnswers: UserAnswer[];
  submitAnswer: (questionId: number, selectedOptionIds: string[]) => Promise<ApiAnswerResponse | null>;
  result: QuizResult | null;
  startQuiz: (settings: QuizSettings) => Promise<void>;
  resetQuiz: () => void;
  isQuizFinished: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  finishQuiz: () => Promise<void>;
  toggleMarkQuestion: (questionId: number) => Promise<void>;
  isQuestionMarked: (questionId: number) => boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  // Updated sendChatMessage signature
  sendChatMessage: (questionId: number, message: string, callbacks: StreamCallbacks) => void;
  // Function to explicitly close the chat stream
  closeChatStream: () => void;
}

const QuizContext = createContext<QuizContextProps | undefined>(undefined);

export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<QuizSettings | null>(null);
  const [selectedBankName, setSelectedBankName] = useState<string | null>(null);
  const [examId, setExamId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndexState] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isQuizFinished, setIsQuizFinished] = useState<boolean>(false);
  const [language, setLanguageState] = useState<Language>(() => {
    // Get language from localStorage or default to 'en'
    const savedLanguage = localStorage.getItem('preferredLanguage');
    return (savedLanguage as Language) || 'en';
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Ref to store the current EventSource instance for chat
  // **Correction:** Since we are using fetch, we don't get an EventSource object.
  // We need a way to signal the fetch stream to stop, e.g., using AbortController.
  const chatAbortControllerRef = useRef<AbortController | null>(null);


  const navigate = useNavigate();

  const clearError = useCallback(() => setError(null), []);

  const fetchQuestion = useCallback(async (examIdToFetch: number, index: number, lang: Language) => {
    if (examIdToFetch === null) return;
    setIsLoading(true);
    setError(null);
    try {
      const apiQuestion = await api.getQuestion(examIdToFetch, index);
      const frontendQuestion = mapApiQuestionToFrontend(apiQuestion, lang);
      setCurrentQuestion(frontendQuestion);
      setQuestions(prev => {
          const newQuestions = [...prev];
          if (index >= newQuestions.length) {
              newQuestions.length = index + 1;
          }
          newQuestions[index] = frontendQuestion;
          return newQuestions;
      });
    } catch (err: any) {
      console.error("Error fetching question:", err);
      setError(err.message || `Failed to load question ${index + 1}`);
      setCurrentQuestion(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (examId !== null && !isQuizFinished && totalQuestions > 0 && currentQuestionIndex < totalQuestions) {
        if (!questions[currentQuestionIndex] || !currentQuestion || currentQuestion.id !== questions[currentQuestionIndex]?.id) {
             fetchQuestion(examId, currentQuestionIndex, language);
        } else if (questions[currentQuestionIndex] && currentQuestion?.id === questions[currentQuestionIndex].id) {
            setCurrentQuestion(questions[currentQuestionIndex]);
        }
    }
  }, [examId, currentQuestionIndex, isQuizFinished, fetchQuestion, language, totalQuestions, questions, currentQuestion]);

  const finishQuiz = useCallback(async () => {
    if (examId === null || !settings) {
      setError("Cannot finish quiz: Exam ID or settings missing.");
      return;
    }
    navigate('/calculating-results');
    setIsLoading(true);
    clearError();
    try {
      const apiResult: ApiResultResponse = await api.getResults(examId);
      const score = apiResult.total_questions > 0
        ? Math.round((apiResult.correct_questions / apiResult.total_questions) * 100)
        : 0;
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
      setResult(finalResult);
      setIsQuizFinished(true);
      navigate('/results');
    } catch (err: any) {
      console.error("Error finishing quiz:", err);
      setError(err.message || 'Failed to load results.');
      navigate('/results');
    } finally {
      setIsLoading(false);
    }
  }, [examId, settings, navigate, clearError]);

  const setCurrentQuestionIndex = useCallback((index: number) => {
    if (index >= 0 && index < totalQuestions) {
        setCurrentQuestionIndexState(index);
    } else if (index >= totalQuestions) {
        finishQuiz();
    }
  }, [totalQuestions, finishQuiz]);

  const setLanguage = useCallback((lang: Language) => {
    // Store language preference in localStorage
    localStorage.setItem('preferredLanguage', lang);
    setLanguageState(lang);
    if (settings) {
      setSettingsState({ ...settings, language: lang });
    }
  }, [settings]);

  const startQuiz = useCallback(async (newSettings: QuizSettings) => {
    setIsLoading(true);
    clearError();
    let fetchedBanks: FrontendQuestionBank[] = [];
    try {
      try {
          const banksResponse = await api.getQuestionBanks();
          fetchedBanks = banksResponse.data.map(bank => ({
              id: bank.question_bank_id,
              name: bank.title,
              questions: bank.questions
          }));
      } catch (bankError: any) {
          console.error("Error fetching banks during startQuiz:", bankError);
          throw new Error("Failed to load question bank details.");
      }
      const bankDetails = fetchedBanks.find(b => b.id === newSettings.questionBankId);
      const bankName = bankDetails ? bankDetails.name : null;
      const examData = await api.createExam({
        question_bank_id: newSettings.questionBankId,
        language: newSettings.language,
        questions: newSettings.numberOfQuestions,
      });
      const newExamId = examData.exam_id;
      const totalData = await api.getTotalQuestions(newExamId);
      const fetchedTotalQuestions = totalData.total_questions;
      if (fetchedTotalQuestions <= 0) {
          throw new Error("No questions found for this exam configuration.");
      }
       if (newSettings.numberOfQuestions > fetchedTotalQuestions) {
           console.warn(`Requested ${newSettings.numberOfQuestions} questions, but only ${fetchedTotalQuestions} available in the bank. Starting with ${fetchedTotalQuestions}.`);
           newSettings.numberOfQuestions = fetchedTotalQuestions;
       }
      setSettingsState(newSettings);
      setSelectedBankName(bankName);
      setExamId(newExamId);
      setTotalQuestions(newSettings.numberOfQuestions);
      setCurrentQuestionIndexState(0);
      setUserAnswers([]);
      setResult(null);
      setIsQuizFinished(false);
      setLanguageState(newSettings.language);
      setCurrentQuestion(null);
      setQuestions([]);
      navigate('/quiz');
    } catch (err: any) {
      console.error("Error starting quiz:", err);
      setError(err.message || 'Failed to start quiz. Please try again.');
      setExamId(null);
      setTotalQuestions(0);
      setSelectedBankName(null);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, clearError]);

  const submitAnswer = useCallback(async (questionId: number, selectedOptionIds: string[]): Promise<ApiAnswerResponse | null> => {
    if (examId === null) {
        setError("Exam ID is missing.");
        return null;
    }
    setIsLoading(true);
    clearError();
    try {
      const response = await api.submitAnswer(examId, questionId, { user_answers: selectedOptionIds });
      const correctIds = response.actual_answers.sort();
      const selectedIdsSorted = [...selectedOptionIds].sort();
      const isCorrect = JSON.stringify(correctIds) === JSON.stringify(selectedIdsSorted);
      const newUserAnswer: UserAnswer = { questionId, selectedOptionIds, isCorrect };
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
       setCurrentQuestion(prev => prev ? ({
           ...prev,
           correctAnswerIds: response.actual_answers,
           explanation: response.explanation,
           userSelectedIds: selectedOptionIds,
           presetMessages: null,
       }) : null);
       setQuestions(prevQs => prevQs.map(q => q.id === questionId ? {
           ...q,
           correctAnswerIds: response.actual_answers,
           explanation: response.explanation,
           userSelectedIds: selectedOptionIds,
           presetMessages: null,
       } : q));
      api.getPresetChatMessages(examId, questionId)
          .then(presetResponse => {
              const fetchedPresets = presetResponse.messages;
              setCurrentQuestion(prev => prev?.id === questionId ? ({ ...prev, presetMessages: fetchedPresets }) : prev);
              setQuestions(prevQs => prevQs.map(q => q.id === questionId ? { ...q, presetMessages: fetchedPresets } : q));
          })
          .catch(presetError => {
              console.error("Error fetching preset messages in background:", presetError);
              setCurrentQuestion(prev => prev?.id === questionId ? ({ ...prev, presetMessages: [] }) : prev);
              setQuestions(prevQs => prevQs.map(q => q.id === questionId ? { ...q, presetMessages: [] } : q));
          });
      setIsLoading(false);
      return response;
    } catch (err: any) {
      console.error("Error submitting answer:", err);
      setError(err.message || 'Failed to submit answer.');
      setIsLoading(false);
      return null;
    }
  }, [examId, clearError]);

  const toggleMarkQuestion = useCallback(async (questionId: number) => {
    if (examId === null || !currentQuestion) {
        setError("Cannot mark question: Exam ID or question missing.");
        return;
    }
    const newMarkState = !currentQuestion.isMarked;
    setCurrentQuestion(prev => prev ? { ...prev, isMarked: newMarkState } : null);
     setQuestions(prevQs => prevQs.map(q => q.id === questionId ? { ...q, isMarked: newMarkState } : q));
    try {
      await api.toggleMarker(examId, questionId, newMarkState);
       toast(newMarkState ? "북마크 추가됨" : "북마크 제거됨", {
           description: newMarkState ? "나중에 다시 볼 수 있도록 문제를 표시했습니다." : "문제를 검토 목록에서 제거했습니다.",
           duration: 2000,
       });
    } catch (err: any) {
      console.error("Error toggling marker:", err);
      setError(err.message || 'Failed to update bookmark.');
      setCurrentQuestion(prev => prev ? { ...prev, isMarked: !newMarkState } : null);
      setQuestions(prevQs => prevQs.map(q => q.id === questionId ? { ...q, isMarked: !newMarkState } : q));
       toast.error("북마크 업데이트 실패");
    }
  }, [examId, currentQuestion]);

  const isQuestionMarked = useCallback((questionId: number): boolean => {
    return currentQuestion?.id === questionId && currentQuestion.isMarked;
  }, [currentQuestion]);

  const resetQuiz = useCallback(() => {
    // Abort any active chat stream before resetting
    chatAbortControllerRef.current?.abort();
    chatAbortControllerRef.current = null;

    setSettingsState(null);
    setSelectedBankName(null);
    setExamId(null);
    setCurrentQuestion(null);
    setQuestions([]);
    setCurrentQuestionIndexState(0);
    setTotalQuestions(0);
    setUserAnswers([]);
    setResult(null);
    setIsQuizFinished(false);
    // Don't reset language state to preserve user preference
    setIsLoading(false);
    setError(null);
    navigate('/');
  }, [navigate]);

   // --- Updated AI Chat Function (using fetch) ---
   const sendChatMessage = useCallback((questionId: number, message: string, callbacks: StreamCallbacks) => {
       if (examId === null) {
           callbacks.onError("Cannot send chat message: Exam ID missing.");
           return;
       }
       clearError();

       // Abort previous stream if it exists
       chatAbortControllerRef.current?.abort();
       const controller = new AbortController();
       chatAbortControllerRef.current = controller;

       try {
           // Call the fetch-based streaming API function
           api.postChatMessageStream(
               examId,
               questionId,
               { user: message },
               {
                   onOpen: callbacks.onOpen,
                   onMessage: callbacks.onMessage,
                   onError: (error) => {
                       // Handle errors, potentially close the source
                       console.error("SSE Error in context:", error);
                       // Check if the error was due to abort
                       if (controller.signal.aborted) {
                           console.log("Chat stream aborted successfully.");
                       } else {
                           callbacks.onError(error); // Forward non-abort errors
                       }
                       chatAbortControllerRef.current = null; // Clear ref on error/abort
                   },
                   onClose: () => {
                       // Handle clean close by server
                       console.log("SSE closed by server in context.");
                       chatAbortControllerRef.current = null; // Clear ref on close
                       callbacks.onClose?.(); // Forward close event
                   }
               }
               // Pass the signal to the fetch call if api.ts is modified to accept it
               // (Currently api.ts doesn't accept/use the signal)
           );

       } catch (err: any) {
           console.error("Error initiating chat stream:", err);
           callbacks.onError(err.message || "Failed to start chat stream.");
           chatAbortControllerRef.current = null; // Clear ref on initiation error
       }
   }, [examId, clearError]);

   // Function to explicitly close the chat stream by aborting the fetch
   const closeChatStream = useCallback(() => {
       if (chatAbortControllerRef.current) {
           console.log("Aborting chat stream fetch from context.");
           chatAbortControllerRef.current.abort();
           chatAbortControllerRef.current = null;
       }
   }, []);

   // Effect to close stream on unmount
   useEffect(() => {
       return () => {
           chatAbortControllerRef.current?.abort();
       };
   }, []);


  const contextValue = useMemo(() => ({
    settings,
    selectedBankName,
    examId,
    currentQuestion,
    questions,
    currentQuestionIndex,
    totalQuestions,
    setCurrentQuestionIndex,
    userAnswers,
    submitAnswer,
    result,
    startQuiz,
    resetQuiz,
    isQuizFinished,
    language,
    setLanguage,
    finishQuiz,
    toggleMarkQuestion,
    isQuestionMarked,
    isLoading,
    error,
    clearError,
    sendChatMessage, // Provide the updated function
    closeChatStream, // Provide the close function
  }), [
      settings, selectedBankName, examId, currentQuestion, questions, currentQuestionIndex, totalQuestions, userAnswers, result,
      isQuizFinished, language, isLoading, error,
      setCurrentQuestionIndex, submitAnswer, startQuiz, resetQuiz, setLanguage,
      finishQuiz, toggleMarkQuestion, isQuestionMarked, clearError, sendChatMessage, closeChatStream,
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

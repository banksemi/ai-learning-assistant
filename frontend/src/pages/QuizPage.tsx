import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuiz } from '@/context/QuizContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AlertCircle, Loader2 } from 'lucide-react'; // Added Loader2
import { cn } from '@/lib/utils';
import QuizProgressBar from '@/components/quiz/QuizProgressBar';
import QuestionHeader from '@/components/quiz/QuestionHeader';
import QuestionContent from '@/components/quiz/QuestionContent';
import QuestionOptions from '@/components/quiz/QuestionOptions';
import FeedbackSection from '@/components/quiz/FeedbackSection';
import QuizFooter from '@/components/quiz/QuizFooter';
import AiChatPopup from '@/components/quiz/AiChatPopup';
import { toast } from "sonner"; // Keep sonner import for potential direct use if needed elsewhere
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For error display

const QuizPage = () => {
  const {
    // Get state and functions from the updated context
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    language,
    isLoading, // Use loading state from context
    error, // Use error state from context
    examId, // Needed for API calls potentially, though context handles most
    submitAnswer,
    setCurrentQuestionIndex,
    finishQuiz,
    toggleMarkQuestion,
    isQuestionMarked,
    resetQuiz, // Keep resetQuiz for error handling
    sendChatMessage, // Pass this down to AiChatPopup
    clearError, // To clear errors when navigating or retrying
  } = useQuiz();

  // Local UI state remains
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState<boolean>(false);
  const quizCardRef = useRef<HTMLDivElement>(null);

  // --- MOVE ALL useCallback HOOKS HERE (BEFORE conditional returns) ---
  const handleOptionChange = useCallback((optionId: string) => {
    // Guard against changes after submission
    if (isAnswerSubmitted) return;
    // Ensure currentQuestion exists before accessing its type
    if (!currentQuestion) return;

    if (currentQuestion.type === 'single') {
      setSelectedOptions([optionId]);
    } else {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    }
  }, [isAnswerSubmitted, currentQuestion]); // Add currentQuestion dependency

  const handleNext = useCallback(() => {
    // Scroll to top ONLY if it's NOT the last question
    if (currentQuestionIndex < totalQuestions - 1) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Short delay for scroll animation or navigation
    setTimeout(() => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            finishQuiz(); // Context now handles fetching results
        }
    }, 100);

  }, [currentQuestionIndex, totalQuestions, setCurrentQuestionIndex, finishQuiz]);

  const handleSubmit = useCallback(async () => {
    // Ensure currentQuestion exists before accessing its ID
    if (!currentQuestion) {
        toast.error(language === 'ko' ? "현재 질문 정보를 찾을 수 없습니다." : "Cannot find current question information.");
        return;
    }
    if (selectedOptions.length === 0) {
      toast.warning(language === 'ko' ? "답변을 선택해주세요." : "Please select an answer.");
      return;
    }

    // Call the async submitAnswer from context
    const response = await submitAnswer(currentQuestion.id, selectedOptions);

    if (response) {
      // Determine correctness based on API response
      const correctIds = response.actual_answers.sort();
      const selectedIdsSorted = [...selectedOptions].sort();
      const correct = JSON.stringify(correctIds) === JSON.stringify(selectedIdsSorted);

      // Update local state *after* successful API call
      setIsCorrect(correct);
      setShowFeedback(true);
      setIsAnswerSubmitted(true);
    } else {
      // Error handling is done within the context, but you could add specific UI feedback here if needed
      toast.error(language === 'ko' ? "답변 제출 중 오류 발생" : "Error submitting answer");
    }
  }, [selectedOptions, language, currentQuestion, submitAnswer]); // Dependencies updated

  const getOptionStyle = useCallback((optionId: string): string => {
    // Ensure currentQuestion exists before accessing correctAnswerIds
    if (!currentQuestion) return 'quiz-option-default'; // Default style if no question

    const isSelected = selectedOptions.includes(optionId);
    const isCorrectAnswer = currentQuestion.correctAnswerIds.includes(optionId);

    if (isAnswerSubmitted) {
      if (isCorrectAnswer) return 'quiz-option-correct';
      if (isSelected && !isCorrectAnswer) return 'quiz-option-incorrect-selected';
      return 'quiz-option-disabled';
    } else {
      if (isSelected) return 'quiz-option-selected';
      return 'quiz-option-default';
    }
  }, [selectedOptions, currentQuestion, isAnswerSubmitted]); // Add currentQuestion dependency

  const handleBookmark = useCallback(async () => {
    // Ensure currentQuestion exists before accessing its ID
    if (!currentQuestion) {
        toast.error(language === 'ko' ? "현재 질문 정보를 찾을 수 없습니다." : "Cannot find current question information.");
        return;
    }
    await toggleMarkQuestion(currentQuestion.id);
    // Toast notification is now handled within the context's toggleMarkQuestion
  }, [toggleMarkQuestion, currentQuestion, language]); // Add currentQuestion and language dependencies

  const handleAskAI = useCallback(() => {
    setIsAiChatOpen(true);
  }, []);
  // --- END OF useCallback HOOKS ---


  // Effect to reset local state when the question changes (via index)
  useEffect(() => {
    setSelectedOptions([]);
    setShowFeedback(false);
    setIsAnswerSubmitted(false);
    setIsCorrect(null);
    if (clearError) clearError(); // Clear any previous errors when question changes
    // Scroll to top handled in handleNext/initial load
  }, [currentQuestionIndex, clearError]);

  // --- Loading State ---
  if (isLoading && !currentQuestion) { // Show skeleton only on initial load or if question is null
    return (
      <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-background">
         {/* Simplified Loading Skeleton */}
         <Skeleton className="h-4 w-1/4 mb-2" />
         <Skeleton className="h-2 w-full max-w-3xl mb-4" />
         <Card className="w-full max-w-3xl shadow-lg border-none">
             <CardHeader className="px-4 py-5 md:px-6 md:pt-6 md:pb-4">
                 <div className="flex justify-between items-center mb-3">
                     <Skeleton className="h-6 w-1/3" />
                     <Skeleton className="h-10 w-10 rounded-full" />
                 </div>
                 <Skeleton className="h-5 w-full mt-1" />
                 <Skeleton className="h-5 w-3/4 mt-1" />
             </CardHeader>
             <CardContent className="px-4 pb-5 md:px-6 md:pb-6 space-y-4 md:space-y-3">
                 <Skeleton className="h-16 w-full rounded-lg" />
                 <Skeleton className="h-16 w-full rounded-lg" />
                 <Skeleton className="h-16 w-full rounded-lg" />
                 <Skeleton className="h-16 w-full rounded-lg" />
             </CardContent>
             <CardFooter className="p-0 flex flex-col">
                 <Skeleton className="h-px w-full" />
                 <div className="w-full px-4 py-4 md:px-6 md:py-4 flex flex-col-reverse md:flex-row items-center justify-between gap-3 md:gap-4">
                     <Skeleton className="h-9 w-28 rounded-md" />
                     <Skeleton className="h-11 w-32 rounded-md" />
                 </div>
             </CardFooter>
         </Card>
      </div>
    );
  }

  // --- Error State ---
   if (error) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
         <Alert variant="destructive" className="max-w-md mb-4">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>{language === 'ko' ? '오류 발생' : 'An Error Occurred'}</AlertTitle>
           <AlertDescription>
             {error}
             <br />
             {language === 'ko' ? '문제를 로드하거나 제출하는 중 문제가 발생했습니다.' : 'There was a problem loading or submitting the question.'}
           </AlertDescription>
         </Alert>
         <Button onClick={resetQuiz} variant="outline">
           {language === 'ko' ? '설정으로 돌아가기' : 'Back to Settings'}
         </Button>
       </div>
     );
   }

  // --- No Question State (Should ideally be covered by loading/error) ---
  // This check might be redundant now due to the loading check, but keep for safety
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
         <Alert variant="destructive" className="max-w-md mb-4">
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>{language === 'ko' ? '질문 없음' : 'No Question Found'}</AlertTitle>
             <AlertDescription>
                 {language === 'ko' ? '현재 질문 데이터를 찾을 수 없습니다. 다시 시도해주세요.' : 'Could not find the current question data. Please try again.'}
             </AlertDescription>
         </Alert>
        <Button onClick={resetQuiz} variant="outline">
          {language === 'ko' ? '설정으로 돌아가기' : 'Back to Settings'}
        </Button>
      </div>
    );
  }

  // Extract data from the currentQuestion object (safe now due to checks above)
  const options = currentQuestion.options;
  const questionText = currentQuestion.text;
  const explanationText = currentQuestion.explanation;
  const questionType = currentQuestion.type;
  const questionId = currentQuestion.id;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-background">
      {/* Progress Bar uses totalQuestions from context */}
      <QuizProgressBar
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        language={language}
      />
      <Card ref={quizCardRef} className="w-full max-w-3xl shadow-lg border-none">
        <CardHeader className="px-4 py-5 md:px-6 md:pt-6 md:pb-4">
          {/* Header uses context state/functions */}
          <QuestionHeader
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={totalQuestions}
            language={language}
            onBookmark={handleBookmark}
            isMarked={isQuestionMarked(questionId)} // Use context function
          />
          {/* Content uses questionText from context */}
          <QuestionContent questionText={questionText} />
        </CardHeader>
        <CardContent className="px-4 pb-5 md:px-6 md:pb-6 space-y-4 md:space-y-3">
          {/* Options use data derived from context's currentQuestion */}
          <QuestionOptions
            question={currentQuestion} // Pass the whole question object
            options={options} // Pass derived options
            selectedOptions={selectedOptions}
            onOptionChange={handleOptionChange}
            isAnswerSubmitted={isAnswerSubmitted}
            getOptionStyle={getOptionStyle}
          />
          {/* Feedback uses local state and explanation from context's currentQuestion */}
          <FeedbackSection
            showFeedback={showFeedback}
            isCorrect={isCorrect}
            explanationText={explanationText} // Populated after submit
            language={language}
          />
        </CardContent>
        <CardFooter className="p-0 flex flex-col">
          {/* Footer uses context state and local handlers */}
          <QuizFooter
            language={language}
            isAnswerSubmitted={isAnswerSubmitted}
            selectedOptions={selectedOptions}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={totalQuestions}
            onSubmit={handleSubmit}
            onNext={handleNext}
            onAskAI={handleAskAI}
          />
        </CardFooter>
      </Card>
      {/* AI Chat Popup - Pass sendChatMessage from context */}
      <AiChatPopup
        isOpen={isAiChatOpen}
        onOpenChange={setIsAiChatOpen}
        question={currentQuestion} // Pass current question for context
        language={language}
        // Pass the actual sendChatMessage function from context
        sendChatMessage={(message) => sendChatMessage(questionId, message)}
      />
    </div>
  );
};

export default QuizPage;

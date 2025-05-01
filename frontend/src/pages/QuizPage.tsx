import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuiz } from '@/context/QuizContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import QuizProgressBar from '@/components/quiz/QuizProgressBar';
import QuestionHeader from '@/components/quiz/QuestionHeader';
import QuestionContent from '@/components/quiz/QuestionContent';
import QuestionOptions from '@/components/quiz/QuestionOptions';
import FeedbackSection from '@/components/quiz/FeedbackSection';
import QuizFooter from '@/components/quiz/QuizFooter';
import AiChatPopup from '@/components/quiz/AiChatPopup';
import { toast } from "sonner";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const QuizPage = () => {
  const {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    language,
    isLoading, // Use loading state from context for question fetching
    error,
    examId,
    submitAnswer,
    setCurrentQuestionIndex,
    finishQuiz,
    toggleMarkQuestion,
    isQuestionMarked,
    resetQuiz,
    sendChatMessage,
    clearError,
  } = useQuiz();

  // Local UI state
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // State for submit button loading
  const quizCardRef = useRef<HTMLDivElement>(null);

  // --- useCallback Hooks ---
  const handleOptionChange = useCallback((optionId: string) => {
    // Guard against changes after submission OR during submission
    if (isAnswerSubmitted || isSubmitting) return;
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
  }, [isAnswerSubmitted, isSubmitting, currentQuestion]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setTimeout(() => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            finishQuiz();
        }
    }, 100);
  }, [currentQuestionIndex, totalQuestions, setCurrentQuestionIndex, finishQuiz]);

  const handleSubmit = useCallback(async () => {
    if (!currentQuestion) {
        toast.error(language === 'ko' ? "현재 질문 정보를 찾을 수 없습니다." : "Cannot find current question information.");
        return;
    }
    if (selectedOptions.length === 0) {
      toast.warning(language === 'ko' ? "답변을 선택해주세요." : "Please select an answer.");
      return;
    }

    setIsSubmitting(true); // Start submitting state
    try {
      const response = await submitAnswer(currentQuestion.id, selectedOptions);
      if (response) {
        const correctIds = response.actual_answers.sort();
        const selectedIdsSorted = [...selectedOptions].sort();
        const correct = JSON.stringify(correctIds) === JSON.stringify(selectedIdsSorted);
        setIsCorrect(correct);
        setShowFeedback(true);
        setIsAnswerSubmitted(true); // Mark as submitted *after* successful API call
      } else {
        toast.error(language === 'ko' ? "답변 제출 중 오류 발생" : "Error submitting answer");
      }
    } catch (err) {
        console.error("Submit error caught in component:", err);
    } finally {
        setIsSubmitting(false); // End submitting state regardless of success/error
    }
  }, [selectedOptions, language, currentQuestion, submitAnswer]);

  const getOptionStyle = useCallback((optionId: string): string => {
    if (!currentQuestion) return 'quiz-option-default';

    const isSelected = selectedOptions.includes(optionId);
    const isCorrectAnswer = currentQuestion.correctAnswerIds?.includes(optionId);

    if (isAnswerSubmitted || isSubmitting) {
      if (isCorrectAnswer) return 'quiz-option-correct';
      if (isSelected && !isCorrectAnswer) return 'quiz-option-incorrect-selected';
      return 'quiz-option-disabled';
    } else {
      if (isSelected) return 'quiz-option-selected';
      return 'quiz-option-default';
    }
  }, [selectedOptions, currentQuestion, isAnswerSubmitted, isSubmitting]);

  const handleBookmark = useCallback(async () => {
    // Prevent bookmarking during loading/submitting or if no question
    if (isLoading || isSubmitting || !currentQuestion) {
        return;
    }
    await toggleMarkQuestion(currentQuestion.id);
  }, [toggleMarkQuestion, currentQuestion, language, isLoading, isSubmitting]); // Added isLoading/isSubmitting

  const handleAskAI = useCallback(() => {
    setIsAiChatOpen(true);
  }, []);
  // --- END OF useCallback HOOKS ---

  // Effect to reset local state when the question changes
  useEffect(() => {
    setSelectedOptions([]);
    setShowFeedback(false);
    setIsAnswerSubmitted(false);
    setIsCorrect(null);
    setIsSubmitting(false);
    if (clearError) clearError();
  }, [currentQuestionIndex, clearError]);

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

  // --- No Question State (after initial load, if error didn't catch it) ---
  // Check !isLoading here to avoid showing this during transitions
  if (!currentQuestion && !isLoading) {
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

  // Determine if we are in the loading state for the *next* question
  // (Context isLoading is true, but we are not currently submitting an answer)
  const isLoadingNextQuestion = isLoading && !isSubmitting;

  // Safely access question data only if not loading the next question
  const questionId = !isLoadingNextQuestion && currentQuestion ? currentQuestion.id : null;
  const questionText = !isLoadingNextQuestion && currentQuestion ? currentQuestion.text : '';
  const options = !isLoadingNextQuestion && currentQuestion ? currentQuestion.options : [];
  const explanationText = !isLoadingNextQuestion && currentQuestion ? currentQuestion.explanation : '';

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-background">
      {/* Progress Bar is always visible */}
      <QuizProgressBar
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        language={language}
      />
      <Card ref={quizCardRef} className="w-full max-w-3xl shadow-lg border-none">
        <CardHeader className="px-4 py-5 md:px-6 md:pt-6 md:pb-4">
          {/* Question Header: Number always visible, bookmark shows skeleton */}
          <QuestionHeader
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={totalQuestions}
            language={language}
            onBookmark={handleBookmark}
            // Pass isMarked only if we have a valid questionId
            isMarked={questionId ? isQuestionMarked(questionId) : false}
            // Pass loading state to QuestionHeader
            isLoading={isLoadingNextQuestion}
          />
          {/* Question Content: Show skeleton or actual content */}
          {isLoadingNextQuestion ? (
            <>
              <Skeleton className="h-5 w-full mt-1" />
              <Skeleton className="h-5 w-3/4 mt-1" />
            </>
          ) : (
            <QuestionContent questionText={questionText} />
          )}
        </CardHeader>
        <CardContent className="px-4 pb-5 md:px-6 md:pb-6 space-y-4 md:space-y-3">
          {/* Options: Show skeleton or actual options */}
          {isLoadingNextQuestion ? (
            <>
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </>
          ) : (
            <>
              <QuestionOptions
                // Pass currentQuestion only if available and not loading
                question={currentQuestion!} // Assert non-null as we checked !isLoadingNextQuestion
                options={options}
                selectedOptions={selectedOptions}
                onOptionChange={handleOptionChange}
                isAnswerSubmitted={isAnswerSubmitted}
                isSubmitting={isSubmitting}
                getOptionStyle={getOptionStyle}
              />
              {/* Feedback Section: Only shown after submit, not during loading */}
              <FeedbackSection
                showFeedback={showFeedback}
                isCorrect={isCorrect}
                explanationText={explanationText}
                language={language}
              />
            </>
          )}
        </CardContent>
        <CardFooter className="p-0 flex flex-col">
          {/* Footer: Show skeleton or actual footer */}
          {isLoadingNextQuestion ? (
            <>
              <Skeleton className="h-px w-full" />
              <div className="w-full px-4 py-4 md:px-6 md:py-4 flex flex-col-reverse md:flex-row items-center justify-between gap-3 md:gap-4">
                <Skeleton className="h-9 w-28 rounded-md" />
                <Skeleton className="h-11 w-32 rounded-md" />
              </div>
            </>
          ) : (
            <QuizFooter
              language={language}
              isAnswerSubmitted={isAnswerSubmitted}
              isSubmitting={isSubmitting}
              selectedOptions={selectedOptions}
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={totalQuestions}
              onSubmit={handleSubmit}
              onNext={handleNext}
              onAskAI={handleAskAI}
            />
          )}
        </CardFooter>
      </Card>
      {/* AI Chat Popup: Render only if not loading and question exists */}
      {!isLoadingNextQuestion && currentQuestion && (
        <AiChatPopup
          isOpen={isAiChatOpen}
          onOpenChange={setIsAiChatOpen}
          question={currentQuestion}
          language={language}
          sendChatMessage={(message) => sendChatMessage(currentQuestion.id, message)}
        />
      )}
    </div>
  );
};

export default QuizPage;

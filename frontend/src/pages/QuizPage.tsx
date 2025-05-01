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
        // Correct answer IDs are now available in the updated currentQuestion from context
        // We can determine correctness here or rely on the updated currentQuestion state
        const correctIds = response.actual_answers.sort();
        const selectedIdsSorted = [...selectedOptions].sort();
        const correct = JSON.stringify(correctIds) === JSON.stringify(selectedIdsSorted);
        setIsCorrect(correct); // Set local state for feedback display
        setShowFeedback(true);
        setIsAnswerSubmitted(true); // Mark as submitted *after* successful API call and state updates
      } else {
        toast.error(language === 'ko' ? "답변 제출 중 오류 발생" : "Error submitting answer");
        // If submitAnswer returns null due to error, ensure isAnswerSubmitted is false
        setIsAnswerSubmitted(false);
      }
    } catch (err) {
        console.error("Submit error caught in component:", err);
        setIsAnswerSubmitted(false); // Ensure not marked as submitted on error
    } finally {
        setIsSubmitting(false); // End submitting state regardless of success/error
    }
  }, [selectedOptions, language, currentQuestion, submitAnswer]);

  const getOptionStyle = useCallback((optionId: string): string => {
    if (!currentQuestion) return 'quiz-option-default';

    const isSelected = selectedOptions.includes(optionId);
    // Correct answer IDs are only reliable *after* submission is complete and feedback is shown
    const isCorrectAnswer = isAnswerSubmitted ? currentQuestion.correctAnswerIds?.includes(optionId) : false;

    // State 1: Currently Submitting (API call in progress)
    if (isSubmitting) {
        // Apply a distinct "disabled selected" style if this option was selected
        if (isSelected) {
            return 'quiz-option-disabled-selected';
        }
        // Apply the standard disabled style for other options
        return 'quiz-option-disabled';
    }
    // State 2: Answer Submitted (API call finished, feedback shown)
    else if (isAnswerSubmitted) {
        // Apply correct/incorrect styles based on the API response
        if (isCorrectAnswer) return 'quiz-option-correct';
        if (isSelected && !isCorrectAnswer) return 'quiz-option-incorrect-selected';
        // Style for non-selected options after submission (standard disabled)
        return 'quiz-option-disabled';
    }
    // State 3: Before Submission
    else {
        if (isSelected) return 'quiz-option-selected';
        return 'quiz-option-default';
    }
  }, [selectedOptions, currentQuestion, isAnswerSubmitted, isSubmitting]); // Dependencies updated

  const handleBookmark = useCallback(async () => {
    // Prevent bookmarking during loading/submitting or if no question
    if (isLoading || isSubmitting || !currentQuestion) {
        return;
    }
    await toggleMarkQuestion(currentQuestion.id);
  }, [toggleMarkQuestion, currentQuestion, language, isLoading, isSubmitting]);

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

  // --- Define isLoadingNextQuestion BEFORE the return statement ---
  // Determine if we are in the loading state for the *next* question
  // (Context isLoading is true, but we are not currently submitting an answer)
  const isLoadingNextQuestion = isLoading && !isSubmitting;

  // --- Loading State ---
  // Use the defined isLoadingNextQuestion variable
  if (isLoadingNextQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-background">
         {/* Loading Skeleton */}
         <QuizProgressBar
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={totalQuestions}
            language={language}
         />
         <Card className="w-full max-w-3xl shadow-lg border-none">
             <CardHeader className="px-4 py-5 md:px-6 md:pt-6 md:pb-4">
                 {/* Keep QuestionHeader visible but show skeleton for bookmark */}
                 <QuestionHeader
                    currentQuestionIndex={currentQuestionIndex}
                    totalQuestions={totalQuestions}
                    language={language}
                    onBookmark={() => {}} // Dummy function during load
                    isMarked={false} // Dummy value during load
                    isLoading={true} // Indicate loading for bookmark skeleton
                 />
                 {/* Skeleton for Question Content */}
                 <Skeleton className="h-5 w-full mt-1" />
                 <Skeleton className="h-5 w-3/4 mt-1" />
             </CardHeader>
             <CardContent className="px-4 pb-5 md:px-6 md:pb-6 space-y-4 md:space-y-3">
                 {/* Skeleton for Options */}
                 <Skeleton className="h-16 w-full rounded-lg" />
                 <Skeleton className="h-16 w-full rounded-lg" />
                 <Skeleton className="h-16 w-full rounded-lg" />
                 <Skeleton className="h-16 w-full rounded-lg" />
             </CardContent>
             <CardFooter className="p-0 flex flex-col">
                 {/* Skeleton for Footer */}
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

  // --- No Question State ---
  if (!currentQuestion && !isLoading) { // Check !isLoading here too
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

  // --- Render Quiz ---
  if (!currentQuestion) {
      return <div>{language === 'ko' ? '질문을 불러오는 중...' : 'Loading question...'}</div>;
  }

  const { options, text: questionText, explanation: explanationText, id: questionId } = currentQuestion;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-background">
      <QuizProgressBar
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        language={language}
      />
      <Card ref={quizCardRef} className="w-full max-w-3xl shadow-lg border-none">
        <CardHeader className="px-4 py-5 md:px-6 md:pt-6 md:pb-4">
          {/* Pass isLoadingNextQuestion to header */}
          <QuestionHeader
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={totalQuestions}
            language={language}
            onBookmark={handleBookmark}
            isMarked={isQuestionMarked(questionId)}
            isLoading={isLoadingNextQuestion} // Pass the loading state
          />
          {/* Question Content is rendered normally even if header bookmark is loading */}
          <QuestionContent questionText={questionText} />
        </CardHeader>
        <CardContent className="px-4 pb-5 md:px-6 md:pb-6 space-y-4 md:space-y-3">
          {/* Options are rendered normally */}
          <QuestionOptions
            question={currentQuestion}
            options={options}
            selectedOptions={selectedOptions}
            onOptionChange={handleOptionChange}
            isAnswerSubmitted={isAnswerSubmitted}
            isSubmitting={isSubmitting}
            getOptionStyle={getOptionStyle}
          />
          {/* Feedback Section */}
          <FeedbackSection
            showFeedback={showFeedback}
            isCorrect={isCorrect}
            explanationText={explanationText}
            language={language}
          />
        </CardContent>
        <CardFooter className="p-0 flex flex-col">
          {/* Footer is rendered normally */}
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
        </CardFooter>
      </Card>
      {/* AI Chat Popup */}
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

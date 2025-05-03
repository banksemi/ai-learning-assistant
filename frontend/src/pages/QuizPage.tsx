import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuiz } from '@/context/QuizContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
// Removed direct import of QuizProgressBar
// import QuizProgressBar from '@/components/quiz/QuizProgressBar';
import QuestionHeader from '@/components/quiz/QuestionHeader';
import QuestionContent from '@/components/quiz/QuestionContent';
import QuestionOptions from '@/components/quiz/QuestionOptions';
import FeedbackSection from '@/components/quiz/FeedbackSection';
import QuizFooter from '@/components/quiz/QuizFooter';
import AiChatPopup from '@/components/quiz/AiChatPopup';
import { toast } from "sonner";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import QuizFixedHeader from '@/components/quiz/QuizFixedHeader'; // Import the new header component

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
    selectedBankName, // Get selected bank name from context
  } = useQuiz();

  // Local UI state remains the same
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const quizCardRef = useRef<HTMLDivElement>(null);

  // --- useCallback Hooks remain the same ---
  const handleOptionChange = useCallback((optionId: string) => {
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
    // Scroll is now handled in useEffect
    // window.scrollTo(0, 0);

    // Update state immediately
    if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
        finishQuiz();
    }
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
    setIsSubmitting(true);
    try {
      const response = await submitAnswer(currentQuestion.id, selectedOptions);
      if (response) {
        const correctIds = response.actual_answers.sort();
        const selectedIdsSorted = [...selectedOptions].sort();
        const correct = JSON.stringify(correctIds) === JSON.stringify(selectedIdsSorted);
        setIsCorrect(correct);
        setShowFeedback(true);
        setIsAnswerSubmitted(true);
      } else {
        toast.error(language === 'ko' ? "답변 제출 중 오류 발생" : "Error submitting answer");
        setIsAnswerSubmitted(false);
      }
    } catch (err) {
        console.error("Submit error caught in component:", err);
        setIsAnswerSubmitted(false);
    } finally {
        setIsSubmitting(false);
    }
  }, [selectedOptions, language, currentQuestion, submitAnswer]);

  const getOptionStyle = useCallback((optionId: string): string => {
    if (!currentQuestion) return 'quiz-option-default';
    const isSelected = selectedOptions.includes(optionId);
    const isCorrectAnswer = isAnswerSubmitted ? currentQuestion.correctAnswerIds?.includes(optionId) : false;
    if (isSubmitting) {
        return isSelected ? 'quiz-option-disabled-selected' : 'quiz-option-disabled';
    } else if (isAnswerSubmitted) {
        if (isCorrectAnswer) return 'quiz-option-correct';
        if (isSelected && !isCorrectAnswer) return 'quiz-option-incorrect-selected';
        return 'quiz-option-disabled';
    } else {
        return isSelected ? 'quiz-option-selected' : 'quiz-option-default';
    }
  }, [selectedOptions, currentQuestion, isAnswerSubmitted, isSubmitting]);

  const handleBookmark = useCallback(async () => {
    if (isLoading || isSubmitting || !currentQuestion) return;
    await toggleMarkQuestion(currentQuestion.id);
  }, [toggleMarkQuestion, currentQuestion, language, isLoading, isSubmitting]);

  const handleAskAI = useCallback(() => {
    setIsAiChatOpen(true);
  }, []);
  // --- END OF useCallback HOOKS ---

  // Effect to reset local state AND SCROLL TO TOP when the question changes
  useEffect(() => {
    // Scroll to top instantly when the index changes
    window.scrollTo(0, 0); // <<<--- 이 부분이 스크롤을 담당합니다

    // Reset local state
    setSelectedOptions([]);
    setShowFeedback(false);
    setIsAnswerSubmitted(false);
    setIsCorrect(null);
    setIsSubmitting(false);
    if (clearError) clearError();
  }, [currentQuestionIndex, clearError]); // currentQuestionIndex가 변경될 때마다 실행됩니다

  // Determine if we are loading the *next* question
  const isLoadingNextQuestion = isLoading && !isSubmitting;

  // --- Loading State ---
  if (isLoadingNextQuestion) {
    return (
      // Main container for the page, ADD PADDING TOP for fixed header
      <div className="min-h-screen bg-background pt-16"> {/* Added pt-16 */}
        {/* Render the ACTUAL header (now fixed) */}
        <QuizFixedHeader
          selectedBankName={selectedBankName}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
          language={language}
          isLoading={false} // Header itself doesn't show skeleton anymore
        />
        {/* Centered container for the card skeleton */}
        {/* REMOVED mt-4 from this container */}
        <div className="flex justify-center px-4 md:px-8 pb-4 md:pb-8">
          <div className="w-full max-w-3xl">
            {/* Skeleton for the Card content BELOW the header */}
            <Card className="w-full shadow-lg border-none">
                <CardHeader className="px-4 py-5 md:px-6 md:pt-6 md:pb-4">
                    {/* QuestionHeader inside card still shows skeleton for bookmark */}
                    <QuestionHeader
                        currentQuestionIndex={currentQuestionIndex}
                        totalQuestions={totalQuestions}
                        language={language}
                        onBookmark={() => {}}
                        isMarked={false}
                        isLoading={true} // Skeleton for bookmark button
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
        </div>
      </div>
    );
  }

  // --- Error State (remains the same) ---
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

  // --- No Question State (remains the same) ---
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

  // --- Render Quiz ---
  if (!currentQuestion) {
      return <div>{language === 'ko' ? '질문을 불러오는 중...' : 'Loading question...'}</div>;
  }

  const { options, text: questionText, explanation: explanationText, id: questionId } = currentQuestion;

  return (
    // Main container for the page, ADD PADDING TOP for fixed header
    <div className="min-h-screen bg-background pt-16"> {/* Added pt-16 */}
      {/* Use the new Fixed Header Component (now fixed) */}
      <QuizFixedHeader
        selectedBankName={selectedBankName}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        language={language}
        isLoading={isLoadingNextQuestion} // Pass loading state (header doesn't use it for skeleton anymore)
      />

      {/* Centered container for the card */}
      {/* REMOVED mt-4 from this container */}
      <div className="flex justify-center px-4 md:px-8 pb-4 md:pb-8">
        <div className="w-full max-w-3xl">
          {/* Quiz Card */}
          <Card ref={quizCardRef} className="w-full shadow-lg border-none rounded-lg">
            <CardHeader className="px-4 py-5 md:px-6 md:pt-6 md:pb-4">
              <QuestionHeader
                currentQuestionIndex={currentQuestionIndex}
                totalQuestions={totalQuestions}
                language={language}
                onBookmark={handleBookmark}
                isMarked={isQuestionMarked(questionId)}
                isLoading={isLoadingNextQuestion} // Pass loading state for bookmark button skeleton
              />
              <QuestionContent questionText={questionText} />
            </CardHeader>
            <CardContent className="px-4 pb-5 md:px-6 md:pb-6 space-y-4 md:space-y-3">
              <QuestionOptions
                question={currentQuestion}
                options={options}
                selectedOptions={selectedOptions}
                onOptionChange={handleOptionChange}
                isAnswerSubmitted={isAnswerSubmitted}
                isSubmitting={isSubmitting}
                getOptionStyle={getOptionStyle}
              />
              <FeedbackSection
                showFeedback={showFeedback}
                isCorrect={isCorrect}
                explanationText={explanationText}
                language={language}
              />
            </CardContent>
            <CardFooter className="p-0 flex flex-col">
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
        </div>
      </div>

      {/* AI Chat Popup (remains the same) */}
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

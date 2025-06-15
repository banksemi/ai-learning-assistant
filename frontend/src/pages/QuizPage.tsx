import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuiz } from '@/context/QuizContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import QuestionHeader from '@/components/quiz/QuestionHeader';
import QuestionContent from '@/components/quiz/QuestionContent';
import QuestionOptions from '@/components/quiz/QuestionOptions';
import FeedbackSection from '@/components/quiz/FeedbackSection';
import QuizFooter from '@/components/quiz/QuizFooter';
import AiChatPopup from '@/components/quiz/AiChatPopup';
import { toast } from "sonner";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import QuizFixedHeader from '@/components/quiz/QuizFixedHeader'; // Import the fixed header component
import { useTranslation } from '@/translations';

// Skeleton Card Component (Extracted for clarity)
const SkeletonQuizCard = ({ currentQuestionIndex, totalQuestions, language }: { currentQuestionIndex: number, totalQuestions: number, language: string }) => (
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
);

// Actual Quiz Card Component (Extracted for clarity)
const ActualQuizCard = ({
    quizCardRef,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    language,
    handleBookmark,
    isQuestionMarked,
    isLoadingNextQuestion,
    options,
    questionText,
    explanationText,
    selectedOptions,
    handleOptionChange,
    isAnswerSubmitted,
    isSubmitting,
    getOptionStyle,
    showFeedback,
    isCorrect,
    handleSubmit,
    handleNext,
    handleAskAI
}: any) => ( // Use 'any' for simplicity here, or define a proper props interface
    <Card ref={quizCardRef} className="w-full shadow-lg border-none rounded-lg">
        <CardHeader className="px-4 py-5 md:px-6 md:pt-6 md:pb-4">
            <QuestionHeader
                currentQuestionIndex={currentQuestionIndex}
                totalQuestions={totalQuestions}
                language={language}
                onBookmark={handleBookmark}
                isMarked={isQuestionMarked(currentQuestion.id)}
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
);


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
    // fetchPresetMessages, // REMOVED: No longer needed from context
  } = useQuiz();
  const { t } = useTranslation();

  // Local UI state remains the same
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const quizCardRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null); // Ref to store requestAnimationFrame ID

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

  // Wrap state update in requestAnimationFrame
  const handleNext = useCallback(() => {
    // Cancel previous frame request if any
    if (rafId.current) {
        cancelAnimationFrame(rafId.current);
    }
    // Request animation frame for the state update
    rafId.current = requestAnimationFrame(() => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            finishQuiz();
        }
    });
  }, [currentQuestionIndex, totalQuestions, setCurrentQuestionIndex, finishQuiz]);

  const handleSubmit = useCallback(async () => {
    if (!currentQuestion) {
      toast.error(t('quiz.errorLoadingQuestion'));
      return;
    }
    if (selectedOptions.length === 0) {
      toast.warning(t('quiz.pleaseSelectAnswer'));
      return;
    }
    setIsSubmitting(true);
    try {
      // submitAnswer now also fetches and stores preset messages internally
      const response = await submitAnswer(currentQuestion.id, selectedOptions);
      if (response) {
        const correctIds = response.actual_answers.sort();
        const selectedIdsSorted = [...selectedOptions].sort();
        const correct = JSON.stringify(correctIds) === JSON.stringify(selectedIdsSorted);
        setIsCorrect(correct);
        setShowFeedback(true);
        setIsAnswerSubmitted(true);
      } else {
        toast.error(t('quiz.errorSubmittingAnswer'));
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

  // Effect to reset local state when the question changes
  // Wrap state updates in requestAnimationFrame
  useEffect(() => {
    // Cancel previous frame request if any
    if (rafId.current) {
        cancelAnimationFrame(rafId.current);
    }
    // Request animation frame for the state updates
    rafId.current = requestAnimationFrame(() => {
        // window.scrollTo(0, 0); // Keep disabled
        setSelectedOptions([]);
        setShowFeedback(false);
        setIsAnswerSubmitted(false);
        setIsCorrect(null);
        setIsSubmitting(false);
        if (clearError) clearError();
    });

    // Cleanup function to cancel the frame request if component unmounts or index changes again
    return () => {
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
        }
    };
  }, [currentQuestionIndex, clearError]);

  // Determine if we are loading the *next* question
  const isLoadingNextQuestion = isLoading && !isSubmitting;

  // --- Render ---
  return (
    // Main container: Added flex flex-col
    <div className="min-h-screen bg-background pt-16 flex flex-col">
      {/* Render the Fixed Header Unconditionally */}
      <QuizFixedHeader
        selectedBankName={selectedBankName}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        language={language}
        isLoading={false} // Header itself is never in a loading state
      />

      {/* Centered container for the content below the header: Added flex-grow and mt-4 */}
      <div className="flex justify-center px-4 md:px-8 pb-4 md:pb-8 flex-grow mt-4"> {/* Added mt-4 */}
        <div className="w-full max-w-3xl">
          {/* Conditional Rendering for Content */}
          {isLoadingNextQuestion ? (
            <SkeletonQuizCard
                currentQuestionIndex={currentQuestionIndex}
                totalQuestions={totalQuestions}
                language={language}
            />
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-4 text-center h-full"> {/* Added h-full for vertical centering within flex-grow */}
              <Alert variant="destructive" className="max-w-md mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('quiz.errorOccurred')}</AlertTitle>
                <AlertDescription>
                  {error}
                  <br />
                  {t('quiz.errorLoadingOrSubmitting')}
                </AlertDescription>
              </Alert>
              <Button onClick={resetQuiz} variant="outline">
                {t('quiz.backToSettings')}
              </Button>
            </div>
          ) : !currentQuestion ? (
            <div className="flex flex-col items-center justify-center p-4 text-center h-full"> {/* Added h-full */}
              <Alert variant="destructive" className="max-w-md mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('quiz.noQuestionFound')}</AlertTitle>
                  <AlertDescription>
                      {t('quiz.couldNotFindQuestion')}
                  </AlertDescription>
              </Alert>
              <Button onClick={resetQuiz} variant="outline">
                {t('quiz.backToSettings')}
              </Button>
            </div>
          ) : (
            // Render ActualQuizCard directly, without the wrapper div with key/animation
            <ActualQuizCard
                quizCardRef={quizCardRef}
                currentQuestion={currentQuestion}
                currentQuestionIndex={currentQuestionIndex}
                totalQuestions={totalQuestions}
                language={language}
                handleBookmark={handleBookmark}
                isQuestionMarked={isQuestionMarked}
                isLoadingNextQuestion={isLoadingNextQuestion}
                options={currentQuestion.options}
                questionText={currentQuestion.text}
                explanationText={currentQuestion.explanation}
                selectedOptions={selectedOptions}
                handleOptionChange={handleOptionChange}
                isAnswerSubmitted={isAnswerSubmitted}
                isSubmitting={isSubmitting}
                getOptionStyle={getOptionStyle}
                showFeedback={showFeedback}
                isCorrect={isCorrect}
                handleSubmit={handleSubmit}
                handleNext={handleNext}
                handleAskAI={handleAskAI}
            />
          )}
        </div>
      </div>

      {/* AI Chat Popup (remains the same, rendered outside the conditional content block) */}
      {!isLoadingNextQuestion && currentQuestion && (
        <AiChatPopup
          isOpen={isAiChatOpen}
          onOpenChange={setIsAiChatOpen}
          question={currentQuestion} // Pass the full question object (which now includes presetMessages)
          language={language}
          sendChatMessage={(message) => sendChatMessage(currentQuestion.id, message)}
          // REMOVED fetchPresetMessages prop
        />
      )}
    </div>
  );
};

export default QuizPage;

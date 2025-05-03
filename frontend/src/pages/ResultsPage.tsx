import React, { useState, useEffect } from 'react';
import { useQuiz } from '@/context/QuizContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, AlertCircle } from 'lucide-react'; // Removed BookOpenCheck
import { cn } from '@/lib/utils';
import CircularScoreDisplay from '@/components/results/CircularScoreDisplay';
import AiFeedback from '@/components/results/AiFeedback';
import IncorrectQuestionsReview from '@/components/results/IncorrectQuestionsReview';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For error display
import { Separator } from '@/components/ui/separator'; // Import Separator

const ResultsPage = () => {
  // Get result, resetQuiz, language, and original questions list from context
  const { result, resetQuiz, language, questions, error, isLoading } = useQuiz();
  const [mainCardVisible, setMainCardVisible] = useState(false);
  const [scoreVisible, setScoreVisible] = useState(false);
  const [aiFeedbackVisible, setAiFeedbackVisible] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false); // Controls visibility of the entire review section

  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    // Animation effect remains the same
    let scoreTimer: NodeJS.Timeout, aiTimer: NodeJS.Timeout, reviewTimer: NodeJS.Timeout;
    const mainTimer = setTimeout(() => {
        setMainCardVisible(true);
        scoreTimer = setTimeout(() => setScoreVisible(true), 400);
        aiTimer = setTimeout(() => setAiFeedbackVisible(true), 600);
        // Delay review section visibility slightly more
        reviewTimer = setTimeout(() => setReviewVisible(true), 800);
    }, 50); // Keep a small delay for the animation start
    return () => {
      clearTimeout(mainTimer); clearTimeout(scoreTimer); clearTimeout(aiTimer); clearTimeout(reviewTimer);
    };
  }, []); // Keep this effect for animations

  // Handle loading state
   if (isLoading) {
       return (
           <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
               <p>Loading results...</p>
           </div>
       );
   }

  // Handle error state from context
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
        <Alert variant="destructive" className="max-w-md mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{language === 'ko' ? '오류 발생' : 'An Error Occurred'}</AlertTitle>
          <AlertDescription>
            {error}
            <br />
            {language === 'ko' ? '결과를 불러오는 중 문제가 발생했습니다.' : 'There was a problem loading the results.'}
          </AlertDescription>
        </Alert>
        <Button onClick={resetQuiz} variant="outline">
          {language === 'ko' ? '홈으로 돌아가기' : 'Back to Home'}
        </Button>
      </div>
    );
  }

  // Handle case where result is not yet available
  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
        <Alert variant="destructive" className="max-w-md mb-4">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>{language === 'ko' ? '결과 없음' : 'No Results Found'}</AlertTitle>
           <AlertDescription>
               {language === 'ko' ? '퀴즈 결과를 찾을 수 없습니다. 다시 시도해주세요.' : 'Could not find quiz results. Please try again.'}
           </AlertDescription>
        </Alert>
        <Button onClick={resetQuiz} variant="outline">
          {language === 'ko' ? '홈으로 돌아가기' : 'Back to Home'}
        </Button>
      </div>
    );
  }

  // Destructure data directly from the result object
  const { settings, score, summary, markedQuestions, incorrectQuestions, totalQuestions, correctCount } = result;

  // Ensure questions list is available for IncorrectQuestionsReview
   if (!questions || questions.length === 0) {
       console.warn("Original questions list is missing or empty on ResultsPage.");
   }

  const hasReviewItems = markedQuestions.length > 0 || incorrectQuestions.length > 0;

  return (
    // Use container for consistent padding and max-width
    <div className="min-h-screen container mx-auto py-8 px-4 flex flex-col items-center bg-background">
      {/* Card 1: Header, Score, AI Feedback */}
      <Card className={cn(
          "w-full max-w-4xl shadow-xl bg-card grid mb-8", // Add margin-bottom
          "transition-[grid-template-rows,opacity] duration-1000 ease-out",
          mainCardVisible ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
            <CardHeader className="text-center pt-8 pb-4">
                <CardTitle className="text-3xl font-bold mb-2 text-primary">
                    {language === 'ko' ? '퀴즈 결과' : 'Quiz Results'}
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    {language === 'ko' ? '축하합니다! 모든 문제를 완료했습니다.' : 'Congratulations! You have completed all questions.'}
                </CardDescription>
            </CardHeader>

            {mainCardVisible && (
                <CardContent className="px-6 md:px-10 pb-8 space-y-8">
                    <CircularScoreDisplay
                        score={score}
                        language={language}
                        isVisible={scoreVisible}
                        totalQuestions={totalQuestions}
                        correctCount={correctCount}
                    />
                    <AiFeedback
                        language={language}
                        summary={summary}
                        isVisible={aiFeedbackVisible}
                    />
                    {/* IncorrectQuestionsReview is moved outside this card */}
                </CardContent>
            )}
        </div>
      </Card>

      {/* Section: Incorrect/Marked Questions Review */}
      {hasReviewItems && (
          <div className={cn(
              "w-full max-w-4xl space-y-6", // Add spacing for cards
              "transition-opacity duration-500 ease-out delay-500", // Apply animation to the whole section
              reviewVisible ? "opacity-100" : "opacity-0"
          )}>
              {/* Removed the overall section title "오답 및 표시된 문제 검토" */}
              {/* <div className="flex items-center gap-3 mb-4">
                  <BookOpenCheck className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">
                      {language === 'ko' ? '오답 및 표시된 문제 검토' : 'Review Incorrect & Marked Questions'}
                  </h2>
              </div> */}
              <Separator className="mb-6" /> {/* Keep the separator */}
              <IncorrectQuestionsReview
                  language={language}
                  markedQuestions={markedQuestions}
                  incorrectQuestions={incorrectQuestions}
                  questions={questions || []}
                  isVisible={reviewVisible} // Pass visibility prop
              />
          </div>
      )}

      {/* Start New Quiz Button */}
      <div className={cn(
          "text-center mt-8 transition-opacity duration-500 ease-in delay-1000",
          mainCardVisible ? "opacity-100" : "opacity-0"
      )}>
        <Button onClick={resetQuiz} variant="default" size="lg">
          {language === 'ko' ? '새 퀴즈 시작하기' : 'Start New Quiz'}
        </Button>
      </div>
    </div>
  );
};

export default ResultsPage;

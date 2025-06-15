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
import { useTranslation } from '@/translations';

const ResultsPage = () => {
  // Get result, resetQuiz, language, and original questions list from context
  const { result, resetQuiz, language, questions, error, isLoading } = useQuiz();
  const { t } = useTranslation();
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
          <AlertTitle>{t('results.errorOccurred')}</AlertTitle>
          <AlertDescription>
            {error}
            <br />
            {t('results.errorLoadingResults')}
          </AlertDescription>
        </Alert>
        <Button onClick={resetQuiz} variant="outline">
          {t('results.backToHome')}
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
           <AlertTitle>{t('results.noResultsFound')}</AlertTitle>
           <AlertDescription>
               {t('results.couldNotFindResults')}
           </AlertDescription>
        </Alert>
        <Button onClick={resetQuiz} variant="outline">
          {t('results.backToHome')}
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
                    {t('results.title')}
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    {t('results.congratulations')}
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
                      {t('results.reviewIncorrectAndMarked')}
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
          {t('results.startNewQuiz')}
        </Button>
      </div>
    </div>
  );
};

export default ResultsPage;

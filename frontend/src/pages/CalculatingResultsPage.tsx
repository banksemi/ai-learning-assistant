import React, { useEffect } from 'react';
// Removed useNavigate import as navigation is now handled by context
// import { useNavigate } from 'react-router-dom';
import { useQuiz } from '@/context/QuizContext';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/translations';

const CalculatingResultsPage: React.FC = () => {
  // Removed useNavigate hook
  // const navigate = useNavigate();
  const { language } = useQuiz();
  const { t } = useTranslation();

  // Removed the useEffect hook that navigated after a timeout
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     navigate('/results');
  //   }, 1500);
  //   return () => clearTimeout(timer);
  // }, [navigate]);

  // This component now simply displays the loading state.
  // Navigation to '/results' will be triggered by the finishQuiz function in QuizContext
  // after the API call completes and the result state is set.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h1 className="text-xl font-semibold text-foreground mb-2">
        {t('results.generatingReport')}
      </h1>
      <p className="text-muted-foreground">
        {t('results.pleaseWait')}
      </p>
    </div>
  );
};

export default CalculatingResultsPage;

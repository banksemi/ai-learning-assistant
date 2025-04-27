import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '@/context/QuizContext';
import { Loader2 } from 'lucide-react';

const CalculatingResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useQuiz();

  useEffect(() => {
    // Simulate calculation time (e.g., 1.5 seconds)
    const timer = setTimeout(() => {
      navigate('/results');
    }, 1500); // Adjust delay as needed

    // Cleanup timer on component unmount
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h1 className="text-xl font-semibold text-foreground mb-2">
        {language === 'ko' ? '결과를 집계하고 있습니다...' : 'Calculating results...'}
      </h1>
      <p className="text-muted-foreground">
        {language === 'ko' ? '잠시만 기다려 주세요.' : 'Please wait a moment.'}
      </p>
    </div>
  );
};

export default CalculatingResultsPage;

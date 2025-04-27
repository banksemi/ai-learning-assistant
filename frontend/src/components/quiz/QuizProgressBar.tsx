import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Language } from '@/types';

interface QuizProgressBarProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  language: Language;
}

const QuizProgressBar: React.FC<QuizProgressBarProps> = ({ currentQuestionIndex, totalQuestions, language }) => {
  // Calculate progress based on the number of *completed* questions (index)
  const progressValue = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
  // Round the value for display text
  const progressText = Math.round(progressValue);

  return (
    <div className="w-full max-w-3xl mb-4">
      <div className="flex justify-between items-center mb-1 text-sm text-muted-foreground">
        {/* Display the rounded progress text */}
        <span>{language === 'ko' ? `${progressText}% 완료` : `${progressText}% Complete`}</span>
        {/* Optional: Add language selector or other info here */}
      </div>
      {/* Use the calculated progress value for the visual bar */}
      <Progress value={progressValue} className="w-full h-2 [&>div]:bg-primary" />
    </div>
  );
};

export default QuizProgressBar;

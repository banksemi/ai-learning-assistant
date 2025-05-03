import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Language } from '@/types'; // Keep Language import if needed later

interface QuizProgressBarProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  language: Language; // Keep language prop in case it's needed later
}

const QuizProgressBar: React.FC<QuizProgressBarProps> = ({ currentQuestionIndex, totalQuestions }) => {
  // Calculate progress based on the number of *completed* questions (index)
  const progressValue = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;

  return (
    // Removed outer div with mb-1 and text display
    <div className="w-full">
      {/* Use the calculated progress value for the visual bar */}
      {/* Changed h-2 to h-2.5 */}
      <Progress value={progressValue} className="w-full h-2.5 [&>div]:bg-primary" />
    </div>
  );
};

export default QuizProgressBar;

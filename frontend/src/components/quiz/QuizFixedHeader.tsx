import React from 'react';
import QuizProgressBar from '@/components/quiz/QuizProgressBar';
import { Language } from '@/types';
// Removed Skeleton import as it's no longer used here
// import { Skeleton } from '@/components/ui/skeleton';

interface QuizFixedHeaderProps {
  selectedBankName: string | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  language: Language;
  isLoading: boolean; // Keep isLoading prop, might be used for other elements later if needed
}

const QuizFixedHeader: React.FC<QuizFixedHeaderProps> = ({
  selectedBankName,
  currentQuestionIndex,
  totalQuestions,
  language,
  // isLoading prop is received but not used for bank name skeleton anymore
}) => {
  return (
    // Outer div: Change sticky to fixed, ensure full width, top-0, z-index
    <div
      className="fixed top-0 left-0 right-0 z-10 w-full bg-secondary p-2 border-b border-[hsl(var(--header-border))]" // Changed sticky to fixed, added left-0 right-0
    >
      {/* Inner div: Constrains content width to match card (max-w-3xl) and centers it */}
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-1.5">
        {/* Bank Name - Now inside the constrained width div */}
        {/* Change text-base back to text-sm */}
        <span
          className="text-sm truncate w-full text-center text-secondary-foreground font-medium" // Changed text-base to text-sm
          title={selectedBankName ?? ''}
        >
          {selectedBankName || (language === 'ko' ? '문제 은행' : 'Question Bank')} {/* Fallback text */}
        </span>
        {/* Progress Bar Container - Now inside the constrained width div */}
        <div className="w-full mb-1"> {/* Keep mb-1 */}
          <QuizProgressBar
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={totalQuestions}
            language={language} // Pass language if needed internally by progress bar (it isn't currently)
          />
        </div>
      </div>
    </div>
  );
};

export default QuizFixedHeader;

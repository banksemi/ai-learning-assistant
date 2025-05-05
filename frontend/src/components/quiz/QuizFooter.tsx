import React from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from '@/components/ui/separator';
import { MessageSquare, ArrowRight, Loader2 } from 'lucide-react'; // Import Loader2
import { Language } from '@/types';

interface QuizFooterProps {
  language: Language;
  isAnswerSubmitted: boolean;
  isSubmitting: boolean; // Add isSubmitting prop
  selectedOptions: string[];
  currentQuestionIndex: number;
  totalQuestions: number;
  onSubmit: () => void;
  onNext: () => void;
  onAskAI: () => void;
}

const QuizFooter: React.FC<QuizFooterProps> = ({
  language,
  isAnswerSubmitted,
  isSubmitting, // Use isSubmitting prop
  selectedOptions,
  currentQuestionIndex,
  totalQuestions,
  onSubmit,
  onNext,
  onAskAI,
}) => {
  return (
    <>
      <Separator />
      <div className="w-full px-4 py-4 md:px-6 md:py-4 flex flex-col-reverse md:flex-row items-center justify-between gap-3 md:gap-4">
        {/* Ask AI Button - Conditionally render based on isAnswerSubmitted */}
        <div className="w-full md:w-auto"> {/* Wrapper to maintain layout */}
          {isAnswerSubmitted && (
            <Button
              onClick={onAskAI}
              variant="ghost"
              size="sm"
              className="w-full md:w-auto justify-center md:justify-start text-primary hover:text-primary/80 hover:bg-primary/10 animate-fade-in" // Added fade-in
              disabled={isSubmitting} // Disable Ask AI during submission (though unlikely to be visible)
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {language === 'ko' ? 'AI에게 물어보기' : 'Ask AI'}
            </Button>
          )}
          {/* Placeholder for layout consistency when button is hidden */}
          {!isAnswerSubmitted && <div className="h-9"></div>}
        </div>


        {/* Submit/Next Button */}
        {!isAnswerSubmitted ? (
          <Button
            onClick={onSubmit}
            // Disable if no option selected OR if currently submitting
            disabled={selectedOptions.length === 0 || isSubmitting}
            size="lg"
            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {/* Show loader when submitting */}
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {language === 'ko' ? '제출' : 'Submit'}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            size="lg"
            className="w-full md:w-auto animate-fade-in bg-primary hover:bg-primary/90 text-primary-foreground"
            // Disable Next button if the previous action (submit) is still processing, although unlikely
            disabled={isSubmitting}
          >
            {currentQuestionIndex < totalQuestions - 1
              ? (language === 'ko' ? '다음 문제' : 'Next Question')
              : (language === 'ko' ? '결과 보기' : 'Show Results')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </>
  );
};

export default QuizFooter;

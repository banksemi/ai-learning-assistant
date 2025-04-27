import React from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from '@/components/ui/separator';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { Language } from '@/types';

interface QuizFooterProps {
  language: Language;
  isAnswerSubmitted: boolean;
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
      {/*
        Added w-full to this container div to ensure it spans the CardFooter width,
        allowing justify-between to work effectively on desktop.
      */}
      <div className="w-full px-4 py-4 md:px-6 md:py-4 flex flex-col-reverse md:flex-row items-center justify-between gap-3 md:gap-4">
        {/* Ask AI Button: w-full on mobile, w-auto on desktop, centered text on mobile, left-aligned text on desktop */}
        <Button onClick={onAskAI} variant="ghost" size="sm" className="w-full md:w-auto justify-center md:justify-start text-primary hover:text-primary/80 hover:bg-primary/10">
          <MessageSquare className="mr-2 h-4 w-4" />
          {language === 'ko' ? 'AI에게 물어보기' : 'Ask AI'}
        </Button>

        {/* Submit/Next Button: w-full on mobile, w-auto on desktop */}
        {!isAnswerSubmitted ? (
          <Button onClick={onSubmit} disabled={selectedOptions.length === 0} size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            {language === 'ko' ? '제출' : 'Submit'}
          </Button>
        ) : (
          <Button onClick={onNext} size="lg" className="w-full md:w-auto animate-fade-in bg-primary hover:bg-primary/90 text-primary-foreground">
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

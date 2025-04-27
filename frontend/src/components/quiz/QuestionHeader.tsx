import React from 'react';
import { Button } from "@/components/ui/button";
import { Bookmark } from 'lucide-react';
import { Language } from '@/types';
import { cn } from '@/lib/utils'; // Import cn

interface QuestionHeaderProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  language: Language;
  onBookmark: () => void;
  isMarked: boolean; // Add prop to indicate if the question is marked
}

const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  currentQuestionIndex,
  totalQuestions,
  language,
  onBookmark,
  isMarked, // Use the isMarked prop
}) => {
  return (
    <div className="flex justify-between items-center mb-3">
      <h2 className="text-lg font-semibold text-foreground">
        {language === 'ko' ? `문제 ${currentQuestionIndex + 1} / ${totalQuestions}` : `Question ${currentQuestionIndex + 1} of ${totalQuestions}`}
      </h2>
      <Button
        onClick={onBookmark}
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 [&_svg]:h-6 [&_svg]:w-6", // Base styles
          isMarked
            ? "text-primary hover:text-primary/90" // Style when marked
            : "text-muted-foreground hover:text-primary" // Style when not marked
        )}
      >
        {/* Conditionally render filled or outline icon */}
        <Bookmark
          className={cn(
            isMarked ? "fill-primary" : "" // Apply fill only when marked
          )}
        />
        <span className="sr-only">{isMarked ? (language === 'ko' ? '표시 해제' : 'Unmark') : (language === 'ko' ? '표시하기' : 'Mark')}</span>
      </Button>
    </div>
  );
};

export default QuestionHeader;

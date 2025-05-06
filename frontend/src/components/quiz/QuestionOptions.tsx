import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { cn } from '@/lib/utils';
import { Question, QuestionOption } from '@/types';

interface QuestionOptionsProps {
  question: Question;
  options: QuestionOption[];
  selectedOptions: string[];
  onOptionChange: (optionId: string) => void;
  isAnswerSubmitted: boolean;
  isSubmitting: boolean;
  getOptionStyle: (optionId: string) => string;
}

const QuestionOptions: React.FC<QuestionOptionsProps> = ({
  question,
  options,
  selectedOptions,
  onOptionChange,
  isAnswerSubmitted,
  isSubmitting,
  getOptionStyle,
}) => {
  const isDisabled = isAnswerSubmitted || isSubmitting;

  return (
    <>
      {question.type === 'single' ? (
        <RadioGroup
          value={selectedOptions[0] || ''}
          onValueChange={onOptionChange}
          disabled={isDisabled}
          className="space-y-2 md:space-y-1"
        >
          {options.map((option) => (
            <div
              key={option.id}
              className={cn('quiz-option p-4', getOptionStyle(option.id))}
              onClick={() => !isDisabled && onOptionChange(option.id)}
            >
              <RadioGroupItem value={option.id} id={option.id} className="mt-1 border-muted-foreground data-[state=checked]:border-primary" />
              {/* Label still needs overflow control */}
              <Label htmlFor={option.id} className='quiz-option-label min-w-0 overflow-hidden w-full'>
                {/* Apply w-full to MarkdownRenderer to ensure it respects the Label's width */}
                <MarkdownRenderer content={option.text} className="prose-p:m-0 w-full" />
              </Label>
            </div>
          ))}
        </RadioGroup>
      ) : (
        <div className="space-y-2 md:space-y-1">
          {options.map((option) => (
            <div
              key={option.id}
              className={cn(
                'quiz-option p-4 select-none',
                getOptionStyle(option.id)
              )}
              onClick={() => !isDisabled && onOptionChange(option.id)}
            >
              <Checkbox
                id={option.id}
                checked={selectedOptions.includes(option.id)}
                disabled={isDisabled}
                className="mt-1 border-muted-foreground data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                style={{ pointerEvents: 'none' }}
              />
              {/* Label still needs overflow control */}
              <Label
                htmlFor={option.id}
                className='quiz-option-label min-w-0 overflow-hidden w-full'
                onClick={(e) => e.preventDefault()}
              >
                {/* Apply w-full to MarkdownRenderer */}
                <MarkdownRenderer content={option.text} className="prose-p:m-0 w-full" />
              </Label>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default QuestionOptions;

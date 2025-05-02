import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Question, QuestionOption } from '@/types';

interface QuestionOptionsProps {
  question: Question;
  options: QuestionOption[];
  selectedOptions: string[];
  onOptionChange: (optionId: string) => void;
  isAnswerSubmitted: boolean;
  isSubmitting: boolean; // Add isSubmitting prop
  getOptionStyle: (optionId: string) => string;
}

const QuestionOptions: React.FC<QuestionOptionsProps> = ({
  question,
  options,
  selectedOptions,
  onOptionChange,
  isAnswerSubmitted,
  isSubmitting, // Use isSubmitting prop
  getOptionStyle,
}) => {
  const isDisabled = isAnswerSubmitted || isSubmitting; // Combine disabled states

  return (
    <>
      {question.type === 'single' ? (
        <RadioGroup
          value={selectedOptions[0] || ''}
          onValueChange={onOptionChange}
          disabled={isDisabled} // Use combined disabled state
          // Further reduced spacing to space-y-2 md:space-y-1
          className="space-y-2 md:space-y-1"
        >
          {options.map((option) => (
            <div
              key={option.id}
              className={cn('quiz-option p-4', getOptionStyle(option.id))}
              // Prevent click if disabled
              onClick={() => !isDisabled && onOptionChange(option.id)}
            >
              <RadioGroupItem value={option.id} id={option.id} className="mt-1 border-muted-foreground data-[state=checked]:border-primary" />
              <Label htmlFor={option.id} className='quiz-option-label'>
                <ReactMarkdown children={option.text} remarkPlugins={[remarkGfm]} className="prose dark:prose-invert max-w-none" />
              </Label>
            </div>
          ))}
        </RadioGroup>
      ) : (
        // Further reduced spacing to space-y-2 md:space-y-1
        <div className="space-y-2 md:space-y-1">
          {options.map((option) => (
            <div
              key={option.id}
              className={cn('quiz-option p-4', getOptionStyle(option.id))}
               // Prevent click if disabled
              onClick={() => !isDisabled && onOptionChange(option.id)}
            >
              <Checkbox
                id={option.id}
                checked={selectedOptions.includes(option.id)}
                onCheckedChange={() => onOptionChange(option.id)}
                disabled={isDisabled} // Use combined disabled state
                className="mt-1 border-muted-foreground data-[state=checked]:border-primary data-[state=checked]:bg-primary"
              />
              <Label htmlFor={option.id} className='quiz-option-label'>
                <ReactMarkdown children={option.text} remarkPlugins={[remarkGfm]} className="prose dark:prose-invert max-w-none" />
              </Label>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default QuestionOptions;

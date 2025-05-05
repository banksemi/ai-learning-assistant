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
        // Multiple choice options
        // Further reduced spacing to space-y-2 md:space-y-1
        <div className="space-y-2 md:space-y-1">
          {options.map((option) => (
            <div
              key={option.id}
              className={cn(
                'quiz-option p-4 select-none', // Keep select-none
                getOptionStyle(option.id)
              )}
              // ADD BACK onClick to the div to handle area clicks
              onClick={() => !isDisabled && onOptionChange(option.id)}
            >
              <Checkbox
                id={option.id} // Keep id for Label association
                checked={selectedOptions.includes(option.id)}
                // REMOVE onCheckedChange from Checkbox itself
                // The div's onClick now handles the logic
                disabled={isDisabled} // Use combined disabled state
                className="mt-1 border-muted-foreground data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                // Add pointer-events-none to prevent the checkbox from interfering with the div's onClick
                style={{ pointerEvents: 'none' }}
              />
              <Label
                htmlFor={option.id} // Keep htmlFor for accessibility and label clicks
                className='quiz-option-label'
                // Prevent label click from triggering default browser behavior (like focusing the checkbox)
                // as the div's onClick handles the action.
                onClick={(e) => e.preventDefault()}
              >
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

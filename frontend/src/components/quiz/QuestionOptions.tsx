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
  getOptionStyle: (optionId: string) => string;
}

const QuestionOptions: React.FC<QuestionOptionsProps> = ({
  question,
  options,
  selectedOptions,
  onOptionChange,
  isAnswerSubmitted,
  getOptionStyle,
}) => {
  return (
    <>
      {question.type === 'single' ? (
        // Increased spacing between radio options on mobile (space-y-4)
        <RadioGroup
          value={selectedOptions[0] || ''}
          onValueChange={onOptionChange}
          disabled={isAnswerSubmitted}
          className="space-y-4 md:space-y-3"
        >
          {options.map((option) => (
            <div
              key={option.id}
              // Increased padding within each option on mobile (p-4)
              className={cn('quiz-option p-4', getOptionStyle(option.id))}
              onClick={() => !isAnswerSubmitted && onOptionChange(option.id)}
            >
              <RadioGroupItem value={option.id} id={option.id} className="mt-1 border-muted-foreground data-[state=checked]:border-primary" />
              <Label htmlFor={option.id} className='quiz-option-label'>
                <ReactMarkdown children={option.text} remarkPlugins={[remarkGfm]} className="prose dark:prose-invert max-w-none" />
              </Label>
            </div>
          ))}
        </RadioGroup>
      ) : (
         // Increased spacing between checkbox options on mobile (space-y-4)
        <div className="space-y-4 md:space-y-3">
          {options.map((option) => (
            <div
              key={option.id}
               // Increased padding within each option on mobile (p-4)
              className={cn('quiz-option p-4', getOptionStyle(option.id))}
              onClick={() => !isAnswerSubmitted && onOptionChange(option.id)}
            >
              <Checkbox
                id={option.id}
                checked={selectedOptions.includes(option.id)}
                onCheckedChange={() => onOptionChange(option.id)} // Checkbox uses onCheckedChange
                disabled={isAnswerSubmitted}
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

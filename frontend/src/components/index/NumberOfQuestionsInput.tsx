import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Language } from '@/types';

interface NumberOfQuestionsInputProps {
  numQuestions: number;
  onNumQuestionsChange: (value: number) => void;
  language: Language;
  maxQuestions: number; // Add maxQuestions prop
}

const NumberOfQuestionsInput: React.FC<NumberOfQuestionsInputProps> = ({
    numQuestions,
    onNumQuestionsChange,
    language,
    maxQuestions
}) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    // Allow input only if it's a positive number and not exceeding maxQuestions
    if (!isNaN(value) && value > 0 && value <= maxQuestions) {
      onNumQuestionsChange(value);
    } else if (e.target.value === '') {
       onNumQuestionsChange(0); // Allow clearing, validation happens on submit
    } else if (!isNaN(value) && value > maxQuestions) {
        // If user types a number greater than max, set it to max
        onNumQuestionsChange(maxQuestions);
    } else if (!isNaN(value) && value <= 0) {
        // If user types 0 or negative, set it to 1 (or handle as invalid)
        onNumQuestionsChange(1);
    }
  };

  const placeholderText = language === 'ko' ? '숫자 입력 (예: 10)' : 'Enter number (e.g., 10)';
  const labelText = language === 'ko' ? '문제 수' : 'Number of Questions';
  // Helper text showing the maximum allowed questions
  const maxQuestionsText = language === 'ko' ? `(최대: ${maxQuestions}개)` : `(Max: ${maxQuestions})`;

  return (
    <div className="space-y-2 w-full">
       <Label htmlFor="num-questions" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between items-center">
         <span>{labelText}</span>
         {/* Display max count */}
         {maxQuestions > 0 && <span className="text-xs text-muted-foreground">{maxQuestionsText}</span>}
       </Label>
      <Input
        id="num-questions"
        type="number"
        min="1"
        max={maxQuestions} // Set the max attribute
        value={numQuestions > 0 ? numQuestions : ''} // Display empty string if numQuestions is 0 or less
        onChange={handleInputChange}
        placeholder={placeholderText}
        required
        className="w-full"
        // Disable input if maxQuestions is 0 or less (e.g., no bank selected or bank has no questions)
        disabled={maxQuestions <= 0}
      />
       {/* Optional: Add a small helper text below input as well */}
       {/* <p className="text-xs text-muted-foreground mt-1">{maxQuestionsText}</p> */}
    </div>
  );
};

export default NumberOfQuestionsInput;

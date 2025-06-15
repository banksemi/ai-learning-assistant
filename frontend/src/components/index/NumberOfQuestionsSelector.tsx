import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Language } from '@/types';
import { useTranslation } from '@/translations';

interface NumberOfQuestionsSelectorProps {
  numQuestions: number;
  onNumQuestionsChange: (value: number) => void;
  language: Language;
  maxQuestions: number;
}

const NumberOfQuestionsSelector: React.FC<NumberOfQuestionsSelectorProps> = ({
    numQuestions,
    onNumQuestionsChange,
    language,
    maxQuestions
}) => {
  const { t } = useTranslation();
  // Add 1 to the base options
  const baseOptions = [1, 5, 10, 20, 30, 65];

  // Filter base options based on maxQuestions
  const availableOptions = baseOptions.filter(option => option <= maxQuestions);

  // Add "All" option if maxQuestions is greater than 0
  const allOptionValue = maxQuestions;
  const showAllOption = maxQuestions > 0;

  // Determine the final list of options for the dropdown
  const finalOptions: { value: number; label: string }[] = availableOptions.map(option => ({
    value: option,
    label: `${option} ${t('home.questions')}`
  }));

  if (showAllOption) {
    // Add "All" option, ensuring its value doesn't duplicate an existing option number
    if (!availableOptions.includes(allOptionValue)) {
        finalOptions.push({
            value: allOptionValue,
            label: `${t('home.all')} (${allOptionValue} ${t('home.questions')})`
        });
    } else {
         // If maxQuestions happens to be one of the base options, update that option's label
         const existingOptionIndex = finalOptions.findIndex(opt => opt.value === allOptionValue);
         if (existingOptionIndex > -1) {
             finalOptions[existingOptionIndex].label = `${t('home.all')} (${allOptionValue} ${t('home.questions')})`;
         }
    }
  }

  // Handle edge case where maxQuestions is less than the smallest base option (now 1)
  // If maxQuestions is 0, no options should be shown (except the disabled one)
  if (availableOptions.length === 0 && showAllOption && maxQuestions > 0) {
      finalOptions.length = 0; // Clear any potentially added base options
      finalOptions.push({
          value: allOptionValue,
          label: `${t('home.all')} (${allOptionValue} ${t('home.questions')})`
      });
  }


  const handleValueChange = (value: string) => {
    onNumQuestionsChange(Number(value));
  };

  const labelText = t('home.selectNumberOfQuestions');
  const placeholderText = t('home.selectNumberOfQuestionsPlaceholder');

  return (
    <div className="space-y-2 w-full">
      <Label htmlFor="num-questions-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {labelText}
      </Label>
      <Select
        // Ensure the value is correctly set even if it's 1
        value={String(numQuestions)} // Value must be a string for Select
        onValueChange={handleValueChange}
        required
        disabled={maxQuestions <= 0 || finalOptions.length === 0} // Disable if no questions or options
      >
        <SelectTrigger id="num-questions-select" className="w-full">
          <SelectValue placeholder={placeholderText} />
        </SelectTrigger>
        <SelectContent>
          {finalOptions.length > 0 ? (
            finalOptions.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))
          ) : (
            // Show a disabled item if no options are valid (e.g., maxQuestions is 0)
            <SelectItem value="no-options" disabled>
              {t('home.noOptionsAvailable')}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default NumberOfQuestionsSelector;

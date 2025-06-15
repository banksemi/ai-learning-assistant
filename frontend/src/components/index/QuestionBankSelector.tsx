import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Language, QuestionBank as FrontendQuestionBank } from '@/types'; // Use updated QuestionBank type
import { useTranslation } from '@/translations';

interface QuestionBankSelectorProps {
  banks: FrontendQuestionBank[]; // Expect banks with 'questions' count
  selectedBank: string;
  onBankChange: (value: string) => void;
  language: Language;
}

const QuestionBankSelector: React.FC<QuestionBankSelectorProps> = ({ banks, selectedBank, onBankChange, language }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 w-full">
      <Label htmlFor="question-bank" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('home.selectQuestionBank')}
      </Label>
      <Select
        value={selectedBank}
        onValueChange={onBankChange}
        required
        disabled={banks.length === 0}
      >
        <SelectTrigger id="question-bank" className="w-full">
          <SelectValue placeholder={t('home.selectQuestionBankPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {banks.map((bank) => (
            <SelectItem key={bank.id} value={String(bank.id)}>
              {/* Display bank name and question count */}
              {bank.name} ({bank.questions} {t('home.questions')})
            </SelectItem>
          ))}
          {banks.length === 0 && (
            <SelectItem value="loading" disabled>
              {t('home.loadingQuestionBanks')}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default QuestionBankSelector;

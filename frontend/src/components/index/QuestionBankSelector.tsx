import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Language, QuestionBank as FrontendQuestionBank } from '@/types'; // Use updated QuestionBank type

interface QuestionBankSelectorProps {
  banks: FrontendQuestionBank[]; // Expect banks with 'questions' count
  selectedBank: string;
  onBankChange: (value: string) => void;
  language: Language;
}

const QuestionBankSelector: React.FC<QuestionBankSelectorProps> = ({ banks, selectedBank, onBankChange, language }) => {
  return (
    <div className="space-y-2 w-full">
      <Label htmlFor="question-bank" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {language === 'ko' ? '문제 은행 선택' : 'Select Question Bank'}
      </Label>
      <Select
        value={selectedBank}
        onValueChange={onBankChange}
        required
        disabled={banks.length === 0}
      >
        <SelectTrigger id="question-bank" className="w-full">
          <SelectValue placeholder={language === 'ko' ? "문제 은행 선택..." : "Select Question Bank..."} />
        </SelectTrigger>
        <SelectContent>
          {banks.map((bank) => (
            <SelectItem key={bank.id} value={String(bank.id)}>
              {/* Display bank name and question count */}
              {bank.name} ({language === 'ko' ? `${bank.questions} 문제` : `${bank.questions} questions`})
            </SelectItem>
          ))}
          {banks.length === 0 && (
            <SelectItem value="loading" disabled>
              {language === 'ko' ? '문제 은행 로딩 중...' : 'Loading question banks...'}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default QuestionBankSelector;

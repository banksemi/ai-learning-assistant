import React from 'react';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Language } from '@/types';

interface LanguageSelectorProps {
  language: Language;
  onLanguageChange: (value: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ language, onLanguageChange }) => {
  return (
    // Reverted wrapper styling
    <div className="space-y-2">
      {/* Reverted Label styling */}
      <Label htmlFor="language">언어 / Language</Label>
      {/* Reverted RadioGroup styling */}
      <RadioGroup
        defaultValue={language}
        onValueChange={(value) => onLanguageChange(value as Language)}
        className="flex space-x-4"
        id="language"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="ko" id="lang-ko" />
          {/* Reverted Label styling */}
          <Label htmlFor="lang-ko" className="font-normal">한국어</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="en" id="lang-en" />
          {/* Reverted Label styling */}
          <Label htmlFor="lang-en" className="font-normal">English</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default LanguageSelector;

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';
import { Language } from '@/types';

interface LanguageDropdownProps {
  language: Language;
  onLanguageChange: (value: Language) => void;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ language, onLanguageChange }) => {
  const getDisplayLanguage = () => {
    switch (language) {
      case 'ko': return '한국어';
      case 'ja': return '日本語';
      case 'zh': return '中文';
      default: return 'English';
    }
  };

  const displayLanguage = getDisplayLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1.5">
          <Globe className="h-4 w-4" />
          {displayLanguage}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end">
        <DropdownMenuLabel>언어 / Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={language} onValueChange={(value) => onLanguageChange(value as Language)}>
          <DropdownMenuRadioItem value="ko">한국어</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ja">日本語</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="zh">中文</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageDropdown;

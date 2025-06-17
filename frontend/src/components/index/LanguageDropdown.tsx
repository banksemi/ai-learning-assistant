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
import { useTranslation } from '@/translations';

interface LanguageDropdownProps {
  language: Language;
  onLanguageChange: (value: Language) => void;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ language, onLanguageChange }) => {
  const { t } = useTranslation();

  const getDisplayLanguage = () => {
    return t(`common.languageNames.${language}`);
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
        <DropdownMenuLabel>{t('common.language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={language} onValueChange={(value) => onLanguageChange(value as Language)}>
          <DropdownMenuRadioItem value="ko">{t('common.languageNames.ko')}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">{t('common.languageNames.en')}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ja">{t('common.languageNames.ja')}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="zh">{t('common.languageNames.zh')}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageDropdown;

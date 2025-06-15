import React from 'react';
import { cn } from '@/lib/utils';
import { Language } from '@/types';
import { Separator } from '@/components/ui/separator';
import MarkdownRenderer from '@/components/MarkdownRenderer'; // 공통 MarkdownRenderer 사용
import { useTranslation } from '@/translations';

interface AiFeedbackProps {
  language: Language;
  summary: string;
  isVisible: boolean;
}

const AiFeedback: React.FC<AiFeedbackProps> = ({ language, summary, isVisible }) => {
  const { t } = useTranslation();
  return (
    <div className={cn(
        "space-y-2",
        "transition-all duration-500 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
        <h2 className="text-xl font-semibold">{t('results.aiFeedback')}</h2>
        <Separator />
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900">
            <div className="text-sm text-blue-800 dark:text-blue-200 w-full">
                <p className="font-medium mb-2">{t('results.examAnalysis')}</p>
                {/* MarkdownRenderer 사용 */}
                <MarkdownRenderer content={summary || t('results.loadingAiSummary')} className="prose-sm" />
            </div>
        </div>
    </div>
  );
};

export default AiFeedback;

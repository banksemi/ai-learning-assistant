import React from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer'; // 공통 MarkdownRenderer 사용
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Language } from '@/types';

interface FeedbackSectionProps {
  showFeedback: boolean;
  isCorrect: boolean | null;
  explanationText: string;
  language: Language;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ showFeedback, isCorrect, explanationText, language }) => {
  if (!showFeedback) return null;

  return (
    <div className={cn(
      'feedback-alert animate-fade-in mt-4',
      isCorrect ? 'feedback-alert-correct' : 'feedback-alert-incorrect'
    )}>
      <div className="feedback-alert-title">
        {isCorrect ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
        <span>{isCorrect ? (language === 'ko' ? '정답입니다!' : 'Correct!') : (language === 'ko' ? '오답입니다' : 'Incorrect')}</span>
      </div>
      <div className="feedback-alert-description">
        {/* MarkdownRenderer 사용 */}
        <MarkdownRenderer content={explanationText} />
      </div>
    </div>
  );
};

export default FeedbackSection;

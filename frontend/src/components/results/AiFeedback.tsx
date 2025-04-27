import React from 'react';
import { cn } from '@/lib/utils';
import { Language } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm

interface AiFeedbackProps {
  language: Language;
  summary: string; // Add summary prop
  isVisible: boolean;
}

const AiFeedback: React.FC<AiFeedbackProps> = ({ language, summary, isVisible }) => {
  return (
    <div className={cn(
        "space-y-2",
        "transition-all duration-500 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
        <h2 className="text-xl font-semibold">{language === 'ko' ? 'AI 피드백' : 'AI Feedback'}</h2>
        <Separator />
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900">
            <div className="flex items-start space-x-3">
                <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div className="text-sm text-blue-800 dark:text-blue-200 w-full"> {/* Ensure div takes full width */}
                    <p className="font-medium mb-2">{language === 'ko' ? '시험 결과 분석 및 조언' : 'Exam Result Analysis and Advice'}</p>
                    {/* Use ReactMarkdown to render the summary */}
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown children={summary || (language === 'ko' ? 'AI 요약을 불러오는 중...' : 'Loading AI summary...')} remarkPlugins={[remarkGfm]} />
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AiFeedback;

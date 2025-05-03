import React, { useState } from 'react'; // Import useState
import { cn } from '@/lib/utils';
import { Language, Question } from '@/types';
// Import Collapsible components
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Import ChevronDown for indicator
import { CheckCircle, Bookmark, XCircle, ChevronDown } from 'lucide-react'; // Keep XCircle
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '@/components/CodeBlock';

interface IncorrectQuestionsReviewProps {
  language: Language;
  markedQuestions: Question[];
  incorrectQuestions: Question[];
  questions: Question[];
  isVisible: boolean;
}

// Renamed from QuestionAccordionItem to QuestionReviewCard
const QuestionReviewCard: React.FC<{
    question: Question;
    originalIndex: number;
    language: Language;
    itemType: 'marked' | 'incorrect';
}> = ({
    question, originalIndex, language, itemType
}) => {
    const [isOpen, setIsOpen] = useState(false); // State to track open/closed
    const selectedOptionIds = question.userSelectedIds || [];
    const isUserAnswerCorrect = itemType === 'marked'
        ? JSON.stringify([...question.correctAnswerIds].sort()) === JSON.stringify([...selectedOptionIds].sort())
        : false;
    const currentLangOptions = question.options;

    return (
        // Wrap the Card with Collapsible
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card
                key={`${question.id}-${itemType}`}
                // Re-apply custom background classes, remove inline style
                className={cn(
                    "transition-colors mb-4 border shadow-md", // Base styles
                    itemType === 'marked' && "border-blue-200/50 dark:border-blue-800/50 bg-card-marked-bg dark:bg-card-marked-bg-dark", // Custom light blue bg
                    itemType === 'incorrect' && "border-red-200/50 dark:border-red-800/50 bg-card-incorrect-bg dark:bg-card-incorrect-bg-dark" // Custom light red bg
                )}
            >
                {/* CardHeader acts as the trigger */}
                <CollapsibleTrigger asChild>
                    <CardHeader className="p-4 pb-2 cursor-pointer hover:bg-accent/30 dark:hover:bg-accent/10 rounded-t-lg transition-colors">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-1 pr-2">
                                <CardTitle className="text-base font-semibold flex items-center">
                                    <span className="text-foreground">
                                        {language === 'ko' ? `질문 ${originalIndex + 1}` : `Question ${originalIndex + 1}`}
                                    </span>
                                    {/* Removed Bookmark icon for marked questions */}
                                    {/* {itemType === 'marked' && <Bookmark className="h-4 w-4 text-primary ml-2 flex-shrink-0" />} */}
                                </CardTitle>
                                {/* Remove text-sm to inherit 0.95rem from global prose style */}
                                <div className="prose dark:prose-invert max-w-none pt-1 text-left"> {/* Removed text-sm */}
                                    <ReactMarkdown
                                        children={question.text}
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ node, inline, className, children, ...props }) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return !inline ? (
                                                    <CodeBlock language={match ? match[1] : undefined} value={String(children).replace(/\n$/, '')} {...props} />
                                                ) : (
                                                    <code className={className} {...props}>{children}</code>
                                                );
                                            },
                                            // Prevent p tags from adding extra margin in the header
                                            p: ({children}) => <span className="inline">{children}</span>
                                        }}
                                    />
                                </div>
                            </div>
                            {/* Chevron indicator */}
                            <ChevronDown
                                className={cn(
                                    "h-5 w-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 mt-1",
                                    isOpen && "rotate-180"
                                )}
                            />
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>
                {/* CardContent is wrapped in CollapsibleContent */}
                <CollapsibleContent>
                    <CardContent className="p-4 pt-2 space-y-4">
                        <hr className="border-border/60 border-dashed my-3" />

                        {/* User's Answer Section */}
                        {selectedOptionIds.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm flex items-center gap-1 text-foreground">
                                    {language === 'ko' ? '선택한 답:' : 'Your Answer:'}
                                    {isUserAnswerCorrect ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-600" />
                                    )}
                                </h4>
                                {currentLangOptions
                                    .filter(opt => selectedOptionIds.includes(opt.id))
                                    .map(selectedOpt => {
                                        const isThisOptionCorrect = question.correctAnswerIds.includes(selectedOpt.id);
                                        const selectedOptionDivClass = cn(
                                            "p-3 border rounded-lg text-sm", // Slightly reduced padding
                                            isUserAnswerCorrect
                                                ? "bg-green-100/70 dark:bg-green-900/50 border-green-200 dark:border-green-700/50"
                                                : isThisOptionCorrect
                                                    ? "bg-green-100/70 dark:bg-green-900/50 border-green-200 dark:border-green-700/50"
                                                    : "bg-red-100/70 dark:bg-red-900/50 border-red-200 dark:border-red-700/50"
                                        );
                                        return (
                                            <div key={selectedOpt.id} className={selectedOptionDivClass}>
                                                <ReactMarkdown children={selectedOpt.text} remarkPlugins={[remarkGfm]} className="prose dark:prose-invert max-w-none" />
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                        {selectedOptionIds.length === 0 && itemType === 'incorrect' && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-red-600">{language === 'ko' ? '선택한 답:' : 'Your Answer:'}</h4>
                                <p className="text-sm text-muted-foreground italic">{language === 'ko' ? '답변하지 않음' : 'Not answered'}</p>
                            </div>
                        )}

                        {/* Correct Answer Section */}
                        {(itemType === 'incorrect' || (itemType === 'marked' && !isUserAnswerCorrect)) && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm flex items-center gap-1 text-foreground">
                                    {language === 'ko' ? '정답:' : 'Correct Answer(s):'}
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                </h4>
                                {currentLangOptions
                                    .filter(opt => question.correctAnswerIds.includes(opt.id))
                                    .map(correctOpt => (
                                        <div key={correctOpt.id} className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/60 border-green-200 dark:border-green-700 text-sm"> {/* Slightly reduced padding */}
                                            <ReactMarkdown children={correctOpt.text} remarkPlugins={[remarkGfm]} className="prose dark:prose-invert max-w-none" />
                                        </div>
                                    ))}
                            </div>
                        )}

                        {/* Explanation Section */}
                        <div>
                            <h4 className="font-semibold text-sm text-foreground">{language === 'ko' ? '해설:' : 'Explanation:'}</h4>
                            <div className="prose dark:prose-invert max-w-none text-sm mt-1">
                                <ReactMarkdown children={question.explanation} remarkPlugins={[remarkGfm]} />
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
};


const IncorrectQuestionsReview: React.FC<IncorrectQuestionsReviewProps> = ({
  language,
  markedQuestions,
  incorrectQuestions,
  questions,
  isVisible, // Keep isVisible prop, but apply it in ResultsPage.tsx
}) => {

  const findOriginalQuestionIndex = (questionId: number): number => {
    if (!questions) return -1;
    return questions.findIndex(ques => ques.id === questionId);
  };

  // No Accordion wrapper needed anymore
  return (
    // Removed outer div with animation classes (handled in ResultsPage)
    // Removed outer space-y-6 (handled in ResultsPage)
    <>
        {/* Marked Questions Section */}
        {markedQuestions.length > 0 && (
            <div className="space-y-2 mb-6"> {/* Add margin-bottom */}
                <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground"> {/* Use h3 for semantic structure */}
                    <Bookmark className="h-5 w-5 text-primary" />
                    {language === 'ko' ? '표시된 문제' : 'Marked Questions'}
                </h3>
                 {/* Removed hr and Accordion */}
                <div className="space-y-4"> {/* Add spacing between cards */}
                    {markedQuestions.map((q) => {
                        const originalIndex = findOriginalQuestionIndex(q.id);
                        return (
                            <QuestionReviewCard
                                key={`marked-${q.id}`}
                                question={q}
                                originalIndex={originalIndex >= 0 ? originalIndex : -1} // Pass -1 if not found
                                language={language}
                                itemType="marked"
                            />
                        );
                    })}
                </div>
            </div>
        )}

        {/* Incorrect Questions Section */}
        {incorrectQuestions.length > 0 && (
            <div className="space-y-2">
                {/* Added XCircle icon before the title */}
                <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground">
                    <XCircle className="h-5 w-5 text-destructive" /> {/* Added icon */}
                    {language === 'ko' ? '오답 다시보기' : 'Review Incorrect Answers'}
                </h3> {/* Use h3 */}
                 {/* Removed hr and Accordion */}
                 <div className="space-y-4"> {/* Add spacing between cards */}
                    {incorrectQuestions.map((q) => {
                         const originalIndex = findOriginalQuestionIndex(q.id);
                         return (
                             <QuestionReviewCard
                                key={`incorrect-${q.id}`}
                                question={q}
                                originalIndex={originalIndex >= 0 ? originalIndex : -1} // Pass -1 if not found
                                language={language}
                                itemType="incorrect"
                            />
                         );
                    })}
                </div>
            </div>
        )}

        {/* Conditional Messages */}
        {incorrectQuestions.length === 0 && markedQuestions.length === 0 && (
            <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-200">
                    {language === 'ko' ? '축하합니다! 모든 문제를 맞혔고 표시한 문제도 없습니다.' : 'Congratulations! You answered all questions correctly and marked none.'}
                </p>
            </div>
        )}
         {incorrectQuestions.length === 0 && markedQuestions.length > 0 && (
            <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    {language === 'ko' ? '모든 문제를 맞혔습니다! 위에서 표시한 문제를 검토할 수 있습니다.' : 'You answered all questions correctly! You can review your marked questions above.'}
                </p>
            </div>
        )}
    </>
  );
};

export default IncorrectQuestionsReview;

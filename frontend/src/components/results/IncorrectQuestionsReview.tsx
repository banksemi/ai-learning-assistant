import React from 'react';
import { cn } from '@/lib/utils';
// Removed UserAnswer import as it's no longer directly used here
import { Language, Question } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Bookmark, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '@/components/CodeBlock';

interface IncorrectQuestionsReviewProps {
  language: Language;
  // Receive the already mapped Question objects from the result
  markedQuestions: Question[];
  incorrectQuestions: Question[];
  // Keep original questions list to find the original index
  questions: Question[];
  isVisible: boolean;
  // Removed markedQuestionIds and userAnswers props
}

// Helper component to render a single question in the accordion
const QuestionAccordionItem: React.FC<{
    question: Question; // This question object now contains userSelectedIds, explanation, etc.
    index: number; // Index within the marked/incorrect list
    originalIndex: number; // Original index from the full quiz
    language: Language;
    itemType: 'marked' | 'incorrect';
    // Removed userAnswer prop
}> = ({
    question, index, originalIndex, language, itemType
}) => {
    // Get selected IDs directly from the question object provided by the API result
    const selectedOptionIds = question.userSelectedIds || [];
    // Determine correctness based on comparison (or assume incorrect if in incorrect list)
    const isUserAnswerCorrect = itemType === 'marked'
        ? JSON.stringify([...question.correctAnswerIds].sort()) === JSON.stringify([...selectedOptionIds].sort())
        : false; // Assume incorrect if it's in the incorrectQuestions list

    // Map options based on language (assuming question object has options for both)
    // If API only returns one language in results, adjust this logic
    const currentLangOptions = question.options; // Assuming options are already correct lang or need mapping if not
    // const currentLangText = question.text; // Assuming text is already correct lang
    // const currentLangExplanation = question.explanation; // Assuming explanation is already correct lang

    return (
        <AccordionItem
            // Use originalIndex for value to be more robust if lists change order? Or stick with index?
            // Using question.id ensures uniqueness regardless of index.
            value={`item-${question.id}-${itemType}`}
            key={`${question.id}-${itemType}`}
            className={cn(
                "border rounded-lg px-4 shadow-sm transition-colors",
                itemType === 'marked' && "bg-blue-50/30 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50 hover:bg-blue-100/40 dark:hover:bg-blue-900/30",
                itemType === 'incorrect' && "bg-red-50/30 dark:bg-red-950/20 border-red-100 dark:border-red-900/50 hover:bg-red-100/40 dark:hover:bg-red-900/30"
            )}
        >
            <AccordionTrigger
                className="text-left font-normal hover:no-underline py-3 items-start"
            >
                <div className="flex-1 space-y-1 pr-2">
                    <span className="text-sm text-muted-foreground">
                        {/* Use originalIndex for display */}
                        {language === 'ko' ? `질문 ${originalIndex + 1}` : `Question ${originalIndex + 1}`}
                    </span>
                    <div className="prose dark:prose-invert max-w-none text-sm">
                        <ReactMarkdown
                            // Use question.text (assuming correct language)
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
                            }}
                        />
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-4">
                <hr className="border-border/60 border-dashed my-3" />

                {/* User's Answer Section - Use question.userSelectedIds */}
                {selectedOptionIds.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-1">
                            {language === 'ko' ? '선택한 답:' : 'Your Answer:'}
                            {isUserAnswerCorrect ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                            )}
                        </h4>
                        {currentLangOptions
                            .filter(opt => selectedOptionIds.includes(opt.id))
                            .map(selectedOpt => (
                                <div
                                    key={selectedOpt.id}
                                    className={cn(
                                        "p-4 border rounded-lg text-sm",
                                        isUserAnswerCorrect
                                            ? "bg-green-100/70 dark:bg-green-900/50 border-green-200 dark:border-green-700/50"
                                            : "bg-red-100/70 dark:bg-red-900/50 border-red-200 dark:border-red-700/50"
                                    )}
                                >
                                    {/* Use option.text */}
                                    <ReactMarkdown children={selectedOpt.text} remarkPlugins={[remarkGfm]} className="prose dark:prose-invert max-w-none" />
                                </div>
                            ))}
                    </div>
                )}
                 {selectedOptionIds.length === 0 && itemType === 'incorrect' && (
                     <div className="mt-4 space-y-2">
                         <h4 className="font-semibold text-sm text-red-600">{language === 'ko' ? '선택한 답:' : 'Your Answer:'}</h4>
                         <p className="text-sm text-muted-foreground italic">{language === 'ko' ? '답변하지 않음' : 'Not answered'}</p>
                     </div>
                 )}


                {/* Correct Answer Section (Only show if user was incorrect or if it's a marked question they got right) */}
                {/* Show correct answer if the item is 'incorrect' OR if it's 'marked' and the user got it wrong */}
                {(itemType === 'incorrect' || (itemType === 'marked' && !isUserAnswerCorrect)) && (
                    <div className="mt-4 space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-1">
                            {language === 'ko' ? '정답:' : 'Correct Answer(s):'}
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </h4>
                        {currentLangOptions
                            // Use question.correctAnswerIds
                            .filter(opt => question.correctAnswerIds.includes(opt.id))
                            .map(correctOpt => (
                                <div key={correctOpt.id} className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/60 border-green-200 dark:border-green-700 text-sm">
                                    {/* Use option.text */}
                                    <ReactMarkdown children={correctOpt.text} remarkPlugins={[remarkGfm]} className="prose dark:prose-invert max-w-none" />
                                </div>
                            ))}
                    </div>
                )}

                {/* Explanation Section - Use question.explanation */}
                <div className="mt-4">
                    <h4 className="font-semibold text-sm">{language === 'ko' ? '해설:' : 'Explanation:'}</h4>
                    <div className="prose dark:prose-invert max-w-none text-sm mt-1 text-muted-foreground">
                        {/* Use question.explanation */}
                        <ReactMarkdown children={question.explanation} remarkPlugins={[remarkGfm]} />
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};


const IncorrectQuestionsReview: React.FC<IncorrectQuestionsReviewProps> = ({
  language,
  markedQuestions, // Use this prop
  incorrectQuestions, // Use this prop
  questions, // Keep for original index lookup
  isVisible,
  // Removed markedQuestionIds, userAnswers
}) => {

  // Keep this function to find the original display index
  const findOriginalQuestionIndex = (questionId: number): number => {
    // Ensure questions list is available before searching
    if (!questions) return -1; // Return -1 or handle appropriately
    return questions.findIndex(ques => ques.id === questionId);
  };

  // Removed findUserAnswer function

  // Filter marked questions locally if needed, but API provides them directly
  // const markedQuestions = questions.filter(q => markedQuestionIds.includes(q.id));

  return (
    <div className={cn(
        "space-y-6",
        "transition-all duration-500 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
        {/* Marked Questions Section */}
        {markedQuestions.length > 0 && (
            <div className="space-y-2">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Bookmark className="h-5 w-5 text-primary" />
                    {language === 'ko' ? '표시된 문제' : 'Marked Questions'}
                </h2>
                 <hr className="border-border/60 border-dashed my-3" />
                <Accordion type="multiple" className="w-full space-y-3 border-b-0">
                    {/* Iterate over markedQuestions prop */}
                    {markedQuestions.map((q, index) => {
                        const originalIndex = findOriginalQuestionIndex(q.id);
                        return (
                            <QuestionAccordionItem
                                key={`marked-${q.id}`}
                                question={q} // Pass the full Question object
                                index={index}
                                originalIndex={originalIndex >= 0 ? originalIndex : index} // Fallback to list index if original not found
                                language={language}
                                itemType="marked"
                                // userAnswer prop removed
                            />
                        );
                    })}
                </Accordion>
            </div>
        )}

        {/* Incorrect Questions Section */}
        {incorrectQuestions.length > 0 && (
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">{language === 'ko' ? '오답 다시보기' : 'Review Incorrect Answers'}</h2>
                 <hr className="border-border/60 border-dashed my-3" />
                <Accordion type="multiple" className="w-full space-y-3 border-b-0">
                     {/* Iterate over incorrectQuestions prop */}
                    {incorrectQuestions.map((q, index) => {
                         const originalIndex = findOriginalQuestionIndex(q.id);
                         return (
                             <QuestionAccordionItem
                                key={`incorrect-${q.id}`}
                                question={q} // Pass the full Question object
                                index={index}
                                originalIndex={originalIndex >= 0 ? originalIndex : index} // Fallback to list index
                                language={language}
                                itemType="incorrect"
                                // userAnswer prop removed
                            />
                         );
                    })}
                </Accordion>
            </div>
        )}

        {/* Conditional Messages remain the same, checking lengths of passed arrays */}
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
    </div>
  );
};

export default IncorrectQuestionsReview;

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaChevronDown, FaChevronUp, FaCheck, FaTimes, FaBookmark, FaTrophy } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// CodeBlock component (remains the same)
const CodeBlock = {
    code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
            <SyntaxHighlighter
                style={atomDark}
                language={match[1]}
                PreTag="div"
                {...props}
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        ) : (
            <code className={`${className} bg-gray-200 text-sm px-1 py-0.5 rounded font-mono`} {...props}>
                {children}
            </code>
        );
    },
    p: ({ node, children }) => <p className="inline mb-0">{children}</p>,
};

// Helper to format answers for display (remains the same)
const formatAnswerText = (options, answerIds) => {
    const ids = Array.isArray(answerIds) ? answerIds : [];
    if (ids.length === 0) return 'N/A';
    return ids.map(id => {
        const option = options.find(opt => opt.id === id);
        return option ? option.text : id;
    }).join(', ');
};


// Animation variants (remain the same)
const containerVariants = {
  hidden: { opacity: 0, scale: 0.8, height: 0, overflow: 'hidden' },
  visible: {
    opacity: 1, scale: 1, height: 'auto', overflow: 'visible',
    transition: {
      height: { duration: 0.4, ease: "easeOut" }, opacity: { duration: 0.4, ease: "easeOut" },
      scale: { duration: 0.4, ease: "easeOut" }, when: "beforeChildren", staggerChildren: 0.1
    }
  }
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

// Animation variants for explanation section - Simplified: Removed margin animation
const explanationVariants = {
    hidden: {
        opacity: 0,
        maxHeight: 0,
        transition: {
            // Apply transition to both properties
            maxHeight: { duration: 0.3, ease: "easeOut" },
            opacity: { duration: 0.2, ease: "easeOut" } // Slightly faster opacity fade out
        }
    },
    visible: {
        opacity: 1,
        maxHeight: '500px', // Set a sufficiently large max-height
        transition: {
            // Apply transition to both properties
            maxHeight: { duration: 0.3, ease: "easeOut" },
            opacity: { duration: 0.3, ease: "easeOut", delay: 0.05 } // Slight delay for opacity fade in
        }
    }
};


const ResultsPage = ({ questions, userAnswers, markedQuestions, restartQuiz, quizResults }) => {
  const { t } = useLanguage();
  const [openExplanations, setOpenExplanations] = useState({});

  const toggleExplanation = (questionId) => {
    setOpenExplanations(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Calculate score and filter lists (remains the same logic)
  const { score, totalQuestions, incorrectQuestionsList, markedQuestionsList } = useMemo(() => {
    let correctCount = 0;
    const incorrect = [];
    const marked = [];
    questions.forEach(q => {
      const userAnswer = userAnswers[q.id];
      const correctAnswer = q.correctAnswer;
      const isAnswered = userAnswer !== undefined && userAnswer !== null;
      const hasCorrectAnswerInfo = correctAnswer !== null && correctAnswer !== undefined;
      let isCorrect = false;
      if (isAnswered && hasCorrectAnswerInfo) {
          const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
          const correctAnswerArray = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
          isCorrect = JSON.stringify([...userAnswerArray].sort()) === JSON.stringify([...correctAnswerArray].sort());
      }
      if (isCorrect) {
        correctCount++;
      } else if (isAnswered) {
        incorrect.push(q);
      }
      if (markedQuestions.has(q.id)) {
        marked.push(q);
      }
    });
    return {
      score: correctCount,
      totalQuestions: questions.length,
      incorrectQuestionsList: incorrect,
      markedQuestionsList: marked,
    };
  }, [questions, userAnswers, markedQuestions]);

  const accuracy = quizResults?.correctRate !== undefined ? quizResults.correctRate : (totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0);
  const aiSummary = quizResults?.summary;

  return (
    <motion.div
      className="bg-card p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-3xl mt-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ overflow: 'hidden' }}
    >
      <motion.h2 variants={itemVariants} className="text-2xl sm:text-3xl font-bold text-primary mb-4 text-center">{t('resultsTitle')}</motion.h2>

      <motion.p variants={itemVariants} className="text-center text-lg text-textPrimary mb-6 flex items-center justify-center">
         <FaTrophy className="text-yellow-500 mr-2" /> {t('congratsMessage')}
      </motion.p>

      {/* Accuracy Section */}
      <motion.div variants={itemVariants} className="bg-indigo-50 p-4 rounded-lg mb-6 text-center">
        <p className="text-lg font-semibold text-textPrimary">{t('accuracy')}</p>
        <p className="text-3xl font-bold text-primary">{accuracy}%</p>
        <p className="text-sm text-textSecondary">
          {t('scoreOutOfTotal', { score: score, totalQuestions: totalQuestions })}
        </p>
      </motion.div>

      {/* AI Advice Section - Apply Markdown */}
      <motion.div variants={itemVariants} className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-textPrimary mb-2">{t('aiAdviceTitle')}</h3>
        <div className="markdown-content text-sm text-textSecondary">
            {aiSummary ? (
                 <ReactMarkdown components={{ code: CodeBlock.code }}>{aiSummary}</ReactMarkdown>
            ) : (
                 <p className="italic">{t('aiAdvicePlaceholder')}</p>
            )}
        </div>
      </motion.div>

      {/* Marked Questions Section */}
      {markedQuestionsList.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <h3 className="text-xl font-semibold text-textPrimary mb-4 flex items-center">
             <FaBookmark className="mr-2 text-primary" /> {t('markedQuestionsTitle')}
          </h3>
          <div className="space-y-4">
            {markedQuestionsList.map((q) => {
               const userAnswer = userAnswers[q.id];
               const correctAnswer = q.correctAnswer;
               const isAnswered = userAnswer !== undefined && userAnswer !== null;
               const hasCorrectAnswerInfo = correctAnswer !== null && correctAnswer !== undefined;
               let isCorrect = false;
               if (isAnswered && hasCorrectAnswerInfo) {
                   const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
                   const correctAnswerArray = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
                   isCorrect = JSON.stringify([...userAnswerArray].sort()) === JSON.stringify([...correctAnswerArray].sort());
               }
               const isExplanationOpen = openExplanations[q.id];

               return (
                 <div key={`marked-${q.id}`} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-4 bg-yellow-50">
                      <div className="markdown-content text-sm text-textPrimary mb-3">
                        <ReactMarkdown components={{ code: CodeBlock.code }}>{`**${t('question')} ${q.id}:** ${q.question}`}</ReactMarkdown>
                      </div>
                      <div className="text-xs space-y-1">
                          <p className="flex items-baseline">
                              <strong className={`mr-1 ${isAnswered ? (isCorrect ? 'text-correct' : 'text-incorrect') : 'text-textSecondary'}`}>
                                  {t('yourAnswer')}:
                              </strong>
                              {isAnswered ? (
                                  <ReactMarkdown components={CodeBlock} className="inline">
                                      {formatAnswerText(q.options, userAnswer)}
                                  </ReactMarkdown>
                              ) : <span className="italic text-gray-500">Not Answered</span>}
                              {isAnswered && isCorrect && <FaCheck className="inline ml-1 text-correct" />}
                              {isAnswered && !isCorrect && <FaTimes className="inline ml-1 text-incorrect" />}
                          </p>
                          {hasCorrectAnswerInfo && (
                             <p className="flex items-baseline">
                                <strong className="text-correct mr-1">{t('correctAnswer')}:</strong>
                                <ReactMarkdown components={CodeBlock} className="inline">
                                     {formatAnswerText(q.options, correctAnswer)}
                                </ReactMarkdown>
                             </p>
                          )}
                      </div>
                    </div>
                    {q.explanation && (
                      <>
                        <button
                          onClick={() => toggleExplanation(q.id)}
                          className="w-full flex justify-between items-center p-3 bg-yellow-100 hover:bg-yellow-200 text-sm text-textSecondary transition-colors"
                        >
                          <span>{isExplanationOpen ? t('hideExplanation') : t('showExplanation')}</span>
                          {isExplanationOpen ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                        <AnimatePresence initial={false}>
                          {isExplanationOpen && (
                            <motion.div
                              key="explanation-content"
                              variants={explanationVariants}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              // Apply overflow hidden directly here for clarity during animation
                              style={{ overflow: 'hidden' }}
                              // Padding is now part of the motion div, not animated margin
                              className="p-4 border-t border-gray-200 bg-white"
                            >
                              <h4 className="text-sm font-semibold text-textPrimary mb-2">{t('explanation')}</h4>
                              <div className="markdown-content text-sm text-textSecondary">
                                 <ReactMarkdown components={{ code: CodeBlock.code }}>{q.explanation}</ReactMarkdown>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                 </div>
               );
            })}
          </div>
        </motion.div>
      )}

      {/* Incorrect Answers Section */}
      {incorrectQuestionsList.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <h3 className="text-xl font-semibold text-textPrimary mb-4">{t('incorrectAnswersTitle')}</h3>
          <div className="space-y-4">
            {incorrectQuestionsList.map((q) => {
               const isExplanationOpen = openExplanations[q.id];
               return (
                 <div key={`incorrect-${q.id}`} className="border border-gray-200 rounded-lg overflow-hidden">
                   <div className="p-4 bg-gray-50">
                     <div className="markdown-content text-sm text-textPrimary mb-3">
                       <ReactMarkdown components={{ code: CodeBlock.code }}>{`**${t('question')} ${q.id}:** ${q.question}`}</ReactMarkdown>
                     </div>
                     <div className="text-xs space-y-1">
                       <p className="flex items-baseline">
                          <strong className="text-incorrect mr-1">{t('yourAnswer')}:</strong>
                          <ReactMarkdown components={CodeBlock} className="inline">
                              {formatAnswerText(q.options, userAnswers[q.id])}
                          </ReactMarkdown>
                       </p>
                       {q.correctAnswer && (
                          <p className="flex items-baseline">
                             <strong className="text-correct mr-1">{t('correctAnswer')}:</strong>
                             <ReactMarkdown components={CodeBlock} className="inline">
                                 {formatAnswerText(q.options, q.correctAnswer)}
                             </ReactMarkdown>
                          </p>
                       )}
                     </div>
                   </div>
                   {q.explanation && (
                     <>
                      <button
                        onClick={() => toggleExplanation(q.id)}
                        className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 text-sm text-textSecondary transition-colors"
                      >
                        <span>{isExplanationOpen ? t('hideExplanation') : t('showExplanation')}</span>
                        {isExplanationOpen ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                      <AnimatePresence initial={false}>
                        {isExplanationOpen && (
                          <motion.div
                            key="explanation-content"
                            variants={explanationVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            style={{ overflow: 'hidden' }}
                            className="p-4 border-t border-gray-200 bg-white"
                          >
                            <h4 className="text-sm font-semibold text-textPrimary mb-2">{t('explanation')}</h4>
                            <div className="markdown-content text-sm text-textSecondary">
                               <ReactMarkdown components={{ code: CodeBlock.code }}>{q.explanation}</ReactMarkdown>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                     </>
                   )}
                 </div>
               );
            })}
          </div>
        </motion.div>
      )}

      {/* Restart Button */}
      <motion.div variants={itemVariants} className="text-center mt-8">
        <button
          onClick={restartQuiz}
          className="bg-primary text-white px-8 py-2 rounded-md hover:bg-indigo-700 transition duration-200"
        >
          {t('restartQuiz')}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ResultsPage;

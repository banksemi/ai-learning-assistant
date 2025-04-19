import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useLanguage } from '../contexts/LanguageContext';
import { FaCheckCircle, FaTimesCircle, FaArrowRight, FaCommentDots, FaBookmark, FaRegBookmark } from 'react-icons/fa';

// CodeBlock component definition - Reverted: Removed custom 'p' renderer
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
            <code className={`${className || ''} bg-gray-200 text-sm px-1 py-0.5 rounded font-mono`} {...props}>
                {children}
            </code>
        );
    },
};


const QuizCard = ({
  examId,
  questionData,
  onNext,
  onSubmit,
  questionNumber,
  totalQuestions,
  submittedAnswer,
  onAskAI,
  isMarked,
  onToggleMark
}) => {
  const { t } = useLanguage();
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const userAnswer = submittedAnswer;
    const hasBeenAnswered = userAnswer !== undefined && userAnswer !== null;
    const hasCorrectAnswerInfo = questionData.correctAnswer !== null;

    setSelectedOptions(hasBeenAnswered ? userAnswer : []);
    setShowFeedback(hasCorrectAnswerInfo);
    setError('');

    if (hasCorrectAnswerInfo && hasBeenAnswered) {
        const correct = JSON.stringify([...userAnswer].sort()) === JSON.stringify([...questionData.correctAnswer].sort());
        setIsCorrect(correct);
    } else {
         setIsCorrect(null);
    }
  }, [questionData.id, submittedAnswer, questionData.correctAnswer, questionData.explanation]);

  const handleOptionChange = (optionId) => {
    if (showFeedback) return;
    setError('');
    if (questionData.type === 'single') {
      setSelectedOptions([optionId]);
    } else {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleSubmit = () => {
    if (selectedOptions.length === 0) {
      setError(t('pleaseSelect'));
      return;
    }
    setError('');
    onSubmit(selectedOptions);
  };

  const getOptionStyle = (optionId) => {
    const isSelected = selectedOptions.includes(optionId);
    let baseStyle = 'border rounded-lg p-4 mb-3 cursor-pointer transition duration-200 flex items-start';
    let stateStyle = 'border-gray-300 hover:border-primary hover:bg-indigo-50';

    if (showFeedback) {
      const isCorrectAnswer = questionData.correctAnswer?.includes(optionId);
      if (isCorrectAnswer) stateStyle = 'border-correct bg-emerald-50 text-correct font-medium';
      if (isSelected && !isCorrectAnswer) stateStyle = 'border-incorrect bg-red-50 text-incorrect font-medium';
      if (isSelected && isCorrectAnswer) stateStyle = 'border-correct bg-emerald-100 text-correct font-bold';
      baseStyle += ' cursor-not-allowed';
    } else if (isSelected) {
      stateStyle = 'border-primary bg-indigo-100 ring-2 ring-primary';
    }
    return `${baseStyle} ${stateStyle}`;
  };


  return (
    <div className="bg-card p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-3xl relative">
      <button
        onClick={() => onToggleMark(questionData.id)}
        className="absolute top-5 right-6 text-textSecondary hover:text-primary transition-colors duration-200 p-1"
        aria-label={isMarked ? t('unmarkQuestion') : t('markQuestion')}
        title={isMarked ? t('unmarkQuestion') : t('markQuestion')}
      >
        {isMarked ? <FaBookmark size={18} /> : <FaRegBookmark size={18} />}
      </button>

      <h2 className="text-lg sm:text-xl font-semibold text-textPrimary mb-4 pr-12">
        {t('question')} {questionNumber} {t('of')} {totalQuestions}
        {questionData.type === 'multiple' && !showFeedback && (
            <span className="text-sm text-textSecondary ml-2 font-normal">{t('multipleChoiceHint')}</span>
        )}
      </h2>

      {/* Render Question Text with Markdown */}
      <div className="markdown-content mb-6 pr-2 text-textPrimary">
         {/* Pass the standard CodeBlock (only code renderer) */}
        <ReactMarkdown components={CodeBlock}>{questionData.question}</ReactMarkdown>
      </div>

      {/* Render Options with Markdown */}
      <div className="mb-6">
        {questionData.options.map((option) => (
          <div
            key={option.id}
            className={getOptionStyle(option.id)}
            onClick={() => handleOptionChange(option.id)}
          >
             <input
                type={questionData.type === 'single' ? 'radio' : 'checkbox'}
                name={`question-${questionData.id}`}
                id={`option-${questionData.id}-${option.id}`}
                value={option.id}
                checked={selectedOptions.includes(option.id)}
                onChange={() => handleOptionChange(option.id)}
                className="mr-3 mt-1 h-4 w-4 accent-primary focus:ring-primary flex-shrink-0"
                disabled={showFeedback}
            />
            {/* Apply markdown-content class and render option text */}
            {/* Pass the standard CodeBlock */}
            <label htmlFor={`option-${questionData.id}-${option.id}`} className={`flex-1 markdown-content text-sm ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <ReactMarkdown components={CodeBlock}>{option.text}</ReactMarkdown>
            </label>
          </div>
        ))}
      </div>

      {error && <p className="text-incorrect text-sm mb-4">{error}</p>}

      {/* Render Explanation with Markdown */}
      {showFeedback && questionData.explanation && (
        <div className={`mb-6 p-4 rounded-md ${isCorrect ? 'bg-emerald-50 border border-correct' : 'bg-red-50 border border-incorrect'}`}>
          <div className="flex items-center mb-2">
            {isCorrect ? <FaCheckCircle className="text-correct mr-2" /> : <FaTimesCircle className="text-incorrect mr-2" />}
            <h3 className={`text-lg font-semibold ${isCorrect ? 'text-correct' : 'text-incorrect'}`}>
              {isCorrect ? t('correct') : t('incorrect')}
            </h3>
          </div>
          {/* Apply markdown-content class */}
          {/* Pass the standard CodeBlock */}
          <div className="text-sm text-textSecondary markdown-content">
              <ReactMarkdown components={CodeBlock}>{questionData.explanation}</ReactMarkdown>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
         <button
            onClick={onAskAI}
            className="flex items-center text-sm text-secondary font-medium px-4 py-2 rounded-md hover:bg-pink-50 transition-colors duration-200"
            aria-label={t('askAI')}
          >
            <FaCommentDots className="mr-2" />
            {t('askAI')}
          </button>

        <div>
            {!showFeedback ? (
              <button
                onClick={handleSubmit}
                className="bg-primary text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
                disabled={selectedOptions.length === 0}
              >
                {t('submit')}
              </button>
            ) : (
              <button
                onClick={onNext}
                className="bg-secondary text-white px-6 py-2 rounded-md hover:bg-pink-600 transition duration-200 flex items-center"
              >
                {t('nextQuestion')} <FaArrowRight className="ml-2" />
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default QuizCard;

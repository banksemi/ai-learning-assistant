import React from 'react';
import { cn } from '@/lib/utils';
import { Language } from '@/types';
import { useTranslation } from '@/translations';

// Animated score component (Internal to ScoreDisplay)
const AnimatedScore: React.FC<{ targetScore: number }> = ({ targetScore }) => {
  const [score, setScore] = React.useState(0);

  React.useEffect(() => {
    if (targetScore === 0) {
        setScore(0);
        return;
    }
    const duration = 1000;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setScore(Math.floor(progress * targetScore));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [targetScore]);

  return <span key={targetScore} className="text-4xl font-bold text-primary animate-count-up">{score}%</span>;
};

interface ScoreDisplayProps {
  score: number;
  totalQuestions: number;
  correctCount: number;
  language: Language;
  isVisible: boolean;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  totalQuestions,
  correctCount,
  language,
  isVisible,
}) => {
  const { t } = useTranslation();
  return (
    <div className={cn(
        "text-center p-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900",
        "transition-all duration-500 ease-out", // Animation classes
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4" // Control visibility
    )}>
        <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-1">
            {t('results.accuracy')}
        </p>
        <AnimatedScore targetScore={score} />
        <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
            {t('results.answeredCorrectly', { correct: correctCount, total: totalQuestions })}
        </p>
    </div>
  );
};

export default ScoreDisplay;

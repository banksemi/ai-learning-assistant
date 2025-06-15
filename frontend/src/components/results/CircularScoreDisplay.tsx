import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Language } from '@/types';
import { useTranslation } from '@/translations';

interface CircularScoreDisplayProps {
  score: number;
  language: Language;
  isVisible: boolean;
  totalQuestions: number; // Added for context if needed
  correctCount: number; // Added for context if needed
}

// Ease-out cubic function: starts fast, slows down towards the end
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const CircularScoreDisplay: React.FC<CircularScoreDisplayProps> = ({
  score: targetScore,
  language,
  isVisible,
  totalQuestions,
  correctCount,
}) => {
  const { t } = useTranslation();
  // State for the displayed integer score
  const [displayScore, setDisplayScore] = useState(0);
  // State for the internal float score used for circle animation
  const [internalAnimatedScore, setInternalAnimatedScore] = useState(0);

  const radius = 80;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const viewBoxSize = radius * 2 + strokeWidth * 2;
  const center = radius + strokeWidth;

  useEffect(() => {
    if (!isVisible) return;

    let animationFrameId: number;
    const duration = 1500; // Animation duration in ms
    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(rawProgress);

      // Calculate internal score using float precision
      const currentInternalScore = easedProgress * targetScore;
      setInternalAnimatedScore(currentInternalScore);

      // Calculate display score by flooring the internal score
      const currentDisplayScore = Math.floor(currentInternalScore);
      setDisplayScore(currentDisplayScore);

      if (rawProgress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        // Ensure the final scores are exactly the target score
        setInternalAnimatedScore(targetScore);
        setDisplayScore(targetScore);
      }
    };

    // Reset scores to 0 before starting animation
    setInternalAnimatedScore(0);
    setDisplayScore(0);
    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [targetScore, isVisible]);

  // Calculate offset based on the *internal* float score for smoothness
  const offset = circumference - (internalAnimatedScore / 100) * circumference;

  return (
    <div className={cn(
        "flex flex-col items-center justify-center p-6 rounded-lg",
        "transition-opacity duration-500 ease-out",
        isVisible ? "opacity-100" : "opacity-0"
    )}>
      <div className="relative w-48 h-48">
        <svg className="w-full h-full" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
          <circle
            className="text-gray-200 dark:text-gray-700"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={center}
            cy={center}
          />
          <circle
            className="text-primary"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset} // Offset uses the smooth internal float score
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={center}
            cy={center}
            style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
           {/* Text displays the floored integer score */}
           <span className="text-4xl font-bold text-primary">{displayScore}%</span>
           <p className="text-sm text-muted-foreground mt-1">
               {t('results.accuracy')}
           </p>
        </div>
      </div>
       <p className="text-sm text-muted-foreground mt-4">
            {t('results.answeredCorrectly', { correct: correctCount, total: totalQuestions })}
       </p>
    </div>
  );
};

export default CircularScoreDisplay;

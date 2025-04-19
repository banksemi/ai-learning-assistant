import React from 'react';
import ProgressBar from './ProgressBar';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';

// Updated props: receive isQuizActive and use progress for label
const Header = ({ isQuizActive, progress }) => {
  const { t } = useLanguage();
  // Round progress for display
  const displayProgress = Math.round(progress);

  return (
    // Changed max-w-4xl to max-w-3xl for consistency
    <div className="w-full max-w-3xl mb-6">
      <div className="flex justify-between items-center mb-2">
        {/* Updated label to show percentage complete */}
        <span className="text-sm font-medium text-textSecondary">
          {displayProgress}% {t('complete')}
        </span>
        {/* Pass disabled state to LanguageSelector */}
        <LanguageSelector disabled={isQuizActive} />
      </div>
      <ProgressBar progress={progress} />
    </div>
  );
};

export default Header;

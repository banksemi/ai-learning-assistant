import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { FaGlobe } from 'react-icons/fa';

// Added disabled prop
const LanguageSelector = ({ disabled = false }) => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  return (
    <div className={`relative inline-flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
       <FaGlobe className="text-textSecondary mr-2" />
      <select
        value={language}
        onChange={handleLanguageChange}
        className={`appearance-none bg-transparent text-sm text-textPrimary font-medium py-1 pr-6 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${disabled ? 'pointer-events-none' : ''}`}
        aria-label={t('language')}
        disabled={disabled} // Apply disabled attribute
      >
        <option value="en">English</option>
        <option value="ko">한국어</option>
        {/* Add more languages here */}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-textSecondary">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  );
};

export default LanguageSelector;

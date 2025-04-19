import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { getQuestionBanks, createExam } from '../services/api'; // Import API functions

// Mock data 제거

const QuestionBankSelection = ({ onStartQuiz }) => {
  const { t, language } = useLanguage();
  const [questionBanks, setQuestionBanks] = useState([]); // API에서 가져온 문제 은행 목록
  const [isLoadingBanks, setIsLoadingBanks] = useState(true); // 문제 은행 로딩 상태
  const [selectedBank, setSelectedBank] = useState('');
  const [numQuestionsInput, setNumQuestionsInput] = useState('');
  const [maxQuestions, setMaxQuestions] = useState(null);
  const [error, setError] = useState('');
  const [isCreatingExam, setIsCreatingExam] = useState(false); // 시험 생성 로딩 상태

  // 컴포넌트 마운트 시 문제 은행 목록 가져오기
  useEffect(() => {
    const fetchBanks = async () => {
      setIsLoadingBanks(true);
      setError(''); // 이전 에러 초기화
      try {
        const banks = await getQuestionBanks();
        setQuestionBanks(banks);
      } catch (err) {
        setError(t('errorFetchingBanks') || 'Failed to load question banks. Please try again later.'); // 에러 메시지 추가 (번역 필요)
        setQuestionBanks([]); // 에러 발생 시 목록 비우기
      } finally {
        setIsLoadingBanks(false);
      }
    };
    fetchBanks();
  }, [t]); // t를 의존성에 추가하여 언어 변경 시 에러 메시지 재번역

  // 선택된 은행 변경 시 최대 문제 수 업데이트
  useEffect(() => {
    if (selectedBank) {
      const bank = questionBanks.find(b => b.id === parseInt(selectedBank, 10));
      if (bank) {
        setMaxQuestions(bank.count);
        // 선택된 은행의 최대 문제 수보다 입력값이 크면 입력값 조정 (선택적)
        // const currentNum = parseInt(numQuestionsInput, 10);
        // if (!isNaN(currentNum) && currentNum > bank.count) {
        //   setNumQuestionsInput(String(bank.count));
        // }
      } else {
        setMaxQuestions(null);
      }
    } else {
      setMaxQuestions(null);
    }
    setError(''); // 은행 변경 시 에러 초기화
  }, [selectedBank, questionBanks, numQuestionsInput]);

  const handleNumQuestionsChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^[1-9]\d*$/.test(value)) {
      setNumQuestionsInput(value);
      setError('');
    } else if (value === '0') {
      setError(t('invalidNumberError'));
    }
  };

  const validateInputs = () => {
    setError('');
    if (!selectedBank) {
      setError(t('pleaseSelectBank'));
      return false;
    }
    if (numQuestionsInput === '') {
      setError(t('pleaseEnterNumQuestions'));
      return false;
    }
    const num = parseInt(numQuestionsInput, 10);
    if (isNaN(num) || num <= 0) {
      setError(t('invalidNumberError'));
      return false;
    }
    if (maxQuestions !== null && num > maxQuestions) {
      setError(t('numberTooHighError', { count: maxQuestions }));
      return false;
    }
    return true;
  };

  const handleStart = async () => {
    if (!validateInputs() || isCreatingExam) {
      return;
    }

    setIsCreatingExam(true);
    setError('');

    try {
      const bankId = parseInt(selectedBank, 10);
      const numQuestions = parseInt(numQuestionsInput, 10);

      // createExam API 호출
      const examId = await createExam(bankId, language, numQuestions);

      // 성공 시 App 컴포넌트로 examId와 설정 전달
      onStartQuiz({
        bankId: bankId, // API에서 사용한 ID 전달
        numQuestions: numQuestions,
        language: language,
        examId: examId, // 생성된 시험 ID 전달
      });

    } catch (err) {
      console.error("Error starting quiz:", err);
      setError(t('errorStartingQuiz') || 'Failed to start the quiz. Please try again.'); // 에러 메시지 추가 (번역 필요)
    } finally {
      setIsCreatingExam(false);
    }
  };

  return (
    <div className="bg-card p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-lg mx-auto mt-10">
      <h2 className="text-2xl font-bold text-center text-primary mb-6">{t('selectQuizTitle')}</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleStart(); }}>
        <div className="mb-6 flex justify-end">
           <LanguageSelector />
        </div>

        {/* Question Bank Selection */}
        <div className="mb-6">
          <label htmlFor="questionBank" className="block text-sm font-medium text-textPrimary mb-2">
            {t('selectBankLabel')}
          </label>
          {isLoadingBanks ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-textSecondary animate-pulse">
              Loading banks...
            </div>
          ) : (
            <select
              id="questionBank"
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              required
              disabled={questionBanks.length === 0} // 은행 목록 없으면 비활성화
            >
              <option value="" disabled>{t('selectBankPlaceholder')}</option>
              {questionBanks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name} ({bank.count} {t('questions') || 'questions'}) {/* 번역 키 추가 */}
                </option>
              ))}
            </select>
          )}
           {questionBanks.length === 0 && !isLoadingBanks && !error && (
             <p className="text-sm text-textSecondary mt-2">{t('noBanksAvailable') || 'No question banks available.'}</p> // 번역 키 추가
           )}
        </div>

        {/* Number of Questions Input */}
        <div className="mb-8">
          <label htmlFor="numQuestions" className="block text-sm font-medium text-textPrimary mb-2">
            {t('selectNumQuestionsLabel')}
            {maxQuestions !== null && (
                <span className="text-xs text-textSecondary ml-2">
                    {t('maxQuestionsAvailable', { count: maxQuestions })}
                </span>
            )}
          </label>
          <input
            type="number"
            id="numQuestions"
            value={numQuestionsInput}
            onChange={handleNumQuestionsChange}
            placeholder={t('numQuestionsInputPlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            min="1"
            max={maxQuestions !== null ? maxQuestions : undefined}
            step="1"
            required
            disabled={!selectedBank || isLoadingBanks} // 은행 로딩 중이거나 선택 안됐으면 비활성화
          />
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            type="submit"
            className={`w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-md font-semibold hover:bg-indigo-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${isCreatingExam ? 'animate-pulse' : ''}`}
            disabled={!selectedBank || numQuestionsInput === '' || isLoadingBanks || isCreatingExam}
          >
            {isCreatingExam ? (t('startingQuiz') || 'Starting...') : t('startQuizButton')} {/* 번역 키 추가 */}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionBankSelection;

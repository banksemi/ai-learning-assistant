import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Header from './components/Header';
import QuizCard from './components/QuizCard';
import ChatOverlay from './components/ChatOverlay';
import ResultsPage from './components/ResultsPage';
import QuestionBankSelection from './components/QuestionBankSelection';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { getExamQuestions, submitAnswer, markQuestion, unmarkQuestion, getExamResult } from './services/api';

// Main App component wrapped with LanguageProvider
function AppWrapper() {
  return (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}

function App() {
  const { setLanguage, t } = useLanguage();

  const [quizSettings, setQuizSettings] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionsForQuiz, setQuestionsForQuiz] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [markedQuestions, setMarkedQuestions] = useState(new Set());
  const [showChat, setShowChat] = useState(false);
  // Updated quizResults state structure to match new API response
  const [quizResults, setQuizResults] = useState(null); // Store { correctQuestions, totalQuestions, summary }
  const [error, setError] = useState('');

  const examId = quizSettings?.examId;

  const totalQuestionsInState = questionsForQuiz.length; // Total questions currently loaded in state
  const currentQuestion = !quizFinished && quizStarted && questionsForQuiz.length > 0 ? questionsForQuiz[currentQuestionIndex] : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [quizStarted, currentQuestionIndex, quizFinished]);

  const handleStartQuiz = useCallback(async (settings) => {
    console.log("Starting quiz with settings:", settings);
    setError('');
    setLanguage(settings.language);
    setQuizSettings(settings);
    setQuizStarted(true);
    setQuizFinished(false);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setMarkedQuestions(new Set());
    setShowChat(false);
    setQuestionsForQuiz([]);
    setQuizResults(null);
    setIsLoadingQuestions(true);

    try {
      const fetchedQuestions = await getExamQuestions(settings.examId);
      setQuestionsForQuiz(fetchedQuestions);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError(t('errorFetchingQuestions') || 'Failed to load questions. Please try restarting the quiz.');
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [setLanguage, t]);

  const resetToSelection = useCallback(() => {
    setQuizSettings(null);
    setQuizStarted(false);
    setQuizFinished(false);
    setQuestionsForQuiz([]);
    setError('');
  }, []);

  const handleNextQuestion = useCallback(async () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < totalQuestionsInState) { // Use total questions loaded in state
      setCurrentQuestionIndex(nextIndex);
    } else {
      setError('');
      try {
        if (examId) {
          // Fetch results using the new API structure
          const results = await getExamResult(examId);
          // Store the results object directly { correctQuestions, totalQuestions, summary }
          setQuizResults(results);
        } else {
           console.error("Exam ID is missing, cannot fetch results.");
           setError("Could not fetch results: Exam ID missing.");
        }
      } catch (err) {
        console.error("Error fetching results:", err);
        setError(t('errorFetchingResults') || 'Failed to fetch quiz results.');
      } finally {
         setQuizFinished(true);
      }
    }
  }, [currentQuestionIndex, totalQuestionsInState, examId, t]); // Use totalQuestionsInState

  const handleAnswerSubmit = useCallback(async (selectedAnswers) => {
    if (!currentQuestion || !examId) return;
    setError('');

    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: selectedAnswers
    }));

    try {
      const result = await submitAnswer(examId, currentQuestion.id, selectedAnswers);
      setQuestionsForQuiz(prevQuestions =>
        prevQuestions.map(q =>
          q.id === currentQuestion.id
            ? { ...q, correctAnswer: result.correctAnswer, explanation: result.explanation }
            : q
        )
      );
    } catch (err) {
      console.error("Error submitting answer:", err);
      setError(t('errorSubmittingAnswer') || 'Failed to submit answer. Please try again.');
    }
  }, [currentQuestion, examId, t]);

  const handleToggleMark = useCallback(async (questionId) => {
    if (!examId) return;
    setError('');
    const isCurrentlyMarked = markedQuestions.has(questionId);

    setMarkedQuestions(prevMarked => {
      const newMarked = new Set(prevMarked);
      if (isCurrentlyMarked) {
        newMarked.delete(questionId);
      } else {
        newMarked.add(questionId);
      }
      return newMarked;
    });

    try {
      if (isCurrentlyMarked) {
        await unmarkQuestion(examId, questionId);
      } else {
        await markQuestion(examId, questionId);
      }
    } catch (err) {
      console.error(`Error ${isCurrentlyMarked ? 'unmarking' : 'marking'} question:`, err);
      setError(t('errorMarkingQuestion') || 'Failed to update bookmark status.');
      setMarkedQuestions(prevMarked => {
        const newMarked = new Set(prevMarked);
        if (isCurrentlyMarked) {
          newMarked.add(questionId);
        } else {
          newMarked.delete(questionId);
        }
        return newMarked;
      });
    }
  }, [markedQuestions, examId, t]);

  const progress = useMemo(() => {
    // Use total questions from state for progress calculation
    if (!quizStarted || totalQuestionsInState === 0) return 0;
    if (quizFinished) return 100;
    return (currentQuestionIndex / totalQuestionsInState) * 100;
  }, [currentQuestionIndex, totalQuestionsInState, quizStarted, quizFinished]); // Use totalQuestionsInState


  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 sm:p-6 lg:p-8 relative">
      {!quizStarted ? (
        <QuestionBankSelection onStartQuiz={handleStartQuiz} />
      ) : (
        <>
          <Header
            isQuizActive={quizStarted && !quizFinished}
            progress={progress}
          />

          {error && (
            <div className="w-full max-w-3xl mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
              <button onClick={() => setError('')} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
              </button>
            </div>
          )}

          {isLoadingQuestions ? (
            <div className="text-center text-textSecondary mt-10">
              <p>Loading questions...</p>
            </div>
          ) : quizFinished ? (
            <ResultsPage
              questions={questionsForQuiz}
              userAnswers={userAnswers}
              markedQuestions={markedQuestions}
              restartQuiz={resetToSelection}
              quizResults={quizResults} // Pass the updated results object
            />
          ) : currentQuestion ? (
            <QuizCard
              key={currentQuestion.id}
              examId={examId}
              questionData={currentQuestion}
              onNext={handleNextQuestion}
              onSubmit={handleAnswerSubmit}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={totalQuestionsInState} // Pass total questions from state
              submittedAnswer={userAnswers[currentQuestion.id]}
              onAskAI={() => setShowChat(true)}
              isMarked={markedQuestions.has(currentQuestion.id)}
              onToggleMark={() => handleToggleMark(currentQuestion.id)}
            />
          ) : !error ? (
             <div className="text-center text-textSecondary mt-10">
                <p>No questions available or quiz not started correctly.</p>
                <button onClick={resetToSelection} className="mt-4 text-primary hover:underline">
                    Go back to selection
                </button>
             </div>
          ) : null}

          {!quizFinished && currentQuestion && showChat && (
              <ChatOverlay
                isOpen={showChat}
                onClose={() => setShowChat(false)}
                currentQuestion={currentQuestion}
                examId={examId}
              />
          )}
        </>
      )}
    </div>
  );
}

export default AppWrapper;

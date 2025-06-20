/**
 * English translations
 */
const en = {
  common: {
    error: 'Error',
    back: 'Back',
    submit: 'Submit',
    next: 'Next',
    loading: 'Loading...',
    send: 'Send',
    cancel: 'Cancel',
    authenticate: 'Authenticate',
    language: 'Language',
    languageNames: {
      ko: '한국어',
      en: 'English',
      ja: '日本語',
      zh: '中文',
    },
  },
  home: {
    title: 'Quiz App',
    startQuiz: 'Start Quiz',
    questionBank: 'Question Bank',
    selectQuestionBank: 'Select Question Bank',
    selectQuestionBankPlaceholder: 'Select Question Bank...',
    numberOfQuestions: 'Number of Questions',
    selectNumberOfQuestions: 'Select Number of Questions',
    selectNumberOfQuestionsPlaceholder: 'Select number...',
    noOptionsAvailable: 'No options available',
    questions: 'questions',
    all: 'All',
    enterNumber: 'Enter number (e.g., 10)',
    max: 'Max',
    loadingQuestionBanks: 'Loading question banks...',
    errorSelectQuestionBank: 'Please select a question bank.',
    errorSelectValidNumber: 'Please select a valid number of questions.',
    quizSettings: 'Quiz Settings',
    uploadQuestions: 'Upload Questions',
    installApp: 'Install App',
    installPromptUnavailable: 'App install prompt not available right now. (May be already installed or unsupported browser.)',
    installPromptUnavailableDetailed: 'App install prompt not available (unsupported browser or already installed). On iPad/iPhone, use Share > Add to Home Screen.',
  },
  quiz: {
    question: 'Question',
    questionNumbering: 'Question {current} of {total}',
    askAI: 'Ask AI',
    submitAnswer: 'Submit',
    nextQuestion: 'Next Question',
    showResults: 'Show Results',
    markQuestion: 'Mark Question',
    unmarkQuestion: 'Unmark Question',
    mark: 'Mark',
    unmark: 'Unmark',
    pleaseSelectAnswer: 'Please select an answer.',
    errorSubmittingAnswer: 'Error submitting answer',
    errorLoadingQuestion: 'Cannot find current question information.',
    errorOccurred: 'An Error Occurred',
    errorLoadingOrSubmitting: 'There was a problem loading or submitting the question.',
    backToSettings: 'Back to Settings',
    noQuestionFound: 'No Question Found',
    couldNotFindQuestion: 'Could not find the current question data. Please try again.',
  },
  aiChat: {
    title: 'Ask AI',
    placeholder: 'Type your message...',
    send: 'Send',
    suggestedQuestions: 'Suggested Questions:',
    noSuggestedQuestions: 'No suggested questions available.',
    generatingResponse: 'Generating response...',
    errorTitle: 'AI Chat Error',
    errorMessage: 'An error occurred during the AI chat.',
    errorOccurred: 'Error occurred',
  },
  results: {
    title: 'Quiz Results',
    congratulations: 'Congratulations! You have completed all questions.',
    accuracy: 'Accuracy',
    answeredCorrectly: 'Answered {correct} out of {total} questions correctly',
    reviewIncorrectAndMarked: 'Review Incorrect & Marked Questions',
    startNewQuiz: 'Start New Quiz',
    aiFeedback: 'AI Feedback',
    examAnalysis: 'Exam Result Analysis and Advice',
    loadingAiSummary: 'Loading AI summary...',
    generatingReport: 'Generating learning feedback for you!',
    pleaseWait: 'Please wait a moment.',
    errorOccurred: 'An Error Occurred',
    errorLoadingResults: 'There was a problem loading the results.',
    noResultsFound: 'No Results Found',
    couldNotFindResults: 'Could not find quiz results. Please try again.',
    backToHome: 'Back to Home',
  },
  questionReview: {
    question: 'Question {number}',
    yourAnswer: 'Your Answer:',
    notAnswered: 'Not answered',
    correctAnswer: 'Correct Answer(s):',
    explanation: 'Explanation:',
    markedQuestions: 'Marked Questions',
    reviewIncorrectAnswers: 'Review Incorrect Answers',
    congratsAllCorrect: 'Congratulations! You answered all questions correctly and have no marked questions.',
    congratsAllCorrectWithMarked: 'You answered all questions correctly! You can review your marked questions above.',
    correct: 'Correct!',
    incorrect: 'Incorrect',
  },
  admin: {
    title: 'Admin: Upload Questions',
    description: 'Enter password to use admin features.',
    authenticatedDescription: 'Create a new question bank or select an existing one, and bulk upload questions in JSON format.',
    password: 'Admin Password',
    passwordPlaceholder: 'Enter password',
    authSuccess: 'Admin authentication successful!',
    authFailed: 'Authentication Failed',
    authError: 'An unknown error occurred.',
    authErrorDuringProcess: 'An error occurred during authentication.',
    authRequired: 'Authentication required.',
    authErrorDuringUpload: 'Authentication error: Upload aborted. Please authenticate again.',
    authErrorApiCall: 'Authentication error: API call failed. Please authenticate again.',
    bankSelection: '1. Select or Create Question Bank',
    loadingBanks: 'Loading question banks...',
    selectExistingBank: 'Select existing question bank...',
    noBanksAvailable: 'No question banks available',
    newBankTitle: 'New question bank title',
    createNewBank: 'Create new question bank',
    bankCreationSuccess: 'Question bank "{title}" created successfully!',
    bankCreationFailed: 'Failed to create question bank',
    bankCreationNoResponse: 'Question bank creation response is missing or invalid.',
    bankLoadingFailed: 'Failed to load question banks',
    jsonData: '2. Question Data (JSON)',
    jsonPlaceholder: '[{"question": "Question content...", "answers": [["Correct answer text", true], ["Incorrect answer text", false]], "explain": "Explanation content..."}, ...]',
    enterBankTitle: 'Please enter a title for the new question bank.',
    selectBank: 'Please select a question bank to upload to.',
    enterJsonData: 'Please enter question JSON data to upload.',
    jsonArrayRequired: 'JSON data must be an array.',
    jsonFormatError: 'Invalid format for item {index} in JSON array. Fields \'question\'(string), \'answers\'(array), and \'explain\'(string) are required.',
    jsonAnswerFormatError: 'Invalid format for \'answers\' item {ansIndex} in item {index} of JSON array. Format must be [string, boolean].',
    jsonParsingError: 'Invalid JSON format: {message}',
    jsonParsingErrorTitle: 'JSON parsing or validation error',
    noQuestionsToUpload: 'No questions to upload.',
    uploadProgress: 'Upload Progress',
    uploading: 'Uploading...',
    uploadQuestions: 'Upload Questions',
    uploadSuccess: 'Successfully uploaded {count} questions!',
    uploadPartialFailure: 'Failed to upload {errorCount} questions',
    uploadPartialFailureDetail: 'Uploaded {success} of {total} questions successfully, {error} failed. Check console log for details.',
    uploadFailureConsole: 'Failed to upload {count} questions. See console for details.',
    questions: 'questions',
  },
};

export default en;

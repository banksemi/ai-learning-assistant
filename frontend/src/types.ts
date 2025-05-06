import { CheckCircle, XCircle } from "lucide-react";


// Base Language Type
export type Language = 'ko' | 'en';

// --- API Specific Response/Request Types ---

// [GET] /api/1/question-banks
export interface ApiQuestionBank {
    question_bank_id: number;
    title: string;
    questions: number; // Total questions in the bank
}
export interface ApiQuestionBankListResponse {
    total: number;
    data: ApiQuestionBank[];
}

// [POST] /api/1/exams
export interface ApiExamCreationRequest {
    question_bank_id: number;
    language: Language;
    questions: number; // Number of questions for this exam session
}
export interface ApiExamCreationResponse {
    exam_id: number;
}

// [GET] /api/1/exams/{exam_id}/total_questions
export interface ApiTotalQuestionsResponse {
    total_questions: number;
}


// [GET] /api/1/exams/{exam_id}/questions/{question_id or index}
export interface ApiQuestionOption {
    key: string; // e.g., "A", "B"
    value: string; // Option text
}
export interface ApiQuestionResponse {
    question_id: number; // The actual ID of the question
    title: string; // Question text (can include markdown)
    answer_count: number; // 1 for single choice, >1 for multiple choice
    options: ApiQuestionOption[];
    marker: boolean; // Is the question bookmarked?
}

// [POST] /api/1/exams/{exam_id}/questions/{question_id}/answer
export interface ApiAnswerRequest {
    user_answers: string[]; // Array of selected option keys (e.g., ["A"], ["B", "C"])
}
export interface ApiAnswerResponse {
    actual_answers: string[]; // Array of correct option keys
    explanation: string; // Explanation text (can include markdown)
}

// [POST] /api/1/exams/{exam_id}/questions/{question_id}/chat/stream
export interface ApiChatRequest {
    user: string; // User's message
}
// Note: The response is now SSE, not a single JSON object.
// The final assembled message might still fit this structure,
// but the API function will handle streaming chunks (strings).
export interface ApiChatResponse {
    assistant: string; // AI's fully assembled response
}

// [GET] /api/1/exams/{exam_id}/questions/{question_id}/chat/preset (NEW)
export interface ApiPresetChatResponse {
    messages: string[];
}

// [GET] /api/1/exams/{exam_id}/result
interface ApiResultQuestionDetail {
    question_id: number;
    title: string;
    options: ApiQuestionOption[];
    user_answers: string[];
    actual_answers: string[];
    explanation: string;
}
export interface ApiResultResponse {
    correct_questions: number;
    total_questions: number;
    summary: string; // AI summary/advice
    questions: {
        marked: ApiResultQuestionDetail[];
        incorrect: ApiResultQuestionDetail[];
    };
}

// --- Frontend Internal Types (May need adjustments based on API mapping) ---

// Represents a question bank item in the frontend selector
export interface QuestionBank {
    id: number; // Use question_bank_id from API
    name: string; // Use title from API
    questions: number; // Add total questions in bank from API
}

// Represents a single option within a question in the frontend
export interface QuestionOption {
    id: string; // Use 'key' from API (e.g., "A")
    text: string; // Use 'value' from API
}

// Represents a question object used within the frontend quiz state
export interface Question {
    id: number; // Use question_id from API
    questionBankId?: number; // Optional: Link back to the bank if needed
    text: string; // Use title from API
    options: QuestionOption[]; // Mapped from API options
    correctAnswerIds: string[]; // Mapped from API actual_answers (after submission)
    explanation: string; // From API answer response
    type: 'single' | 'multiple'; // Determined by answer_count
    isMarked: boolean; // From API question response or local state
    userSelectedIds?: string[]; // Store user's selection locally after submission for review
    presetMessages?: string[] | null; // NEW: Store preloaded preset messages
}

// Settings chosen by the user to start the quiz
export interface QuizSettings {
    questionBankId: number;
    numberOfQuestions: number;
    language: Language;
}

// Represents the user's answer for a single question *during* the quiz
// (May be less critical if we rely on API for final results)
export interface UserAnswer {
    questionId: number;
    selectedOptionIds: string[]; // Keys like "A", "B"
    isCorrect: boolean; // Determined after checking against actual_answers
}

// Represents the final quiz results displayed on the results page
export interface QuizResult {
    settings: QuizSettings;
    score: number; // Calculated from API correct_questions / total_questions
    summary: string; // AI summary from API
    // Processed questions for review display
    markedQuestions: Question[]; // Mapped from API result questions.marked
    incorrectQuestions: Question[]; // Mapped from API result questions.incorrect
    // Add totalQuestions and correctCount from API response
    totalQuestions: number;
    correctCount: number;
    // We might not need 'answers' if result API provides all details
    // answers: UserAnswer[];
}

// Type for AI chat messages in the popup
export interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

// Type for SSE callbacks
export interface StreamCallbacks {
    onOpen?: () => void;
    onMessage: (chunk: string) => void;
    onError: (error: Event | string) => void;
    onClose?: () => void; // Called when server explicitly closes the stream
}

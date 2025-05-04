import axios from 'axios';
import {
    ApiQuestionBankListResponse,
    ApiExamCreationRequest,
    ApiExamCreationResponse,
    ApiQuestionResponse,
    ApiAnswerRequest,
    ApiAnswerResponse,
    ApiChatRequest,
    ApiChatResponse,
    ApiResultResponse,
    ApiTotalQuestionsResponse,
    Language,
    ApiQuestionOption, // Import ApiQuestionOption
} from '@/types';

// --- Read API URL from global config ---
// Declare the global config object for TypeScript
declare global {
  interface Window {
    config?: {
      API_BASE_URL?: string;
    };
  }
}

// Read from window.config, fallback to Vite env var (for safety during dev), then hardcoded default
const API_BASE_URL = window.config?.API_BASE_URL;

// Log which URL is being used
if (window.config?.API_BASE_URL) {
    console.log("Using API URL from config.js:", API_BASE_URL);
} else if (import.meta.env.VITE_API_BASE_URL) {
    console.warn(
        "Using API URL from Vite environment variable (VITE_API_BASE_URL). config.js might be missing or empty.",
        API_BASE_URL
    );
} else {
     console.error(
        "API URL not found in config.js or Vite env vars. Using hardcoded default:",
        API_BASE_URL
    );
}
// --- End of API URL reading ---


const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Error Handling Helper ---
const handleApiError = (error: unknown, context: string) => {
    console.error(`API Error in ${context}:`, error);
    if (axios.isAxiosError(error)) {
        if (error.response) {
            // Extract specific error message from API if available
            const apiError = error.response.data as { error_code?: string; message?: string };
            // Include status code for context
            throw new Error(`API Error (${error.response.status}) in ${context}: ${apiError.message || error.message}`);
        } else if (error.request) {
            // Request was made but no response received
            throw new Error(`API Error in ${context}: No response received from server.`);
        } else {
            // Something happened in setting up the request
            throw new Error(`API Error in ${context}: ${error.message}`);
        }
    } else if (error instanceof Error) {
        throw new Error(`Error during ${context}: ${error.message}`);
    } else {
        throw new Error(`An unknown error occurred during ${context}`);
    }
};

// --- API Service Functions ---

export const getQuestionBanks = async (): Promise<ApiQuestionBankListResponse> => {
    try {
        const response = await apiClient.get<ApiQuestionBankListResponse>('/question-banks');
        return response.data;
    } catch (error) {
        handleApiError(error, 'getQuestionBanks');
        // Return a default structure or rethrow, depending on desired handling
        return { total: 0, data: [] }; // Example default
    }
};

export const createExam = async (data: ApiExamCreationRequest): Promise<ApiExamCreationResponse> => {
    try {
        const response = await apiClient.post<ApiExamCreationResponse>('/exams', data);
        return response.data;
    } catch (error) {
        handleApiError(error, 'createExam');
        throw error; // Rethrow after logging/handling
    }
};

export const getTotalQuestions = async (examId: number): Promise<ApiTotalQuestionsResponse> => {
    try {
        const response = await apiClient.get<ApiTotalQuestionsResponse>(`/exams/${examId}/total_questions`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'getTotalQuestions');
        throw error;
    }
};


// Fetch question by *index* (assuming backend maps index to ID for the exam)
export const getQuestion = async (examId: number, questionIndex: number): Promise<ApiQuestionResponse> => {
    try {
        // Using index in the URL as discussed
        const response = await apiClient.get<ApiQuestionResponse>(`/exams/${examId}/questions/${questionIndex}`);
        return response.data;
    } catch (error) {
        handleApiError(error, `getQuestion (index: ${questionIndex})`);
        throw error;
    }
};

export const submitAnswer = async (examId: number, questionId: number, data: ApiAnswerRequest): Promise<ApiAnswerResponse> => {
    try {
        const response = await apiClient.post<ApiAnswerResponse>(`/exams/${examId}/questions/${questionId}/answer`, data);
        return response.data;
    } catch (error) {
        handleApiError(error, `submitAnswer (questionId: ${questionId})`);
        throw error;
    }
};

export const toggleMarker = async (examId: number, questionId: number, mark: boolean): Promise<void> => {
    const url = `/exams/${examId}/questions/${questionId}/marker`;
    try {
        if (mark) {
            await apiClient.post(url);
        } else {
            await apiClient.delete(url);
        }
    } catch (error) {
        handleApiError(error, `toggleMarker (mark: ${mark}, questionId: ${questionId})`);
        throw error;
    }
};

export const postChatMessage = async (examId: number, questionId: number, data: ApiChatRequest): Promise<ApiChatResponse> => {
    try {
        const response = await apiClient.post<ApiChatResponse>(`/exams/${examId}/questions/${questionId}/chat`, data);
        return response.data;
    } catch (error) {
        handleApiError(error, `postChatMessage (questionId: ${questionId})`);
        throw error;
    }
};

export const getResults = async (examId: number): Promise<ApiResultResponse> => {
    try {
        const response = await apiClient.get<ApiResultResponse>(`/exams/${examId}/result`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'getResults');
        throw error;
    }
};

// --- Admin Functions ---

// [POST] /api/1/login (Admin Authentication)
export const loginAdmin = async (password: string): Promise<boolean> => {
    try {
        await apiClient.post('/login', { password });
        // If the request succeeds (status 2xx), return true
        return true;
    } catch (error) {
        // Check specifically for 403 Forbidden or other relevant error codes
        if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
             // Throw a specific error for invalid password
             throw new Error("Invalid password.");
        }
        // Handle other errors (network issues, server errors)
        handleApiError(error, 'loginAdmin');
        // Rethrow or return false depending on desired behavior for other errors
        throw error; // Rethrow other errors by default
    }
};


// Helper to get Basic Auth header using the provided password
const getAdminAuthHeader = (password: string) => {
    // WARNING: Transmitting password like this is insecure!
    try {
        const credentials = btoa(`admin:${password}`); // Use the provided password
        return { Authorization: `Basic ${credentials}` };
    } catch (e) {
        console.error("Error encoding admin credentials:", e);
        return {};
    }
};

// [POST] /api/1/question-banks (Admin)
// Accepts password as an argument
export const createQuestionBankAdmin = async (title: string, password: string): Promise<{ question_bank_id: number } | null> => {
    try {
        const response = await apiClient.post<{ question_bank_id: number }>(
            '/question-banks',
            { title },
            { headers: getAdminAuthHeader(password) } // Pass password to header helper
        );
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
            throw new Error(`Question bank "${title}" already exists.`);
        }
        // Check for 401/403 specifically for auth failure
        if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
            throw new Error(`Authentication failed. Invalid password.`);
        }
        handleApiError(error, 'createQuestionBankAdmin');
        throw error;
    }
};

// Interface for the NEW expected structure of a single question upload
interface ApiQuestionUploadData {
    title: string; // Changed from 'text'
    correct_answers: string[]; // New field
    incorrect_answers: string[]; // New field
    explanation?: string; // Explanation is now part of the request (optional)
}

// [POST] /api/1/question-banks/{question_bank_id}/questions (Admin)
// Accepts password as an argument
// Updated function signature and request body
export const uploadSingleQuestionAdmin = async (questionBankId: number, questionData: ApiQuestionUploadData, password: string): Promise<void> => {
    try {
        await apiClient.post(
            `/question-banks/${questionBankId}/questions`,
            questionData, // Send the new data structure directly (now includes explanation)
            { headers: getAdminAuthHeader(password) } // Pass password to header helper
        );
    } catch (error) {
         // Check for 401/403 specifically for auth failure
         if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
            throw new Error(`Authentication failed. Invalid password.`);
        }
        handleApiError(error, `uploadSingleQuestionAdmin (bankId: ${questionBankId})`);
        throw error;
    }
};


export default apiClient;

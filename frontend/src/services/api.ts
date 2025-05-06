import axios from 'axios';
import {
    ApiQuestionBankListResponse,
    ApiExamCreationRequest,
    ApiExamCreationResponse,
    ApiQuestionResponse,
    ApiAnswerRequest,
    ApiAnswerResponse,
    ApiChatRequest,
    // ApiChatResponse, // No longer used for stream response directly
    ApiResultResponse,
    ApiTotalQuestionsResponse,
    Language,
    ApiQuestionOption,
    ApiPresetChatResponse,
    StreamCallbacks, // Import StreamCallbacks type
} from '@/types';

// --- Read API URL from global config ---
declare global {
  interface Window {
    config?: {
      API_BASE_URL?: string;
    };
  }
}
const API_BASE_URL = window.config?.API_BASE_URL;

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

// --- Error Handling Helper (for non-streaming requests) ---
const handleApiError = (error: unknown, context: string) => {
    console.error(`API Error in ${context}:`, error);
    if (axios.isAxiosError(error)) {
        if (error.response) {
            const apiError = error.response.data as { error_code?: string; message?: string };
            throw new Error(`API Error (${error.response.status}) in ${context}: ${apiError.message || error.message}`);
        } else if (error.request) {
            throw new Error(`API Error in ${context}: No response received from server.`);
        } else {
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
        return { total: 0, data: [] };
    }
};

export const createExam = async (data: ApiExamCreationRequest): Promise<ApiExamCreationResponse> => {
    try {
        const response = await apiClient.post<ApiExamCreationResponse>('/exams', data);
        return response.data;
    } catch (error) {
        handleApiError(error, 'createExam');
        throw error;
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

export const getQuestion = async (examId: number, questionIndex: number): Promise<ApiQuestionResponse> => {
    try {
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

// --- NEW: Chat Streaming Function using native EventSource ---
export const postChatMessageStream = (
    examId: number,
    questionId: number,
    data: ApiChatRequest,
    callbacks: StreamCallbacks
): EventSource | null => {
    // Construct the URL for the POST request that initiates the stream
    // Note: EventSource itself uses GET, but we need POST to send the initial message.
    // We'll use fetch for the initial POST, then potentially EventSource if the server redirects
    // or provides a specific SSE endpoint URL in response.
    // **Correction:** EventSource *can* be used with POST if the server supports it,
    // but it's non-standard and requires server configuration.
    // A more common pattern is:
    // 1. POST request to initiate the chat and get a stream ID or URL.
    // 2. Use EventSource with GET on the returned stream URL.
    // **Assuming the current endpoint `/chat/stream` directly handles POST for SSE:**
    // We *cannot* use native EventSource directly with POST in a standard way.
    // The previous `fetch` implementation is the correct approach for POST-based SSE.

    // **Reverting to the fetch-based implementation as native EventSource doesn't support POST easily.**
    // Let's stick with the fetch implementation and ensure its parsing is robust.

    const url = `${API_BASE_URL}/exams/${examId}/questions/${questionId}/chat/stream`;

    try {
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
            },
            body: JSON.stringify(data),
            // Consider adding signal for AbortController if explicit closing is needed
        }).then(response => {
            if (!response.ok) {
                response.text().then(text => {
                    console.error(`SSE HTTP Error ${response.status}:`, text);
                    callbacks.onError(`HTTP Error ${response.status}: ${text || response.statusText}`);
                }).catch(() => {
                    callbacks.onError(`HTTP Error ${response.status}: ${response.statusText}`);
                });
                return;
            }

            if (!response.body) {
                callbacks.onError("Response body is null");
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            callbacks.onOpen?.();

            function processBuffer() {
                // Process buffer line by line for SSE messages ('data: ...\n\n')
                let eventEndIndex;
                while ((eventEndIndex = buffer.indexOf('\n\n')) !== -1) {
                    const eventText = buffer.substring(0, eventEndIndex);
                    buffer = buffer.substring(eventEndIndex + 2); // Consume the event and the delimiter

                    // Extract data field(s) from the event block
                    const lines = eventText.split('\n');
                    let eventDataString = ''; // Store the raw string data
                    for (const line of lines) {
                        if (line.startsWith('data:')) {
                            // Append data, handling potential multi-line data fields
                            eventDataString += line.substring(5).trim() + '\n'; // Add newline if server sends multi-line data
                        }
                        // Ignore other fields like 'id:', 'event:', 'retry:' for now
                    }

                    // Trim trailing newline if added
                    eventDataString = eventDataString.trimEnd();

                    if (eventDataString) {
                        try {
                            // **MODIFICATION: Parse the data string as JSON**
                            const jsonData = JSON.parse(eventDataString);
                            // **MODIFICATION: Extract the 'assistant' field**
                            const assistantChunk = jsonData?.assistant;

                            if (typeof assistantChunk === 'string') {
                                // Pass the extracted assistant message chunk
                                callbacks.onMessage(assistantChunk);
                            } else {
                                console.warn("SSE data received, but 'assistant' field is missing or not a string:", jsonData);
                            }
                        } catch (parseError) {
                            console.error("SSE JSON parsing error:", parseError, "Raw data:", eventDataString);
                            // Decide how to handle parsing errors: skip, call onError, etc.
                            // callbacks.onError("Failed to parse SSE data as JSON");
                        }
                    }
                }
            }

            function push() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        // Process any remaining buffer content when the stream ends
                        processBuffer();
                        console.log("SSE stream finished.");
                        callbacks.onClose?.();
                        return;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    processBuffer(); // Process the updated buffer

                    // Continue reading
                    push();
                }).catch(error => {
                    console.error("SSE stream reading error:", error);
                    callbacks.onError(error.message || "Stream reading error");
                });
            }

            push();

        }).catch(error => {
            console.error("SSE fetch initiation error:", error);
            callbacks.onError(error.message || "Failed to initiate SSE connection");
        });

        // Cannot return EventSource with fetch. Manage lifecycle via callbacks/AbortController.
        return null;

    } catch (error: any) {
        console.error("Error setting up SSE fetch:", error);
        callbacks.onError(error.message || "Error setting up SSE connection");
        return null;
    }
};
// --- End of Chat Streaming Function ---


export const getPresetChatMessages = async (examId: number, questionId: number): Promise<ApiPresetChatResponse> => {
    try {
        const response = await apiClient.get<ApiPresetChatResponse>(`/exams/${examId}/questions/${questionId}/chat/preset`);
        return response.data;
    } catch (error) {
        handleApiError(error, `getPresetChatMessages (questionId: ${questionId})`);
        return { messages: [] };
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

export const loginAdmin = async (password: string): Promise<boolean> => {
    try {
        await apiClient.post('/login', { password });
        return true;
    } catch (error) {
        if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
             throw new Error("Invalid password.");
        }
        handleApiError(error, 'loginAdmin');
        throw error;
    }
};

const getAdminAuthHeader = (password: string) => {
    try {
        const credentials = btoa(`admin:${password}`);
        return { Authorization: `Basic ${credentials}` };
    } catch (e) {
        console.error("Error encoding admin credentials:", e);
        return {};
    }
};

export const createQuestionBankAdmin = async (title: string, password: string): Promise<{ question_bank_id: number } | null> => {
    try {
        const response = await apiClient.post<{ question_bank_id: number }>(
            '/question-banks',
            { title },
            { headers: getAdminAuthHeader(password) }
        );
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
            throw new Error(`Question bank "${title}" already exists.`);
        }
        if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
            throw new Error(`Authentication failed. Invalid password.`);
        }
        handleApiError(error, 'createQuestionBankAdmin');
        throw error;
    }
};

interface ApiQuestionUploadData {
    title: string;
    correct_answers: string[];
    incorrect_answers: string[];
    explanation?: string;
}

export const uploadSingleQuestionAdmin = async (questionBankId: number, questionData: ApiQuestionUploadData, password: string): Promise<void> => {
    try {
        await apiClient.post(
            `/question-banks/${questionBankId}/questions`,
            questionData,
            { headers: getAdminAuthHeader(password) }
        );
    } catch (error) {
         if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
            throw new Error(`Authentication failed. Invalid password.`);
        }
        handleApiError(error, `uploadSingleQuestionAdmin (bankId: ${questionBankId})`);
        throw error;
    }
};


export default apiClient;

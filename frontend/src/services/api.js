import axios from 'axios';

// API 기본 URL 설정 (환경 변수 사용, 없으면 기본값 사용)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/1';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 사용 가능한 문제 은행 목록을 가져옵니다.
 * @returns {Promise<Array<{id: number, name: string, count: number}>>} 문제 은행 목록 Promise
 */
export const getQuestionBanks = async () => {
  try {
    const response = await apiClient.get('/question-banks');
    const formattedData = response.data.data.map(bank => ({
      id: bank.question_bank_id,
      name: bank.text,
      count: bank.questions,
    }));
    console.log("Fetched Question Banks:", formattedData);
    return formattedData;
  } catch (error) {
    console.error('Error fetching question banks:', error);
    throw error;
  }
};

/**
 * 새로운 시험 세션을 생성합니다.
 * @param {number} questionBankId - 선택된 문제 은행 ID
 * @param {string} language - 선택된 언어 ('en', 'ko' 등)
 * @param {number} numQuestions - 요청할 문제 수
 * @returns {Promise<number>} 생성된 시험 ID Promise
 */
export const createExam = async (questionBankId, language, numQuestions) => {
    try {
        const response = await apiClient.post('/exams', {
            question_bank_id: questionBankId,
            language: language,
            questions: numQuestions,
        });
        console.log("Created Exam:", response.data);
        return response.data.exam_id;
    } catch (error) {
        console.error('Error creating exam:', error);
        throw error;
    }
};

/**
 * 지정된 시험의 모든 문제를 가져옵니다.
 * @param {number} examId - 시험 ID
 * @returns {Promise<Array<object>>} 문제 목록 Promise (프론트엔드 형식으로 변환됨)
 */
export const getExamQuestions = async (examId) => {
  try {
    const response = await apiClient.get(`/exams/${examId}/questions`);
    // API 응답 형식을 프론트엔드에서 사용하는 형식으로 변환
    const formattedData = response.data.data.map((q, index) => ({
      id: q.question_id, // API의 question_id 사용
      // bankId: 'api-loaded', // 필요하다면 bankId 추가
      type: q.answer_count > 1 ? 'multiple' : 'single', // answer_count로 타입 결정
      question: q.text,
      // API 옵션(문자열 배열)을 프론트엔드 형식(객체 배열)으로 변환
      options: q.options.map((optionText, optionIndex) => ({
        // API 응답에 옵션 ID가 없으므로, 알파벳 등으로 생성 (A, B, C...)
        id: String.fromCharCode(65 + optionIndex), // 'A', 'B', 'C'...
        text: optionText,
      })),
      // correctAnswer와 explanation은 submitAnswer 후에 채워짐 (초기값 null 또는 빈 배열)
      correctAnswer: null, // 초기에는 정답 정보 없음
      explanation: null,   // 초기에는 설명 정보 없음
    }));
    console.log("Fetched Exam Questions:", formattedData);
    return formattedData;
  } catch (error) {
    console.error(`Error fetching questions for exam ${examId}:`, error);
    throw error;
  }
};

/**
 * 특정 문제에 대한 사용자 답변을 제출하고 정답과 설명을 받습니다.
 * @param {number} examId - 시험 ID
 * @param {number} questionId - 문제 ID
 * @param {Array<string>} userAnswers - 사용자가 선택한 답변 ID 배열 (e.g., ['A', 'C'])
 * @returns {Promise<{correctAnswer: Array<string>, explanation: string}>} 정답 및 설명 Promise
 */
export const submitAnswer = async (examId, questionId, userAnswers) => {
  try {
    const response = await apiClient.post(`/exams/${examId}/questions/${questionId}/answer`, {
      user_answers: userAnswers, // API 요청 형식에 맞게 전송
    });
    console.log(`Submitted Answer for Q${questionId}:`, response.data);
    // API 응답에서 필요한 정보만 추출하여 반환
    return {
      correctAnswer: response.data.actual_answers, // API의 actual_answers 사용
      explanation: response.data.explanation,
    };
  } catch (error) {
    console.error(`Error submitting answer for exam ${examId}, question ${questionId}:`, error);
    throw error;
  }
};

/**
 * 특정 문제를 북마크합니다.
 * @param {number} examId - 시험 ID
 * @param {number} questionId - 문제 ID
 * @returns {Promise<void>}
 */
export const markQuestion = async (examId, questionId) => {
  try {
    await apiClient.post(`/exams/${examId}/questions/${questionId}/marker`);
    console.log(`Marked question ${questionId} for exam ${examId}`);
  } catch (error) {
    console.error(`Error marking question ${questionId} for exam ${examId}:`, error);
    throw error;
  }
};

/**
 * 특정 문제의 북마크를 해제합니다.
 * @param {number} examId - 시험 ID
 * @param {number} questionId - 문제 ID
 * @returns {Promise<void>}
 */
export const unmarkQuestion = async (examId, questionId) => {
  try {
    await apiClient.delete(`/exams/${examId}/questions/${questionId}/marker`);
    console.log(`Unmarked question ${questionId} for exam ${examId}`);
  } catch (error) {
    console.error(`Error unmarking question ${questionId} for exam ${examId}:`, error);
    throw error;
  }
};

/**
 * AI 챗봇과 대화합니다.
 * @param {number} examId - 시험 ID
 * @param {number} questionId - 현재 문제 ID
 * @param {string} userMessage - 사용자 메시지
 * @returns {Promise<string>} AI 응답 메시지 Promise
 */
export const chatWithAI = async (examId, questionId, userMessage) => {
  try {
    const response = await apiClient.post(`/exams/${examId}/questions/${questionId}/chat`, {
      user: userMessage, // API 요청 형식에 맞게 'user' 키 사용
    });
    console.log(`Chat response for Q${questionId}:`, response.data);
    return response.data.assistant; // API 응답의 'assistant' 필드 반환
  } catch (error) {
    console.error(`Error chatting with AI for exam ${examId}, question ${questionId}:`, error);
    throw error;
  }
};

/**
 * 시험 결과를 가져옵니다.
 * @param {number} examId - 시험 ID
 * @returns {Promise<{correctQuestions: number, totalQuestions: number, summary: string}>} 시험 결과 Promise
 */
export const getExamResult = async (examId) => {
  try {
    const response = await apiClient.get(`/exams/${examId}/result`);
    console.log(`Fetched results for exam ${examId}:`, response.data);
    // Return the new fields from the API response
    return {
      correctQuestions: response.data.correct_questions,
      totalQuestions: response.data.total_questions,
      summary: response.data.summary,
    };
  } catch (error) {
    console.error(`Error fetching results for exam ${examId}:`, error);
    throw error;
  }
};

// 기본 apiClient 인스턴스 export (선택 사항)
// export default apiClient;

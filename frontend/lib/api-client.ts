// API 클라이언트 함수들

// API 기본 URL (환경 변수에서 가져오거나 기본값 사용)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"

// 디버깅 활성화
const DEBUG = true

// 에러 핸들링 헬퍼 함수
const handleApiError = (error: any) => {
  console.error("API Error:", error)
  throw error
}

// API 요청 로깅 함수
const logApiRequest = (method: string, url: string, body?: any) => {
  if (DEBUG) {
    console.log(`🔷 API ${method} 요청: ${url}`, body ? { body } : "")
  }
}

// API 응답 로깅 함수
const logApiResponse = (method: string, url: string, response: any) => {
  if (DEBUG) {
    console.log(`✅ API ${method} 응답: ${url}`, response)
  }
}

// 문제 은행 목록 가져오기 API 추가
export async function getQuestionBanks() {
  const url = `${API_BASE_URL}/api/1/question-banks`
  logApiRequest("GET", url)

  try {
    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API 오류 (${response.status}): ${errorText}`)
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    logApiResponse("GET", url, data)
    return data
  } catch (error) {
    handleApiError(error)
  }
}

// 시험 생성 API 수정
export async function createExam(params: { question_bank_id: number; language: string; questions: number }) {
  const url = `${API_BASE_URL}/api/1/exams`
  logApiRequest("POST", url, params)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API 오류 (${response.status}): ${errorText}`)
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    logApiResponse("POST", url, data)
    return data
  } catch (error) {
    handleApiError(error)
  }
}

// 시험 문제 가져오기 API
export async function getExamQuestions(examId: number) {
  const url = `${API_BASE_URL}/api/1/exams/${examId}/questions`
  logApiRequest("GET", url)

  try {
    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API 오류 (${response.status}): ${errorText}`)
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    logApiResponse("GET", url, data)
    return data
  } catch (error) {
    handleApiError(error)
  }
}

// 문제 답변 제출 API
export async function submitAnswer(examId: number, questionId: number, userAnswers: string[]) {
  const url = `${API_BASE_URL}/api/1/exams/${examId}/questions/${questionId}/answer`
  logApiRequest("POST", url, { user_answers: userAnswers })

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_answers: userAnswers }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API 오류 (${response.status}): ${errorText}`)
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    logApiResponse("POST", url, data)
    return data
  } catch (error) {
    handleApiError(error)
  }
}

// 북마크 추가 API
export async function addBookmark(examId: number, questionId: number) {
  const url = `${API_BASE_URL}/api/1/exams/${examId}/questions/${questionId}/marker`
  logApiRequest("POST", url)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API 오류 (${response.status}): ${errorText}`)
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    logApiResponse("POST", url, data)
    return data
  } catch (error) {
    handleApiError(error)
  }
}

// 북마크 제거 API
export async function removeBookmark(examId: number, questionId: number) {
  const url = `${API_BASE_URL}/api/1/exams/${examId}/questions/${questionId}/marker`
  logApiRequest("DELETE", url)

  try {
    const response = await fetch(url, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API 오류 (${response.status}): ${errorText}`)
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    logApiResponse("DELETE", url, data)
    return data
  } catch (error) {
    handleApiError(error)
  }
}

// AI 채팅 API
export async function sendChatMessage(examId: number, questionId: number, userMessage: string) {
  const url = `${API_BASE_URL}/api/1/exams/${examId}/questions/${questionId}/chat`
  logApiRequest("POST", url, { user: userMessage })

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user: userMessage }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API 오류 (${response.status}): ${errorText}`)
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    logApiResponse("POST", url, data)
    return data
  } catch (error) {
    handleApiError(error)
  }
}

// 시험 결과 가져오기 API
export async function getExamResult(examId: number) {
  const url = `${API_BASE_URL}/api/1/exams/${examId}/result`
  logApiRequest("GET", url)

  try {
    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API 오류 (${response.status}): ${errorText}`)
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    logApiResponse("GET", url, data)
    return data
  } catch (error) {
    handleApiError(error)
  }
}

// 타입 정의

export interface Question {
  question_id: number
  text: string
  answer_count: number
  options: string[]
  // 클라이언트 측에서 추가로 관리하는 상태
  isMarked?: boolean
  userAnswers?: string[]
  isSubmitted?: boolean
  actualAnswers?: string[]
  explanation?: string
}

export interface ExamQuestions {
  total: number
  data: Question[]
}

export interface ExamResult {
  correct_rate: number
  summary: string
}

export interface AnswerResponse {
  actual_answers: string[]
  explanation: string
}

export interface ChatResponse {
  assistant: string
}

export interface Message {
  role: "user" | "assistant"
  content: string
}

// 문제 은행 타입 추가
export interface QuestionBank {
  question_bank_id: number
  text: string
  questions: number
}

export interface QuestionBanksResponse {
  total: number
  data: QuestionBank[]
}

// 시험 생성 파라미터 타입 추가
export interface CreateExamParams {
  question_bank_id: number
  language: string
  questions: number
}

"use client"

import { useState, useEffect, useRef } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  ChevronRight,
  Globe,
  MessageSquare,
  X,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Markdown } from "@/components/markdown"
import { AIChatDialog } from "@/components/ai-chat-dialog"
import {
  createExam,
  getExamQuestions,
  submitAnswer,
  addBookmark,
  removeBookmark,
  getExamResult,
} from "@/lib/api-client"
import type { Question, ExamResult } from "@/types/quiz"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ExamSetup } from "@/components/exam-setup"
import type { CreateExamParams } from "@/types/quiz"

export default function QuizApp() {
  const [examId, setExamId] = useState<number | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [language, setLanguage] = useState("ko")
  const [showAIChat, setShowAIChat] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [examResult, setExamResult] = useState<ExamResult | null>(null)
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState({
    init: false,
    submit: false,
    bookmark: false,
    result: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [examSetupCompleted, setExamSetupCompleted] = useState(false)
  const [isTimedOut, setIsTimedOut] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isMobile = useMediaQuery("(max-width: 768px)")

  // 현재 문제
  const currentQuestion = questions[currentQuestionIndex] || null

  // 시험 초기화 함수 수정
  const initializeExam = async (params: CreateExamParams) => {
    try {
      setLoading((prev) => ({ ...prev, init: true }))
      setError(null)
      setIsTimedOut(false)

      // 타임아웃 설정 (15초)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setIsTimedOut(true)
        setLoading((prev) => ({ ...prev, init: false }))
      }, 15000)

      // 시험 생성
      const examResponse = await createExam(params)
      const newExamId = examResponse.exam_id
      setExamId(newExamId)

      // 문제 가져오기
      const questionsResponse = await getExamQuestions(newExamId)

      // 타임아웃 취소
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      setQuestions(questionsResponse.data)
      setExamSetupCompleted(true)
      setLoading((prev) => ({ ...prev, init: false }))
    } catch (err) {
      // 타임아웃 취소
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      setError("시험을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.")
      setLoading((prev) => ({ ...prev, init: false }))
      console.error("Failed to initialize exam:", err)
    }
  }

  // 진행 상황 업데이트
  useEffect(() => {
    if (questions.length > 0) {
      setProgress(((currentQuestionIndex + 1) / questions.length) * 100)
    }

    // 컴포넌트 언마운트 시 타임아웃 정리
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [currentQuestionIndex, questions.length])

  // 답변 선택 처리
  const handleAnswerSelect = (optionIndex: number) => {
    if (isSubmitted || !currentQuestion) return

    const optionId = String.fromCharCode(65 + optionIndex) // A, B, C, D, E로 변환

    if (currentQuestion.answer_count > 1) {
      // 다중 선택
      setSelectedAnswers((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
      )
    } else {
      // 단일 선택
      setSelectedAnswers([optionId])
    }
  }

  // 답변 제출 처리
  const handleSubmit = async () => {
    if (!examId || !currentQuestion || selectedAnswers.length === 0) return

    try {
      setLoading((prev) => ({ ...prev, submit: true }))
      setError(null)

      // 답변 제출
      const response = await submitAnswer(examId, currentQuestion.question_id, selectedAnswers)

      // 문제 상태 업데이트
      const updatedQuestions = [...questions]
      updatedQuestions[currentQuestionIndex] = {
        ...currentQuestion,
        isSubmitted: true,
        userAnswers: selectedAnswers,
        actualAnswers: response.actual_answers,
        explanation: response.explanation,
      }

      setQuestions(updatedQuestions)
      setIsSubmitted(true)
      setLoading((prev) => ({ ...prev, submit: false }))
    } catch (err) {
      setError("답변을 제출하는 중 오류가 발생했습니다.")
      setLoading((prev) => ({ ...prev, submit: false }))
      console.error("Failed to submit answer:", err)
    }
  }

  // 다음 문제로 이동
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedAnswers([])
      setIsSubmitted(false)
    } else {
      // 모든 문제 완료
      handleCompleteExam()
    }
  }

  // 시험 완료 처리
  const handleCompleteExam = async () => {
    if (!examId) return

    try {
      setLoading((prev) => ({ ...prev, result: true }))
      setError(null)

      // 결과 가져오기
      const result = await getExamResult(examId)

      setExamResult(result)
      setIsCompleted(true)

      setLoading((prev) => ({ ...prev, result: false }))
    } catch (err) {
      setError("결과를 가져오는 중 오류가 발생했습니다.")
      setLoading((prev) => ({ ...prev, result: false }))
      console.error("Failed to get exam result:", err)
    }
  }

  // 북마크 토글
  const toggleBookmark = async () => {
    if (!examId || !currentQuestion) return

    try {
      setLoading((prev) => ({ ...prev, bookmark: true }))
      setError(null)

      const isCurrentlyMarked = currentQuestion.isMarked

      // 북마크 추가 또는 제거
      if (isCurrentlyMarked) {
        await removeBookmark(examId, currentQuestion.question_id)
      } else {
        await addBookmark(examId, currentQuestion.question_id)
      }

      // 문제 상태 업데이트
      const updatedQuestions = [...questions]
      updatedQuestions[currentQuestionIndex] = {
        ...currentQuestion,
        isMarked: !isCurrentlyMarked,
      }

      setQuestions(updatedQuestions)
      setLoading((prev) => ({ ...prev, bookmark: false }))
    } catch (err) {
      setError("북마크를 변경하는 중 오류가 발생했습니다.")
      setLoading((prev) => ({ ...prev, bookmark: false }))
      console.error("Failed to toggle bookmark:", err)
    }
  }

  // 설명 토글
  const toggleExplanation = (questionId: string) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }))
  }

  // 시험 다시 시작 함수 수정
  const resetQuiz = () => {
    setExamId(null)
    setQuestions([])
    setCurrentQuestionIndex(0)
    setSelectedAnswers([])
    setIsSubmitted(false)
    setIsCompleted(false)
    setExamResult(null)
    setExpandedExplanations({})
    setProgress(0)
    setError(null)
    setExamSetupCompleted(false)
    setIsTimedOut(false)
  }

  // 틀린 문제 필터링
  const incorrectQuestions = questions.filter(
    (q) => q.isSubmitted && q.userAnswers && q.actualAnswers && !areAnswersEqual(q.userAnswers, q.actualAnswers),
  )

  // 북마크된 문제 필터링
  const markedQuestions = questions.filter((q) => q.isMarked)

  // 답변 비교 헬퍼 함수
  function areAnswersEqual(userAnswers: string[], actualAnswers: string[]) {
    if (userAnswers.length !== actualAnswers.length) return false
    return userAnswers.every((a) => actualAnswers.includes(a)) && actualAnswers.every((a) => userAnswers.includes(a))
  }

  // 로딩 중 표시
  if (loading.init) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-center text-gray-600 dark:text-gray-400">문제를 불러오는 중입니다...</p>

        {isTimedOut && (
          <div className="mt-8 w-full max-w-md">
            <Alert
              variant="warning"
              className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
            >
              <AlertTitle className="text-yellow-800 dark:text-yellow-300">API 응답 시간 초과</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-200">
                서버 응답이 너무 오래 걸립니다. API 서버가 실행 중인지 확인하세요.
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-yellow-300 dark:border-yellow-700"
                  onClick={resetQuiz}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  다시 시도
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    )
  }

  // 에러 표시
  if (error) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-10">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>오류 발생</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={resetQuiz}>다시 시도</Button>
      </div>
    )
  }

  // 렌더링 부분 수정 - 로딩 상태 체크 전에 examSetupCompleted 체크
  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 md:py-10">
      {!examSetupCompleted ? (
        <ExamSetup onStartExam={initializeExam} />
      ) : !isCompleted ? (
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AWS 자격증 문제</h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  문제 {currentQuestionIndex + 1} / {questions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setLanguage(language === "ko" ? "en" : "ko")}
              >
                <Globe className="h-4 w-4" />
                <span className="hidden md:inline">{language === "ko" ? "한국어" : "English"}</span>
                <span className="md:hidden">{language === "ko" ? "KO" : "EN"}</span>
              </Button>
            </div>
          </div>

          <Progress value={progress} className="h-2" />

          {currentQuestion && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-5 md:p-6">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-start gap-2">
                    <Badge variant={currentQuestion.answer_count > 1 ? "secondary" : "outline"} className="mt-1">
                      {currentQuestion.answer_count > 1 ? "다중 선택" : "단일 선택"}
                    </Badge>
                    <div className="flex-1">
                      <Markdown content={currentQuestion.text} />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${currentQuestion.isMarked ? "text-yellow-500" : "text-gray-400"}`}
                    onClick={toggleBookmark}
                    disabled={loading.bookmark}
                  >
                    {loading.bookmark ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : currentQuestion.isMarked ? (
                      <BookmarkCheck className="h-5 w-5" />
                    ) : (
                      <Bookmark className="h-5 w-5" />
                    )}
                    <span className="sr-only">{currentQuestion.isMarked ? "북마크 해제" : "북마크"}</span>
                  </Button>
                </div>

                <div className="space-y-3 mt-6">
                  {currentQuestion.options.map((option, index) => {
                    const optionId = String.fromCharCode(65 + index) // A, B, C, D, E로 변환
                    const isSelected = selectedAnswers.includes(optionId)
                    const isCorrect = currentQuestion.actualAnswers?.includes(optionId)
                    const isMultipleChoice = currentQuestion.answer_count > 1

                    return (
                      <div
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className={`flex items-start p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 dark:bg-primary/10"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        } ${
                          isSubmitted && isCorrect
                            ? "border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/20"
                            : isSubmitted && isSelected && !isCorrect
                              ? "border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20"
                              : ""
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 flex items-center justify-center w-6 h-6 ${
                            isMultipleChoice ? "rounded" : "rounded-full"
                          } border mr-3 mt-0.5 ${
                            isSelected ? "border-primary bg-primary text-white" : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {isMultipleChoice ? (
                            isSelected ? (
                              <Check className="h-3 w-3" />
                            ) : null
                          ) : (
                            <div className={`w-3 h-3 rounded-full ${isSelected ? "bg-white" : "bg-transparent"}`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{optionId}.</span>
                            <Markdown content={option} />
                          </div>
                        </div>
                        {isSubmitted && (
                          <div className="flex-shrink-0 ml-2">
                            {isCorrect ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : isSelected ? (
                              <X className="h-5 w-5 text-red-500" />
                            ) : null}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {isSubmitted && currentQuestion.explanation && (
                  <div
                    className={`mt-6 p-4 rounded-lg border ${
                      areAnswersEqual(selectedAnswers, currentQuestion.actualAnswers || [])
                        ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                        : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                    }`}
                  >
                    <h3
                      className={`font-medium mb-2 ${
                        areAnswersEqual(selectedAnswers, currentQuestion.actualAnswers || [])
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {areAnswersEqual(selectedAnswers, currentQuestion.actualAnswers || [])
                        ? "정답입니다!"
                        : "오답입니다."}
                    </h3>
                    <Markdown content={currentQuestion.explanation} />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850">
                <Button
                  variant="outline"
                  size={isMobile ? "default" : "sm"}
                  className="w-full sm:w-auto"
                  onClick={() => setShowAIChat(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  AI에게 물어보기
                </Button>

                <div className="flex gap-3 w-full sm:w-auto">
                  {!isSubmitted ? (
                    <Button
                      className="flex-1 sm:flex-initial"
                      disabled={selectedAnswers.length === 0 || loading.submit}
                      onClick={handleSubmit}
                    >
                      {loading.submit ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          제출 중...
                        </>
                      ) : (
                        "제출하기"
                      )}
                    </Button>
                  ) : (
                    <Button className="flex-1 sm:flex-initial" onClick={handleNextQuestion}>
                      {currentQuestionIndex < questions.length - 1 ? (
                        <>
                          다음 문제
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        "결과 보기"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col space-y-8 py-6">
          <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden p-6">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Check className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">축하합니다!</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6">모든 문제를 완료했습니다.</p>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">총 문제</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{questions.length}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">정답률</p>
                  <p
                    className={`text-2xl font-bold ${
                      examResult && examResult.correct_rate >= 70
                        ? "text-green-500"
                        : examResult && examResult.correct_rate >= 40
                          ? "text-yellow-500"
                          : "text-red-500"
                    }`}
                  >
                    {examResult ? `${examResult.correct_rate}%` : "계산 중..."}
                  </p>
                </div>
              </div>

              {examResult && examResult.summary && (
                <div className="w-full mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-left">
                  <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-2">AI 분석 결과</h3>
                  <Markdown content={examResult.summary} />
                </div>
              )}
            </div>

            {/* 틀린 문제 목록 */}
            {incorrectQuestions.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    틀린 문제 ({incorrectQuestions.length}개)
                  </h2>
                </div>
                <div className="space-y-4">
                  {incorrectQuestions.map((question) => {
                    const isExpanded = expandedExplanations[`incorrect-${question.question_id}`] || false

                    return (
                      <div
                        key={`incorrect-${question.question_id}`}
                        className="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden"
                      >
                        <div className="bg-red-50 dark:bg-red-900/20 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Badge variant={question.answer_count > 1 ? "secondary" : "outline"} className="mb-2">
                                {question.answer_count > 1 ? "다중 선택" : "단일 선택"}
                              </Badge>
                              <Markdown content={question.text} />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 ml-2 flex-shrink-0"
                              onClick={() => toggleExplanation(`incorrect-${question.question_id}`)}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                              <div className="mb-3">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">정답:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {question.actualAnswers?.map((answerId) => (
                                    <Badge
                                      key={answerId}
                                      variant="outline"
                                      className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                    >
                                      {answerId}. {question.options[answerId.charCodeAt(0) - 65].substring(0, 30)}
                                      {question.options[answerId.charCodeAt(0) - 65].length > 30 ? "..." : ""}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">설명:</h4>
                                <Markdown content={question.explanation || ""} />
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => {
                                  setCurrentQuestionIndex(
                                    questions.findIndex((q) => q.question_id === question.question_id),
                                  )
                                  setShowAIChat(true)
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                AI에게 물어보기
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 북마크한 문제 목록 */}
            {markedQuestions.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    <span className="flex items-center">
                      <BookmarkCheck className="h-5 w-5 text-yellow-500 mr-2" />
                      북마크한 문제 ({markedQuestions.length}개)
                    </span>
                  </h2>
                </div>
                <div className="space-y-4">
                  {markedQuestions.map((question) => {
                    const isExpanded = expandedExplanations[`marked-${question.question_id}`] || false
                    const isIncorrect =
                      question.isSubmitted &&
                      question.userAnswers &&
                      question.actualAnswers &&
                      !areAnswersEqual(question.userAnswers, question.actualAnswers)

                    return (
                      <div
                        key={`marked-${question.question_id}`}
                        className={`border rounded-lg overflow-hidden ${
                          isIncorrect
                            ? "border-red-200 dark:border-red-800"
                            : "border-yellow-200 dark:border-yellow-800"
                        }`}
                      >
                        <div
                          className={`p-4 ${
                            isIncorrect ? "bg-red-50 dark:bg-red-900/20" : "bg-yellow-50 dark:bg-yellow-900/20"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={question.answer_count > 1 ? "secondary" : "outline"}>
                                  {question.answer_count > 1 ? "다중 선택" : "단일 선택"}
                                </Badge>
                                {isIncorrect && (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                  >
                                    틀린 문제
                                  </Badge>
                                )}
                              </div>
                              <Markdown content={question.text} />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 ml-2 flex-shrink-0"
                              onClick={() => toggleExplanation(`marked-${question.question_id}`)}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>

                          {isExpanded && question.isSubmitted && (
                            <div
                              className={`mt-4 pt-4 border-t ${
                                isIncorrect
                                  ? "border-red-200 dark:border-red-800"
                                  : "border-yellow-200 dark:border-yellow-800"
                              }`}
                            >
                              <div className="mb-3">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">정답:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {question.actualAnswers?.map((answerId) => (
                                    <Badge
                                      key={answerId}
                                      variant="outline"
                                      className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                    >
                                      {answerId}. {question.options[answerId.charCodeAt(0) - 65].substring(0, 30)}
                                      {question.options[answerId.charCodeAt(0) - 65].length > 30 ? "..." : ""}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">설명:</h4>
                                <Markdown content={question.explanation || ""} />
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => {
                                  setCurrentQuestionIndex(
                                    questions.findIndex((q) => q.question_id === question.question_id),
                                  )
                                  setShowAIChat(true)
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                AI에게 물어보기
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <Button className="w-full" onClick={resetQuiz}>
              <RotateCcw className="h-4 w-4 mr-2" />
              다시 시작하기
            </Button>
          </div>
        </div>
      )}

      {currentQuestion && (
        <AIChatDialog
          open={showAIChat}
          onOpenChange={setShowAIChat}
          examId={examId || 0}
          questionId={currentQuestion.question_id}
        />
      )}
    </div>
  )
}

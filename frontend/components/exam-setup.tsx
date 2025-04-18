"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, BookOpen, RefreshCw } from "lucide-react"
import { getQuestionBanks } from "@/lib/api-client"
import type { QuestionBank } from "@/types/quiz"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ExamSetupProps {
  onStartExam: (params: { question_bank_id: number; language: string; questions: number }) => void
}

export function ExamSetup({ onStartExam }: ExamSetupProps) {
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([])
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null)
  const [language, setLanguage] = useState("korean")
  const [questionCount, setQuestionCount] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTimedOut, setIsTimedOut] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 문제 은행 목록 가져오기
  const fetchQuestionBanks = async () => {
    try {
      setLoading(true)
      setError(null)
      setIsTimedOut(false)

      // 타임아웃 설정 (10초)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setIsTimedOut(true)
        setLoading(false)
      }, 10000)

      const response = await getQuestionBanks()

      // 타임아웃 취소
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      setQuestionBanks(response.data)

      // 첫 번째 문제 은행을 기본 선택
      if (response.data.length > 0) {
        setSelectedBankId(response.data[0].question_bank_id)
      }

      setLoading(false)
    } catch (err) {
      // 타임아웃 취소
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      setError("문제 은행 목록을 불러오는 중 오류가 발생했습니다.")
      setLoading(false)
      console.error("Failed to fetch question banks:", err)
    }
  }

  useEffect(() => {
    fetchQuestionBanks()

    // 컴포넌트 언마운트 시 타임아웃 정리
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // 시험 시작 처리
  const handleStartExam = () => {
    if (!selectedBankId) {
      setError("문제 은행을 선택해주세요.")
      return
    }

    onStartExam({
      question_bank_id: selectedBankId,
      language,
      questions: questionCount,
    })
  }

  // 문제 수 입력 처리
  const handleQuestionCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setQuestionCount(value)
    }
  }

  // 선택된 문제 은행 정보
  const selectedBank = questionBanks.find((bank) => bank.question_bank_id === selectedBankId)

  return (
    <div className="flex justify-center items-center min-h-[80vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">AWS 자격증 시험 설정</CardTitle>
          <CardDescription>시험을 시작하기 전에 아래 옵션을 선택해주세요.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isTimedOut && (
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
                  onClick={fetchQuestionBanks}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  다시 시도
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-gray-500 dark:text-gray-400">문제 은행 목록을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Alert variant="destructive">
                <AlertTitle>오류</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button variant="outline" onClick={fetchQuestionBanks}>
                <RefreshCw className="h-4 w-4 mr-2" />
                다시 시도
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="question-bank">문제 은행 선택</Label>
                <Select
                  value={selectedBankId?.toString() || ""}
                  onValueChange={(value) => setSelectedBankId(Number.parseInt(value))}
                >
                  <SelectTrigger id="question-bank">
                    <SelectValue placeholder="문제 은행을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionBanks.map((bank) => (
                      <SelectItem key={bank.question_bank_id} value={bank.question_bank_id.toString()}>
                        {bank.text} ({bank.questions}문제)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">언어 선택</Label>
                <RadioGroup id="language" value={language} onValueChange={setLanguage} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="korean" id="korean" />
                    <Label htmlFor="korean">한국어</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="english" id="english" />
                    <Label htmlFor="english">English</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question-count">문제 수 (최대 {selectedBank?.questions || 0})</Label>
                <Input
                  id="question-count"
                  type="number"
                  min="1"
                  max={selectedBank?.questions || 100}
                  value={questionCount}
                  onChange={handleQuestionCountChange}
                />
              </div>
            </>
          )}
        </CardContent>

        <CardFooter>
          <Button className="w-full" onClick={handleStartExam} disabled={loading || !selectedBankId}>
            <BookOpen className="mr-2 h-4 w-4" />
            시험 시작하기
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

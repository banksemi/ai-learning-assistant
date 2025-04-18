"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2 } from "lucide-react"
import { Markdown } from "@/components/markdown"
import { sendChatMessage } from "@/lib/api-client"
import type { Message } from "@/types/quiz"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AIChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  examId: number
  questionId: number
}

export function AIChatDialog({ open, onOpenChange, examId, questionId }: AIChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "안녕하세요! 이 문제에 대해 어떤 도움이 필요하신가요?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    // 사용자 메시지 추가
    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")

    try {
      setIsLoading(true)
      setError(null)

      // API를 통해 AI 응답 요청
      const response = await sendChatMessage(examId, questionId, input)

      // AI 응답 추가
      const aiResponse: Message = {
        role: "assistant",
        content: response.assistant,
      }

      setMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
    } catch (err) {
      setError("메시지 전송 중 오류가 발생했습니다.")
      setIsLoading(false)
      console.error("Failed to send chat message:", err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[80vh] max-h-[600px] flex flex-col p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DialogTitle className="text-base font-medium">AI 도우미와 대화하기</DialogTitle>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === "assistant"
                          ? "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <span className="text-lg">✨</span>
                      ) : (
                        <span className="text-lg">👤</span>
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-3 text-sm ${
                        message.role === "assistant"
                          ? "bg-gray-100 dark:bg-gray-800"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {message.role === "assistant" ? <Markdown content={message.content} /> : <p>{message.content}</p>}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300 flex items-center justify-center">
                      <span className="text-lg">✨</span>
                    </div>
                    <div className="rounded-lg p-3 text-sm bg-gray-100 dark:bg-gray-800">
                      <div className="flex space-x-1">
                        <div
                          className="h-2 w-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="h-2 w-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="h-2 w-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="메시지를 입력하세요..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

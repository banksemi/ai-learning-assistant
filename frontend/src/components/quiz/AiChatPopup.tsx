import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Sparkles, Loader2, HelpCircle } from 'lucide-react';
import { Language, Question, ChatMessage as FrontendChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuiz } from '@/context/QuizContext';
import AiMessageRenderer from './AiMessageRenderer';
import MarkdownRenderer from '@/components/MarkdownRenderer'; // 공통 MarkdownRenderer 사용

// Add an optional id field for tracking streaming messages
interface StreamingChatMessage extends FrontendChatMessage {
    id?: number; // Unique ID for the streaming message
}

interface AiChatPopupProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  question: Question | null;
  language: Language;
}

// Define default typing speed
const DEFAULT_TYPING_SPEED = 30;
const FAST_TYPING_SPEED = 10;
const SLOW_TYPING_SPEED = 50;

const AiChatPopup: React.FC<AiChatPopupProps> = ({
    isOpen,
    onOpenChange,
    question,
    language,
}) => {
  const { sendChatMessage, closeChatStream } = useQuiz();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<StreamingChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const currentAiMessageIdRef = useRef<number | null>(null);
  // State for dynamic typing speed
  const [typingSpeed, setTypingSpeed] = useState<number>(DEFAULT_TYPING_SPEED);

  const presetMessages = question?.presetMessages;

  const scrollToBottom = useCallback(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (!isOpen) {
        closeChatStream();
      }
    };
  }, [isOpen, closeChatStream]);

  const handleSendMessage = useCallback(async (messageToSend?: string) => {
    const textToSend = messageToSend ?? inputValue;
    if (!textToSend.trim() || isLoading || !question) return;

    closeChatStream();
    setTypingSpeed(DEFAULT_TYPING_SPEED); // Reset speed for new message

    const userMessage: StreamingChatMessage = { sender: 'user', text: textToSend };
    const aiMessageId = Date.now();
    const initialAiMessage: StreamingChatMessage = { id: aiMessageId, sender: 'ai', text: '' };
    currentAiMessageIdRef.current = aiMessageId;

    setMessages((prev) => [...prev, userMessage, initialAiMessage]);
    setInputValue('');
    setIsLoading(true);

    scrollToBottom(); // Scroll only when user sends

    sendChatMessage(question.id, textToSend, {
      onOpen: () => {
        console.log("SSE connection opened.");
      },
      onMessage: (chunk) => {
        // Calculate speed based on chunk length
        const chunkLength = chunk.length;
        let newSpeed = DEFAULT_TYPING_SPEED;
        if (chunkLength > 50) {
            newSpeed = FAST_TYPING_SPEED;
        } else if (chunkLength <= 10) {
            newSpeed = SLOW_TYPING_SPEED;
        }
        // Update speed state *before* updating message text
        setTypingSpeed(newSpeed);

        // Update message text
        setMessages((prev) => {
          const currentAiMsgIndex = prev.findIndex(msg => msg.id === currentAiMessageIdRef.current);
          if (currentAiMsgIndex === -1) return prev;

          const next = [...prev];
          const targetMsg = next[currentAiMsgIndex];
          const updatedMsg = { ...targetMsg, text: targetMsg.text + chunk };
          next[currentAiMsgIndex] = updatedMsg;
          return next;
        });
      },
      onError: (error) => {
        console.error("SSE Error:", error);
        const errorText = typeof error === 'string' ? error : (language === 'ko' ? 'AI 채팅 중 오류가 발생했습니다.' : 'An error occurred during AI chat.');
        toast.error(language === 'ko' ? 'AI 채팅 오류' : 'AI Chat Error', { description: errorText });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === currentAiMessageIdRef.current
              ? { ...msg, text: `❌ ${language === 'ko' ? '오류 발생' : 'Error occurred'}` }
              : msg
          )
        );
        setIsLoading(false);
        currentAiMessageIdRef.current = null;
        setTypingSpeed(DEFAULT_TYPING_SPEED); // Reset speed on error
      },
      onClose: () => {
        console.log("SSE connection closed by server.");
        setIsLoading(false);
        currentAiMessageIdRef.current = null;
        setTypingSpeed(DEFAULT_TYPING_SPEED); // Reset speed on close
        if (!isMobile && inputRef.current && isOpen) {
          requestAnimationFrame(() => {
            inputRef.current?.focus();
          });
        }
      }
    });

  }, [inputValue, isLoading, question, sendChatMessage, language, isOpen, isMobile, closeChatStream, scrollToBottom]);

  const handlePresetClick = (preset: string) => {
      if (isLoading) return;
      handleSendMessage(preset);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setInputValue('');
      setIsLoading(false);
      currentAiMessageIdRef.current = null;
      setTypingSpeed(DEFAULT_TYPING_SPEED); // Reset speed when opening
    } else {
        closeChatStream();
    }
  }, [isOpen, closeChatStream]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
            "sm:max-w-2xl p-0 flex flex-col", // Base styles
            // Mobile full screen styles
            isMobile ? "h-screen max-h-screen w-screen max-w-screen top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none"
                     : "max-h-[80vh] h-[80vh] md:max-h-[70vh] md:h-[70vh]" // Desktop styles
        )}
        onPointerDownOutside={(e) => {
            // Always prevent default to stop closing on outside click
            e.preventDefault();
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            {language === 'ko' ? 'AI에게 물어보기' : 'Ask AI'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4 pt-4 pb-0 overflow-y-auto" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message, index) => (
              <div key={message.id ?? `msg-${index}`} className={cn(
                'flex items-start gap-2 w-full',
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              )}>
                {message.sender === 'ai' && (
                  <>
                    <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    {/* AI Message: Use AiMessageRenderer */}
                    <div className="rounded-lg p-3 max-w-[90%] bg-gray-200 dark:bg-gray-700 prose dark:prose-invert">
                      <AiMessageRenderer
                        message={message}
                        isStreaming={message.id === currentAiMessageIdRef.current}
                        language={language}
                        speed={typingSpeed}
                      />
                    </div>
                  </>
                )}
                {message.sender === 'user' && (
                  // User Message: Use MarkdownRenderer with white text
                  <div className="rounded-lg p-3 max-w-[85%] bg-primary text-primary-foreground">
                    {/* Use MarkdownRenderer, remove prose-primary-invert, add text-white */}
                    {/* prose-p:m-0 to remove paragraph margins */}
                    {/* [&_*]:text-white to force all inner elements to be white */}
                    <MarkdownRenderer
                      content={message.text}
                      className="prose-p:m-0 text-white [&_*]:text-white"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {messages.length === 0 && !isLoading && (
            <div className="px-4 pt-2 pb-1 border-t">
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    {language === 'ko' ? '추천 질문:' : 'Suggested Questions:'}
                </h4>
                {presetMessages === null ? (
                    <div className="flex flex-wrap gap-2 min-h-[2rem]" aria-busy="true" aria-live="polite">
                        <Skeleton className="h-8 w-32 rounded-full" />
                        <Skeleton className="h-8 w-40 rounded-full" />
                        <Skeleton className="h-8 w-28 rounded-full" />
                    </div>
                ) : presetMessages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {presetMessages.map((preset, index) => (
                            <Button
                                key={index}
                                size="sm"
                                className={cn(
                                    "rounded-full h-auto whitespace-normal text-xs px-3 py-1.5 font-normal border border-border",
                                    "bg-gray-200 dark:bg-gray-700 text-foreground",
                                    "hover:bg-gray-300 dark:hover:bg-gray-600"
                                )}
                                onClick={() => handlePresetClick(preset)}
                                disabled={isLoading}
                            >
                                {preset}
                            </Button>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground italic">
                        {language === 'ko' ? '추천 질문이 없습니다.' : 'No suggested questions available.'}
                    </p>
                )}
            </div>
        )}

        <Separator className="my-0" />
        <DialogFooter className="px-4 pb-4 pt-0 flex-shrink-0">
          <div className="flex w-full items-center space-x-2 pt-1">
            <Input
              ref={inputRef}
              type="text"
              placeholder={language === 'ko' ? '메시지를 입력하세요...' : 'Type your message...'}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1 rounded-full px-4"
            />
            <Button
              type="button"
              size="icon"
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              className="rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : <Send className="h-4 w-4 text-primary-foreground" />}
              <span className="sr-only">{language === 'ko' ? '보내기' : 'Send'}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiChatPopup;

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
import { Send, Sparkles, Bot, Loader2 } from 'lucide-react';
import { Language, Question, ChatMessage as FrontendChatMessage, ApiChatResponse } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm
import CodeBlock from '@/components/CodeBlock'; // Import CodeBlock

interface AiChatPopupProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  question: Question | null;
  language: Language;
  sendChatMessage: (message: string) => Promise<ApiChatResponse | null>;
}

const AiChatPopup: React.FC<AiChatPopupProps> = ({ isOpen, onOpenChange, question, language, sendChatMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<FrontendChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !question) return;

    const userMessage: FrontendChatMessage = { sender: 'user', text: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(messageToSend);

      if (response && response.assistant) {
        const aiResponse: FrontendChatMessage = { sender: 'ai', text: response.assistant };
        setMessages((prev) => [...prev, aiResponse]);
      } else {
         setMessages((prev) => [...prev, { sender: 'ai', text: language === 'ko' ? 'AI로부터 응답을 받지 못했습니다.' : 'Did not receive a response from AI.' }]);
      }
    } catch (error) {
      console.error("Error sending chat message:", error);
       setMessages((prev) => [...prev, { sender: 'ai', text: language === 'ko' ? '메시지 전송 중 오류가 발생했습니다.' : 'Error sending message.' }]);
       toast.error(language === 'ko' ? '메시지 전송 실패' : 'Failed to send message');
    } finally {
      setIsLoading(false);
      requestAnimationFrame(() => {
        setTimeout(() => {
            if (inputRef.current && isOpen) {
                 inputRef.current.focus();
            }
        }, 0);
      });
    }
  }, [inputValue, isLoading, question, sendChatMessage, language, isOpen]);

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
      setMessages([{
          sender: 'ai',
          text: language === 'ko' ? `현재 문제에 대해 무엇이든 물어보세요!` : `Ask anything about the current question!`
      }]);
      setInputValue('');
      setIsLoading(false);
      setTimeout(() => {
          inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, language]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        // Changed sm:max-w-xl to sm:max-w-2xl
        className="sm:max-w-2xl p-0 flex flex-col max-h-[70vh] h-[70vh]"
        onPointerDownOutside={(e) => {
            e.preventDefault();
        }}
      >
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            {language === 'ko' ? 'AI에게 물어보기' : 'Ask AI'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4 pt-4 pb-0 overflow-y-auto" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={cn(
                'flex items-start gap-2 w-full',
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              )}>
                {message.sender === 'ai' && (
                  <>
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    {/* Apply prose class for markdown, ensure text size is controlled via CSS */}
                    <div className="rounded-lg p-3 max-w-[85%] bg-gray-200 dark:bg-gray-700 prose prose-sm dark:prose-invert">
                      <ReactMarkdown
                        children={message.text}
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline ? (
                              <CodeBlock
                                language={match ? match[1] : undefined}
                                value={String(children).replace(/\n$/, '')}
                                {...props}
                              />
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      />
                    </div>
                  </>
                )}
                {message.sender === 'user' && (
                  // User message text size should be standard text-sm
                  <div className="rounded-lg p-3 max-w-[85%] text-sm bg-primary text-primary-foreground">
                    {message.text}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2 justify-start">
                <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                {/* Loading indicator text size should be standard text-sm */}
                <div className="rounded-lg p-3 bg-gray-200 dark:bg-gray-700 text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="italic text-muted-foreground">{language === 'ko' ? '답변 생성 중...' : 'Generating response...'}</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator className="my-0" />
        <DialogFooter className="px-4 pb-4 pt-0 flex-shrink-0">
          <div className="flex w-full items-center space-x-2 pt-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder={language === 'ko' ? '메시지를 입력하세요...' : 'Type your message...'}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1 rounded-full px-4" // Input text size is controlled by Input component's base styles
            />
            <Button
              type="button"
              size="icon"
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="rounded-full bg-primary hover:bg-primary/90"
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

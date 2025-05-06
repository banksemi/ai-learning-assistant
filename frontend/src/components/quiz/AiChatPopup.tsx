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
import { Language, Question, ChatMessage as FrontendChatMessage, ApiChatResponse } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '@/components/CodeBlock';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';

interface AiChatPopupProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  question: Question | null;
  language: Language;
  sendChatMessage: (message: string) => Promise<ApiChatResponse | null>;
}

const AiChatPopup: React.FC<AiChatPopupProps> = ({
    isOpen,
    onOpenChange,
    question,
    language,
    sendChatMessage,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<FrontendChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Keep inputRef for re-focusing after send
  const isMobile = useIsMobile();

  const presetMessages = question?.presetMessages;

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (messageToSend?: string) => {
    const textToSend = messageToSend ?? inputValue;
    if (!textToSend.trim() || isLoading || !question) return;

    const userMessage: FrontendChatMessage = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(textToSend);
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
      // Re-focus input after sending a message on non-mobile devices
      if (!isMobile && inputRef.current && isOpen) {
        requestAnimationFrame(() => { // Use requestAnimationFrame for smoother focus
          inputRef.current?.focus();
        });
      }
    }
  }, [inputValue, isLoading, question, sendChatMessage, language, isOpen, isMobile]);

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

  // Effect to reset state when popup opens (but not focus)
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setInputValue('');
      setIsLoading(false);
      // Auto-focus on open is now handled by onOpenAutoFocus or prevented by it.
    }
  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl p-0 flex flex-col max-h-[80vh] h-[80vh] md:max-h-[70vh] md:h-[70vh]"
        onPointerDownOutside={(e) => {
            if (isMobile) {
                e.preventDefault(); // Prevent closing on touch outside on mobile
            }
        }}
        // Prevent default auto-focus behavior of the dialog
        onOpenAutoFocus={(e) => e.preventDefault()}
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
                    <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="rounded-lg p-3 max-w-[90%] bg-gray-200 dark:bg-gray-700 prose dark:prose-invert">
                      <ReactMarkdown
                        children={message.text}
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            if (!inline && match) {
                              return (
                                <CodeBlock
                                  language={match[1]}
                                  value={String(children).replace(/\n$/, '')}
                                />
                              );
                            }
                            return (
                              <code
                                className={cn(
                                  "font-normal bg-muted text-foreground px-1 py-0.5 rounded-sm text-sm",
                                  className
                                )}
                              >
                                {children}
                              </code>
                            );
                          },
                          pre: ({ node, ...props }) => <pre style={{ margin: 0 }} {...props} />,
                        }}
                      />
                    </div>
                  </>
                )}
                {message.sender === 'user' && (
                  <div className="rounded-lg p-3 max-w-[85%] bg-primary text-primary-foreground">
                    {message.text}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2 justify-start">
                 <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                   <Sparkles className="h-4 w-4 text-primary" />
                 </div>
                <div className="rounded-lg p-3 bg-gray-200 dark:bg-gray-700 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="italic text-muted-foreground">{language === 'ko' ? '답변 생성 중...' : 'Generating response...'}</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {messages.length === 0 && (
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

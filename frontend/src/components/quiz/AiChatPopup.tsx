import React, { useState, useRef, useEffect, useCallback } from 'react'; // Import useCallback
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Use the updated base Input
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Sparkles, Bot, Loader2 } from 'lucide-react'; // Added Loader2
import { Language, Question, ChatMessage as FrontendChatMessage, ApiChatResponse } from '@/types'; // Use FrontendChatMessage
import { cn } from '@/lib/utils';
import { toast } from "sonner"; // For error notifications

interface AiChatPopupProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  question: Question | null;
  language: Language;
  // Add sendChatMessage prop which returns a Promise
  sendChatMessage: (message: string) => Promise<ApiChatResponse | null>;
}

// Use FrontendChatMessage type here
// interface Message {
//   sender: 'user' | 'ai';
//   text: string;
// }

const AiChatPopup: React.FC<AiChatPopupProps> = ({ isOpen, onOpenChange, question, language, sendChatMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<FrontendChatMessage[]>([]); // Use FrontendChatMessage
  const [isLoading, setIsLoading] = useState(false); // Renamed from isAiLoading for clarity
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input field

  // Scroll to bottom effect remains the same
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Use useCallback for handleSendMessage
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !question) return; // Ensure question exists

    const userMessage: FrontendChatMessage = { sender: 'user', text: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputValue; // Store value before clearing
    setInputValue('');
    setIsLoading(true);

    try {
      // Call the passed sendChatMessage function from context
      const response = await sendChatMessage(messageToSend);

      if (response && response.assistant) {
        const aiResponse: FrontendChatMessage = { sender: 'ai', text: response.assistant };
        setMessages((prev) => [...prev, aiResponse]);
      } else {
        // Handle cases where response is null or doesn't contain assistant message
         setMessages((prev) => [...prev, { sender: 'ai', text: language === 'ko' ? 'AI로부터 응답을 받지 못했습니다.' : 'Did not receive a response from AI.' }]);
         // Optionally show a toast error
         // toast.error(language === 'ko' ? 'AI 응답 오류' : 'AI Response Error');
      }
    } catch (error) {
      // Error is likely handled/logged in context, but show a message here too
      console.error("Error sending chat message:", error);
       setMessages((prev) => [...prev, { sender: 'ai', text: language === 'ko' ? '메시지 전송 중 오류가 발생했습니다.' : 'Error sending message.' }]);
       toast.error(language === 'ko' ? '메시지 전송 실패' : 'Failed to send message');
    } finally {
      setIsLoading(false);
      // Use requestAnimationFrame -> setTimeout(0) to ensure focus happens last
      requestAnimationFrame(() => {
        setTimeout(() => {
            // Check if the input still exists and the dialog is open before focusing
            if (inputRef.current && isOpen) {
                 inputRef.current.focus();
            }
        }, 0);
      });
    }
  }, [inputValue, isLoading, question, sendChatMessage, language, isOpen]); // Added isOpen dependency

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Use useCallback for handleKeyDown
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]); // Dependency on handleSendMessage

  // Reset messages and focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setMessages([{
          sender: 'ai',
          text: language === 'ko' ? `현재 문제에 대해 무엇이든 물어보세요!` : `Ask anything about the current question!`
      }]);
      setInputValue(''); // Clear input field as well
      setIsLoading(false); // Ensure loading state is reset
      // Focus the input when the dialog opens
      // Use setTimeout to ensure the input is rendered and ready for focus
      setTimeout(() => {
          inputRef.current?.focus();
      }, 100); // Adjust delay if needed
    }
  }, [isOpen, language]); // Removed question dependency as it's not used in initial message

  // --- REMOVED useEffect for focus management based on isLoading ---


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 flex flex-col max-h-[70vh] h-[70vh]"
        // Always prevent default on pointer down outside to stop focus shifts
        onPointerDownOutside={(e) => {
            e.preventDefault();
        }}
        // Keep onInteractOutside commented out unless specifically needed
        // onInteractOutside={(e) => {
        //     e.preventDefault();
        // }}
      >
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            {language === 'ko' ? 'AI에게 물어보기' : 'Ask AI'}
          </DialogTitle>
        </DialogHeader>

        {/* Keep bottom padding pb-0 */}
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
                    {/* Changed background to bg-gray-200 dark:bg-gray-700 */}
                    <div className="rounded-lg p-3 max-w-[85%] text-sm bg-gray-200 dark:bg-gray-700">
                      {message.text}
                    </div>
                  </>
                )}
                {message.sender === 'user' && (
                  <div className="rounded-lg p-3 max-w-[85%] text-sm bg-primary text-primary-foreground">
                    {message.text}
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator uses Loader2 */}
            {isLoading && (
              <div className="flex items-start gap-2 justify-start">
                <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                 {/* Changed background to bg-gray-200 dark:bg-gray-700 */}
                <div className="rounded-lg p-3 bg-gray-200 dark:bg-gray-700 text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="italic text-muted-foreground">{language === 'ko' ? '답변 생성 중...' : 'Generating response...'}</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Keep margin my-0 */}
        <Separator className="my-0" />
        {/* Keep top padding pt-0, keep bottom padding pb-4 */}
        <DialogFooter className="px-4 pb-4 pt-0 flex-shrink-0">
          {/* Restore top padding to pt-2 for slightly more space above input */}
          <div className="flex w-full items-center space-x-2 pt-2">
            <Input
              ref={inputRef} // Attach the ref here
              type="text"
              placeholder={language === 'ko' ? '메시지를 입력하세요...' : 'Type your message...'}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              // Ensure no outline-none classes are present here
              className="flex-1 rounded-full px-4"
            />
            <Button
              type="button"
              size="icon"
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="rounded-full bg-primary hover:bg-primary/90"
            >
              {/* Show loader when loading */}
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

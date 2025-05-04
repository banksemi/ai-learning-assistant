import React, { useState, useEffect, useCallback } from 'react';
import { useQuiz } from '@/context/QuizContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Language, QuizSettings, QuestionBank as FrontendQuestionBank } from '@/types';
import QuestionBankSelector from '@/components/index/QuestionBankSelector';
import NumberOfQuestionsSelector from '@/components/index/NumberOfQuestionsSelector';
import LanguageDropdown from '@/components/index/LanguageDropdown';
import { getQuestionBanks } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Upload, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AdminUploadDialog from '@/components/admin/AdminUploadDialog';
import { toast } from "sonner";

// Define the interface for the BeforeInstallPromptEvent (use 'any' if type causes issues)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const Index = () => {
  const { startQuiz, language, setLanguage, isLoading: isContextLoading, error: contextError, clearError } = useQuiz();
  const [availableBanks, setAvailableBanks] = useState<FrontendQuestionBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [isLoadingBanks, setIsLoadingBanks] = useState<boolean>(true);
  const [errorLoadingBanks, setErrorLoadingBanks] = useState<string | null>(null);
  const [isAdminUploadOpen, setIsAdminUploadOpen] = useState<boolean>(false);
  // State to store the deferred install prompt event
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const selectedBank = availableBanks.find(bank => bank.id === selectedBankId);
  const maxQuestions = selectedBank?.questions ?? 0;

  // --- PWA Install Prompt Logic ---
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log("'beforeinstallprompt' event was fired.");
      // Optionally, update UI to show the install button
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listener for when the app is installed
    const handleAppInstalled = () => {
        console.log('PWA was installed');
        // Hide the install button or update UI
        setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);


    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // More specific message if prompt is unavailable
      toast.info(language === 'ko' ? "앱 설치 프롬프트를 지금 사용할 수 없습니다. (이미 설치되었거나 지원되지 않는 브라우저일 수 있습니다.)" : "App install prompt not available right now. (May be already installed or unsupported browser.)");
      console.log("Deferred prompt not available.");
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
  };
  // --- End PWA Install Prompt Logic ---


  const getValidNumOptions = useCallback((max: number): number[] => {
      const base = [1, 5, 10, 20, 30, 65];
      const filtered = base.filter(opt => opt <= max);
      if (max > 0 && !filtered.includes(max)) {
          filtered.push(max);
      }
      if (filtered.length === 0 && max > 0) {
          return [max];
      }
      return filtered.sort((a, b) => a - b);
  }, []);


  const fetchBanks = useCallback(async () => {
    setIsLoadingBanks(true);
    setErrorLoadingBanks(null);
    if (clearError) clearError();
    try {
      const response = await getQuestionBanks();
      const frontendBanks = response.data.map(bank => ({
        id: bank.question_bank_id,
        name: bank.title,
        questions: bank.questions
      }));
      setAvailableBanks(frontendBanks);
      if (frontendBanks.length > 0) {
        const firstBank = frontendBanks[0];
        const firstBankMax = firstBank.questions;
        const validOptions = getValidNumOptions(firstBankMax);
        let initialNumQuestions = 10;
        if (validOptions.length > 0 && !validOptions.includes(initialNumQuestions)) {
            initialNumQuestions = validOptions.includes(10) ? 10 : validOptions[0];
        } else if (validOptions.length === 0 && firstBankMax > 0) {
            initialNumQuestions = firstBankMax;
        } else if (firstBankMax === 0) {
            initialNumQuestions = 0;
        }
        setNumQuestions(initialNumQuestions);
      } else {
          setSelectedBankId(null);
          setNumQuestions(0);
      }
    } catch (error: any) {
      console.error("Failed to fetch question banks:", error);
      setErrorLoadingBanks(error.message || "Failed to load question banks.");
      setNumQuestions(0);
    } finally {
      setIsLoadingBanks(false);
    }
  }, [clearError, getValidNumOptions]);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  useEffect(() => {
    if (selectedBank) {
      const currentMax = selectedBank.questions;
      const validOptions = getValidNumOptions(currentMax);
      if (validOptions.length > 0 && !validOptions.includes(numQuestions)) {
          setNumQuestions(validOptions.includes(10) ? 10 : validOptions[0]);
      } else if (validOptions.length === 0 && currentMax > 0) {
          setNumQuestions(currentMax);
      } else if (currentMax === 0) {
          setNumQuestions(0);
      }
    } else {
        setNumQuestions(10);
    }
  }, [selectedBankId, availableBanks, getValidNumOptions, selectedBank, numQuestions]);


  const handleStartQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clearError) clearError();
    if (selectedBankId === null) {
        toast.warning(language === 'ko' ? "문제 은행을 선택해주세요." : "Please select a question bank.");
        return;
    }
    if (numQuestions <= 0 || numQuestions > maxQuestions) {
      toast.error(language === 'ko' ? "유효한 문제 수를 선택해주세요." : "Please select a valid number of questions.");
      return;
    }
    const settings: QuizSettings = {
      questionBankId: selectedBankId,
      numberOfQuestions: numQuestions,
      language: language,
    };
    await startQuiz(settings);
  };

  const isLoading = isLoadingBanks || isContextLoading;
  const isStartDisabled = isLoading || !!errorLoadingBanks || !!contextError || selectedBankId === null || numQuestions <= 0 || maxQuestions <= 0;


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative">
       <div className="absolute top-4 right-4 flex items-center space-x-2">
           {/* Install App Button - Conditionally disable and updated title */}
           <Button
               variant="link"
               className="text-muted-foreground hover:text-primary hover:no-underline px-2 py-1 h-auto text-xs"
               onClick={handleInstallClick}
               // Disable the button if the prompt is not available
               disabled={!deferredPrompt}
               // Updated title attribute for better explanation
               title={!deferredPrompt ? (language === 'ko' ? '앱 설치 프롬프트를 사용할 수 없습니다 (지원되지 않는 브라우저 또는 이미 설치됨). iPad/iPhone에서는 공유 > 홈 화면에 추가를 사용하세요.' : 'App install prompt not available (unsupported browser or already installed). On iPad/iPhone, use Share > Add to Home Screen.') : (language === 'ko' ? '앱 설치' : 'Install App')}
           >
               <Download className="mr-1 h-3 w-3" />
               앱 설치
           </Button>

           <Button
               variant="link"
               className="text-muted-foreground hover:text-primary hover:no-underline px-2 py-1 h-auto text-xs"
               onClick={() => setIsAdminUploadOpen(true)}
           >
               <Upload className="mr-1 h-3 w-3" />
               문제 업로드
           </Button>
       </div>

      <Card className="w-full max-w-lg shadow-md rounded-lg animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between pt-6 pb-4 px-6 border-b">
          <CardTitle className="text-xl font-semibold text-primary">퀴즈 설정</CardTitle>
          <LanguageDropdown language={language} onLanguageChange={setLanguage} />
        </CardHeader>

        {contextError && !isLoadingBanks && (
          <div className="p-6 pt-0">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{language === 'ko' ? '오류' : 'Error'}</AlertTitle>
              <AlertDescription>{contextError}</AlertDescription>
            </Alert>
          </div>
        )}

        <form onSubmit={handleStartQuiz}>
          <CardContent className="space-y-8 p-8">
            {isLoadingBanks ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : errorLoadingBanks ? (
               <Alert variant="destructive">
                 <AlertCircle className="h-4 w-4" />
                 <AlertTitle>{language === 'ko' ? '오류' : 'Error'}</AlertTitle>
                 <AlertDescription>{errorLoadingBanks}</AlertDescription>
               </Alert>
            ) : (
              <>
                <QuestionBankSelector
                  banks={availableBanks}
                  selectedBank={selectedBankId !== null ? String(selectedBankId) : ''}
                  onBankChange={(value) => setSelectedBankId(value ? Number(value) : null)}
                  language={language}
                />
                <NumberOfQuestionsSelector
                  numQuestions={numQuestions}
                  onNumQuestionsChange={setNumQuestions}
                  language={language}
                  maxQuestions={maxQuestions}
                />
              </>
            )}
          </CardContent>

          <CardFooter className="p-6 pt-0 flex justify-center">
            <Button
              type="submit"
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8"
              disabled={isStartDisabled}
            >
              {isLoading && <span className="animate-spin mr-2">⏳</span>}
              {language === 'ko' ? '퀴즈 시작' : 'Start Quiz'}
            </Button>
          </CardFooter>
        </form>
      </Card>

       <AdminUploadDialog
           isOpen={isAdminUploadOpen}
           onOpenChange={setIsAdminUploadOpen}
       />
    </div>
  );
};

export default Index;

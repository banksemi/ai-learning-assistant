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
import { AlertCircle, Upload } from 'lucide-react'; // Import Upload icon
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AdminUploadDialog from '@/components/admin/AdminUploadDialog'; // Import the dialog
import { toast } from "sonner"; // Import toast

const Index = () => {
  const { startQuiz, language, setLanguage, isLoading: isContextLoading, error: contextError, clearError } = useQuiz();
  const [availableBanks, setAvailableBanks] = useState<FrontendQuestionBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [isLoadingBanks, setIsLoadingBanks] = useState<boolean>(true);
  const [errorLoadingBanks, setErrorLoadingBanks] = useState<string | null>(null);
  const [isAdminUploadOpen, setIsAdminUploadOpen] = useState<boolean>(false); // State for dialog

  const selectedBank = availableBanks.find(bank => bank.id === selectedBankId);
  const maxQuestions = selectedBank?.questions ?? 0;

  const getValidNumOptions = useCallback((max: number): number[] => {
      // Add 1 to the base options
      const base = [1, 5, 10, 20, 30, 65];
      const filtered = base.filter(opt => opt <= max);
      if (max > 0) {
          if (!filtered.includes(max)) {
              filtered.push(max);
          }
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
        // Don't auto-select first bank anymore
        // setSelectedBankId(firstBank.id);
        const firstBankMax = firstBank.questions;
        const validOptions = getValidNumOptions(firstBankMax);
        // Keep default numQuestions logic, but it might be irrelevant if no bank is pre-selected
        // Use a local variable for initial numQuestions calculation to avoid dependency issue
        let initialNumQuestions = 10;
        if (validOptions.length > 0 && !validOptions.includes(initialNumQuestions)) {
            initialNumQuestions = validOptions.includes(10) ? 10 : validOptions[0];
        } else if (validOptions.length === 0 && firstBankMax > 0) {
            initialNumQuestions = firstBankMax;
        } else if (firstBankMax === 0) {
            initialNumQuestions = 0;
        }
        // Set numQuestions state *after* fetching banks
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
  // REMOVED numQuestions from dependency array to fix infinite loop
  }, [clearError, getValidNumOptions]);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]); // fetchBanks reference is now stable

  // Effect to adjust numQuestions when selectedBankId changes (This one is correct)
  useEffect(() => {
    if (selectedBank) {
      const currentMax = selectedBank.questions;
      const validOptions = getValidNumOptions(currentMax);

      // If the current numQuestions is not among the valid options for the new bank, reset it.
      // Prioritize 10 if available, otherwise the first option (which could be 1).
      if (validOptions.length > 0 && !validOptions.includes(numQuestions)) {
          setNumQuestions(validOptions.includes(10) ? 10 : validOptions[0]);
      } else if (validOptions.length === 0 && currentMax > 0) {
          setNumQuestions(currentMax);
      } else if (currentMax === 0) {
          setNumQuestions(0);
      }
    } else {
        // If no bank is selected, reset numQuestions based on available options (or 10)
        // This handles the case where the user deselects a bank or initial load.
        const defaultOptions = getValidNumOptions(0); // Get options assuming max 0 initially
        setNumQuestions(10); // Reset to default 10 or another suitable default
    }
  // Keep numQuestions out of dependencies here as well. Bank change drives this effect.
  }, [selectedBankId, availableBanks, getValidNumOptions, selectedBank]);


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
       {/* Admin Upload Button - Top Right */}
       <Button
           variant="link"
           className="absolute top-4 right-4 text-muted-foreground hover:text-primary hover:no-underline px-2 py-1 h-auto text-xs"
           onClick={() => setIsAdminUploadOpen(true)}
       >
           <Upload className="mr-1 h-3 w-3" />
           문제 업로드
       </Button>

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
                  // Handle null selectedBankId for the Select component
                  selectedBank={selectedBankId !== null ? String(selectedBankId) : ''}
                  onBankChange={(value) => setSelectedBankId(value ? Number(value) : null)} // Allow unselecting or handle empty string
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

       {/* Admin Upload Dialog */}
       <AdminUploadDialog
           isOpen={isAdminUploadOpen}
           onOpenChange={setIsAdminUploadOpen}
       />
    </div>
  );
};

export default Index;

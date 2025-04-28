import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Keep Alert import for general errors
import { Loader2, AlertCircle, UploadCloud, PlusCircle, KeyRound, LogIn } from 'lucide-react'; // Added KeyRound, LogIn
import { toast } from "sonner";
import * as api from '@/services/api';
import { QuestionBank as FrontendQuestionBank } from '@/types'; // Use Frontend type

// Interface for the JSON structure provided by the user (remains the same)
interface UserInputQuestion {
    question: string;
    answers: [string, boolean][]; // Array of [answer_text, is_correct]
    explain: string; // Keep explain here for parsing, but it won't be sent to the API
}

// Interface for the structure needed by the NEW API
interface ApiUploadQuestion {
    title: string;
    correct_answers: string[];
    incorrect_answers: string[];
    // explanation is removed
}

// Helper to transform user input JSON to the NEW API format
const transformQuestionData = (userInput: UserInputQuestion[]): ApiUploadQuestion[] => {
    return userInput.map(item => {
        const correctAnswers: string[] = [];
        const incorrectAnswers: string[] = [];

        item.answers.forEach(([value, isCorrect]) => {
            if (isCorrect) {
                correctAnswers.push(value);
            } else {
                incorrectAnswers.push(value);
            }
        });

        return {
            title: item.question,
            correct_answers: correctAnswers,
            incorrect_answers: incorrectAnswers,
            // explanation is no longer included
        };
    });
};


interface AdminUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const AdminUploadDialog: React.FC<AdminUploadDialogProps> = ({ isOpen, onOpenChange }) => {
  const [password, setPassword] = useState<string>('');
  const [validatedPassword, setValidatedPassword] = useState<string | null>(null); // Store validated password
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // Removed authError state as toast handles it
  // const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false); // Loading state for auth

  const [availableBanks, setAvailableBanks] = useState<FrontendQuestionBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>(''); // Store as string for Select
  const [newBankTitle, setNewBankTitle] = useState<string>('');
  const [jsonData, setJsonData] = useState<string>('');
  const [isLoadingBanks, setIsLoadingBanks] = useState<boolean>(false);
  const [isCreatingBank, setIsCreatingBank] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null); // General error for bank/upload operations
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [totalToUpload, setTotalToUpload] = useState<number>(0);

  const fetchBanks = useCallback(async () => {
    // Only fetch banks if authenticated
    if (!isAuthenticated) return;
    setIsLoadingBanks(true);
    setError(null);
    try {
      // Note: getQuestionBanks doesn't require auth in the current API spec
      const response = await api.getQuestionBanks();
      const frontendBanks = response.data.map(bank => ({
        id: bank.question_bank_id,
        name: bank.title,
        questions: bank.questions
      }));
      setAvailableBanks(frontendBanks);
    } catch (err: any) {
      console.error("Failed to fetch question banks:", err);
      setError(err.message || "Failed to load question banks.");
      toast.error("문제 은행 로딩 실패", { description: err.message });
    } finally {
      setIsLoadingBanks(false);
    }
  }, [isAuthenticated]); // Depend on isAuthenticated

  // Effect to fetch banks when authentication status changes to true
  useEffect(() => {
    if (isAuthenticated) {
      fetchBanks();
    }
  }, [isAuthenticated, fetchBanks]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Reset everything when dialog closes
      setPassword('');
      setValidatedPassword(null); // Reset validated password
      setIsAuthenticated(false);
      // Removed authError reset
      // setAuthError(null);
      setAvailableBanks([]);
      setSelectedBankId('');
      setNewBankTitle('');
      setJsonData('');
      setError(null);
      setUploadProgress(0);
      setTotalToUpload(0);
      setIsLoadingBanks(false);
      setIsCreatingBank(false);
      setIsUploading(false);
      setIsAuthenticating(false);
    } else {
        // Reset only non-auth state when opening, keep password field empty
        setPassword('');
        setValidatedPassword(null); // Reset validated password
        setIsAuthenticated(false); // Start unauthenticated
        // Removed authError reset
        // setAuthError(null);
        // Other states will be reset/fetched upon authentication
    }
  }, [isOpen]);

  const handleAuthenticate = async () => {
      // Removed authError reset
      // setAuthError(null);
      setIsAuthenticating(true);
      const currentPassword = password; // Store password before clearing
      setPassword(''); // Clear password field immediately

      try {
          const loginSuccess = await api.loginAdmin(currentPassword);
          if (loginSuccess) {
              setIsAuthenticated(true);
              setValidatedPassword(currentPassword); // Store the validated password
              toast.success("관리자 인증 성공!");
          } else {
              // This case might not be reached if loginAdmin throws an error on failure
              // setAuthError("인증에 실패했습니다. (알 수 없는 오류)"); // Removed
              toast.error("인증 실패", { description: "알 수 없는 오류가 발생했습니다." });
              setIsAuthenticated(false);
              setValidatedPassword(null);
          }
      } catch (err: any) {
          // Catch errors thrown by loginAdmin (e.g., "Invalid password.")
          console.error("Authentication failed:", err);
          // setAuthError(err.message || "인증 중 오류가 발생했습니다."); // Removed
          toast.error("인증 실패", { description: err.message || "인증 중 오류가 발생했습니다." });
          setIsAuthenticated(false);
          setValidatedPassword(null);
      } finally {
          setIsAuthenticating(false);
      }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
          e.preventDefault();
          handleAuthenticate();
      }
  };


  const handleCreateBank = async () => {
    if (!isAuthenticated || !validatedPassword) {
        toast.error("인증이 필요합니다.");
        return;
    }
    if (!newBankTitle.trim()) {
      toast.warning("새 문제 은행 제목을 입력하세요.");
      return;
    }
    setIsCreatingBank(true);
    setError(null);
    try {
      // Pass the validated password
      const createdBank = await api.createQuestionBankAdmin(newBankTitle.trim(), validatedPassword);

      if (createdBank && typeof createdBank.question_bank_id === 'number') {
          toast.success(`문제 은행 "${newBankTitle}" 생성 완료!`);
          setNewBankTitle('');
          setSelectedBankId(String(createdBank.question_bank_id));
          await fetchBanks(); // Refresh list
      } else {
           console.error("API returned success status but missing or invalid data:", createdBank);
           throw new Error("문제 은행 생성 응답이 없거나 형식이 잘못되었습니다.");
      }
    } catch (err: any) {
      console.error("Failed to create question bank:", err);
      // Handle specific auth error from API if needed
      if (err.message.includes("Authentication failed")) {
          setError("인증 오류: API 호출 실패. 다시 인증해주세요.");
          setIsAuthenticated(false); // Force re-authentication
          setValidatedPassword(null);
      } else {
          setError(err.message || "Failed to create question bank.");
      }
      toast.error("문제 은행 생성 실패", { description: err.message });
    } finally {
      setIsCreatingBank(false);
    }
  };

  const handleUpload = async () => {
     if (!isAuthenticated || !validatedPassword) {
        toast.error("인증이 필요합니다.");
        return;
    }
    if (!selectedBankId) {
      toast.warning("문제를 업로드할 문제 은행을 선택하세요.");
      return;
    }
    if (!jsonData.trim()) {
      toast.warning("업로드할 질문 JSON 데이터를 입력하세요.");
      return;
    }

    let parsedData: UserInputQuestion[];
    try {
      parsedData = JSON.parse(jsonData);
      if (!Array.isArray(parsedData)) {
        throw new Error("JSON 데이터는 배열 형태여야 합니다.");
      }
      // Add validation for the structure of each question object in the array
      parsedData.forEach((item, index) => {
          if (typeof item.question !== 'string' || !Array.isArray(item.answers) || typeof item.explain !== 'string') {
              throw new Error(`JSON 배열의 ${index + 1}번째 항목 형식이 잘못되었습니다. 'question'(string), 'answers'(array), 'explain'(string) 필드가 필요합니다.`);
          }
          item.answers.forEach((answer, ansIndex) => {
              if (!Array.isArray(answer) || answer.length !== 2 || typeof answer[0] !== 'string' || typeof answer[1] !== 'boolean') {
                  throw new Error(`JSON 배열의 ${index + 1}번째 항목의 ${ansIndex + 1}번째 'answers' 형식이 잘못되었습니다. [string, boolean] 형태여야 합니다.`);
              }
          });
      });

    } catch (err: any) {
      console.error("Invalid JSON data:", err);
      setError(`잘못된 JSON 형식: ${err.message}`);
      toast.error("JSON 파싱 또는 유효성 검사 오류", { description: `잘못된 JSON 형식: ${err.message}` });
      return;
    }

    // Use the updated transform function
    const questionsToUpload = transformQuestionData(parsedData);
    if (questionsToUpload.length === 0) {
        toast.warning("업로드할 질문이 없습니다.");
        return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setTotalToUpload(questionsToUpload.length);

    let successCount = 0;
    let errorCount = 0;
    let authFailed = false;

    for (let i = 0; i < questionsToUpload.length; i++) {
      try {
        // Pass the validated password and the transformed data
        await api.uploadSingleQuestionAdmin(Number(selectedBankId), questionsToUpload[i], validatedPassword);
        successCount++;
      } catch (err: any) {
        console.error(`Error uploading question ${i + 1}:`, err);
        errorCount++;
        // Check for auth error specifically
        if (err.message.includes("Authentication failed")) {
            authFailed = true;
            setError("인증 오류: 업로드 중단됨. 다시 인증해주세요.");
            toast.error("인증 오류", { description: "업로드가 중단되었습니다. 다시 인증해주세요." });
            setIsAuthenticated(false); // Force re-authentication
            setValidatedPassword(null);
            break; // Stop upload process
        }
        // Optionally log other errors or stop on first error
      }
      setUploadProgress(i + 1);
      // Add a small delay between uploads if needed to avoid rate limiting
      // await new Promise(resolve => setTimeout(resolve, 50));
    }

    setIsUploading(false);

    if (!authFailed) {
        if (errorCount === 0) {
            toast.success(`총 ${successCount}개의 질문 업로드 완료!`);
            setJsonData(''); // Clear JSON input on full success
            fetchBanks(); // Refresh bank list (updates question counts)
        } else {
            toast.error(`${errorCount}개 질문 업로드 실패`, {
                description: `총 ${totalToUpload}개 중 ${successCount}개 성공, ${errorCount}개 실패했습니다. 콘솔 로그를 확인하세요.`,
            });
            setError(`${errorCount}개 질문 업로드 실패. 자세한 내용은 콘솔을 확인하세요.`);
            fetchBanks(); // Refresh counts even on partial failure
        }
    }
  };

  // Combined loading state
  const isLoading = isLoadingBanks || isCreatingBank || isUploading || isAuthenticating;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>관리자: 문제 업로드</DialogTitle>
          {!isAuthenticated && (
              <DialogDescription>
                  관리자 기능을 사용하려면 비밀번호를 입력하세요.
              </DialogDescription>
          )}
           {isAuthenticated && (
              <DialogDescription>
                  새 문제 은행을 생성하거나 기존 은행을 선택하고, JSON 형식으로 질문을 대량 업로드합니다.
              </DialogDescription>
           )}
        </DialogHeader>

        {/* Authentication Section */}
        {!isAuthenticated && (
            // Removed border-b class from this div
            <div className="px-6 py-4 space-y-4">
                 <Label htmlFor="admin-password">관리자 비밀번호</Label>
                 <div className="flex items-center gap-2">
                     <Input
                         id="admin-password"
                         type="password"
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         onKeyDown={handlePasswordKeyDown}
                         placeholder="비밀번호 입력"
                         disabled={isAuthenticating}
                         className="flex-1"
                     />
                     <Button onClick={handleAuthenticate} disabled={isAuthenticating || !password}>
                         {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                         <span className="ml-2">인증</span>
                     </Button>
                 </div>
                 {/* Removed Alert component for authError */}
                 {/* {authError && ( ... )} */}
            </div>
        )}

        {/* Main Content Area (Conditional) */}
        {isAuthenticated && (
            <>
                {error && ( // General error display for bank/upload operations
                // Removed mx-6 class to fix overflow
                <Alert variant="destructive" className="my-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>오류</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                )}
                {/* Adjusted ScrollArea padding/margin to account for Alert margin removal */}
                <ScrollArea className="flex-1 px-6 pr-[calc(1.5rem+8px)] -mr-2">
                    <div className="grid gap-6 py-4">
                    {/* Bank Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="question-bank-select">1. 문제 은행 선택 또는 생성</Label>
                        {isLoadingBanks ? (
                            <div className="flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>문제 은행 로딩 중...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Select
                                    value={selectedBankId}
                                    onValueChange={setSelectedBankId}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="question-bank-select" className="flex-1">
                                    <SelectValue placeholder="기존 문제 은행 선택..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {availableBanks.map((bank) => (
                                        <SelectItem key={bank.id} value={String(bank.id)}>
                                        {bank.name} ({bank.questions} 문제)
                                        </SelectItem>
                                    ))}
                                    {availableBanks.length === 0 && <SelectItem value="nobanks" disabled>사용 가능한 문제 은행 없음</SelectItem>}
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                    <Input
                                        id="new-bank-title"
                                        placeholder="새 문제 은행 제목"
                                        value={newBankTitle}
                                        onChange={(e) => setNewBankTitle(e.target.value)}
                                        className="flex-1"
                                        disabled={isLoading}
                                    />
                                    <Button onClick={handleCreateBank} disabled={isLoading || !newBankTitle.trim()} size="icon">
                                        {isCreatingBank ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                                        <span className="sr-only">새 문제 은행 생성</span>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* JSON Input */}
                    <div className="space-y-2">
                        <Label htmlFor="json-data">2. 질문 데이터 (JSON)</Label>
                        <Textarea
                        id="json-data"
                        // Updated placeholder to reflect the expected user input format
                        placeholder='[{"question": "질문 내용...", "answers": [["정답 텍스트", true], ["오답 텍스트", false]], "explain": "해설 내용..."}, ...]'
                        value={jsonData}
                        onChange={(e) => setJsonData(e.target.value)}
                        rows={10}
                        className="font-mono text-xs"
                        disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                        위 형식에 맞는 JSON 배열을 입력하세요. 'answers'는 [답변 텍스트, 정답 여부(boolean)] 쌍의 배열입니다. 'explain' 필드는 API로 전송되지 않습니다.
                        </p>
                    </div>

                    {/* Upload Progress */}
                    {isUploading && (
                        <div className="space-y-1">
                            <Label>업로드 진행률</Label>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <progress value={uploadProgress} max={totalToUpload} className="w-full h-2 [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg   [&::-webkit-progress-bar]:bg-slate-300 [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary" />
                                <span>{uploadProgress} / {totalToUpload}</span>
                            </div>
                        </div>
                    )}
                    </div>
                </ScrollArea>

                <DialogFooter className="px-6 pb-6 pt-4 border-t">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isLoading}>
                        취소
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        onClick={handleUpload}
                        disabled={isLoading || !selectedBankId || !jsonData.trim()}
                    >
                        {isUploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            업로드 중...
                        </>
                        ) : (
                        <>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            질문 업로드
                        </>
                        )}
                    </Button>
                </DialogFooter>
            </>
        )}

        {/* Footer for unauthenticated state */}
         {!isAuthenticated && (
             <DialogFooter className="px-6 pb-6 pt-4 border-t">
                 <DialogClose asChild>
                     <Button type="button" variant="outline">
                         취소
                     </Button>
                 </DialogClose>
                 {/* Optionally disable auth button here too if needed */}
                 {/* <Button onClick={handleAuthenticate} disabled={isAuthenticating || !password}> ... </Button> */}
             </DialogFooter>
         )}

      </DialogContent>
    </Dialog>
  );
};

export default AdminUploadDialog;

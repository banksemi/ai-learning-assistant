import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import QuizPage from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";
import CalculatingResultsPage from "./pages/CalculatingResultsPage";
import NotFound from "./pages/NotFound";
import { QuizProvider } from "./context/QuizContext";
import { usePenInputHandler } from '@/hooks/usePenInputHandler'; // Updated import path and hook name

const queryClient = new QueryClient();

const App = () => {
  // Activate the pen input handling logic by calling the custom hook
  usePenInputHandler(); // Updated hook call

  // The rest of the App component remains the same
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <QuizProvider>
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/calculating-results" element={<CalculatingResultsPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </QuizProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

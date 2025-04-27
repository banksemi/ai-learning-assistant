{/* Removed shadcn/ui Toaster import */}
{/* import { Toaster } from "@/components/ui/toaster"; */}
import { Toaster as Sonner } from "@/components/ui/sonner"; // Keep sonner import
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import QuizPage from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";
import CalculatingResultsPage from "./pages/CalculatingResultsPage";
import NotFound from "./pages/NotFound";
import { QuizProvider } from "./context/QuizContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <QuizProvider>
          {/* Removed shadcn/ui <Toaster /> */}
          <Sonner /> {/* Re-added sonner <Sonner /> */}
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

export default App;

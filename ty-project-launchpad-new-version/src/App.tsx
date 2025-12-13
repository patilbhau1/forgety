
import { Toaster } from "@/components/ui/toaster";
import BottomNavigation from "@/components/BottomNavigation";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import useScrollToTop from "./hooks/useScrollToTop";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import PastWork from "./pages/PastWork";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import IdeaGenerator from "./pages/IdeaGenerator";
import ApprovedIdeaPage from "./pages/ApprovedIdeaPage";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import ChooseIdeaPath from "./pages/ChooseIdeaPath";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Synopsis from "./pages/Synopsis";
import BlackBook from "./pages/BlackBook";
import Meet from "./pages/Meet";
import Contact from "./pages/Contact";
import PlanSelection from "./pages/PlanSelection";
import ProjectSetup from "./pages/ProjectSetup";
import RequestAdminHelp from "./pages/RequestAdminHelp";

const queryClient = new QueryClient();

// Component to handle scroll to top on route changes
const AppContent = () => {
  useScrollToTop();
  
  return (
    <>
      <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/past-work" element={<PastWork />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/idea-generator" element={<IdeaGenerator />} />
          <Route path="/approved-idea" element={<ApprovedIdeaPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/choose-idea-path" element={<ChooseIdeaPath />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/synopsis" element={<Synopsis />} />
          <Route path="/black-book" element={<BlackBook />} />
          <Route path="/meet" element={<Meet />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/select-plan" element={<PlanSelection />} />
          <Route path="/project-setup" element={<ProjectSetup />} />
          <Route path="/request-admin-help" element={<RequestAdminHelp />} />
                    <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNavigation />
      </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

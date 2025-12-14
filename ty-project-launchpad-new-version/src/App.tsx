import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import BottomNavigation from "@/components/BottomNavigation";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Store the attempted URL for redirecting after login
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    return (
      <Navigate 
        to="/login" 
        state={{ 
          from: location.pathname !== '/login' ? location : '/' 
        }} 
        replace 
      />
    );
  }

  return <>{children}</>;
};

// Protected routes configuration
const protectedRoutes = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/orders', element: <Orders /> },
  { path: '/synopsis', element: <Synopsis /> },
  { path: '/black-book', element: <BlackBook /> },
  { path: '/meet', element: <Meet /> },
  { path: '/select-plan', element: <PlanSelection /> },
  { path: '/project-setup', element: <ProjectSetup /> },
  { path: '/request-admin-help', element: <RequestAdminHelp /> },
  { path: '/choose-idea-path', element: <ChooseIdeaPath /> },
  { path: '/approved-idea', element: <ApprovedIdeaPage /> },
];

const AppContent = () => {
  useScrollToTop();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prevIsAuthenticated = useRef<boolean | null>(null);

  // Handle authentication state changes
  useEffect(() => {
    // Only run this effect when isAuthenticated changes and we're not in loading state
    if (prevIsAuthenticated.current !== null && !isLoading) {
      if (prevIsAuthenticated.current && !isAuthenticated) {
        console.log('[App] User logged out, redirecting to login');
        navigate('/login', { 
          state: { from: location },
          replace: true 
        });
      }
    }
    prevIsAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, isLoading, navigate, location]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/past-work" element={<PastWork />} />
        <Route path="/idea-generator" element={<IdeaGenerator />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {protectedRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <ProtectedRoute>
                {route.element}
              </ProtectedRoute>
            }
          />
        ))}
        
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
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

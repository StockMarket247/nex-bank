import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "@/i18n/config";

import Landing from "./pages/Landing";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "./pages/client/Dashboard";
import Accounts from "./pages/client/Accounts";
import Transfers from "./pages/client/Transfers";
import Cards from "./pages/client/Cards";
import Notifications from "./pages/client/Notifications";
import Profile from "./pages/client/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/auth/signin" />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/auth/signin" element={<SignIn />} />
              <Route path="/auth/signup" element={<SignUp />} />
              
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="transfers" element={<Transfers />} />
                <Route path="cards" element={<Cards />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
              </Route>
              
              <Route path="/admin" element={<ProtectedRoute adminOnly><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

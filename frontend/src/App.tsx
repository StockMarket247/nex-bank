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
import AccountLimits from "./pages/client/AccountLimits";
import Transfers from "./pages/client/Transfers";
import Transactions from "./pages/client/Transactions";
// import Cards from "./pages/client/Cards";
import Notifications from "./pages/client/Notifications";
import Profile from "./pages/client/Profile";
import Security from "./pages/client/Security";
import Support from "./pages/client/Support";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTransfers from "./pages/admin/AdminTransfers";
import PendingTransfers from "./pages/admin/PendingTransfers";
import UserManagement from "./pages/admin/UserManagement";
import AccountManagement from "./pages/admin/AccountManagement";
import TransactionExplorer from "./pages/admin/TransactionExplorer";
import AuditLogs from "./pages/admin/AuditLogs";
import AdminNotifications from "./pages/admin/Notifications";
import VerificationManagement from "./pages/admin/VerificationManagement";
import AdminSupport from "./pages/admin/Support";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, adminOnly = false, userOnly = false }: { children: React.ReactNode; adminOnly?: boolean; userOnly?: boolean }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  // Wait for auth state to load from localStorage before checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) return <Navigate to="/auth/signin" />;
  
  // Admin-only routes: redirect non-admins to /dashboard
  if (adminOnly && user?.type !== 'admin') return <Navigate to="/dashboard" />;
  
  // User-only routes: redirect admins to /admin
  if (userOnly && user?.type === 'admin') return <Navigate to="/admin" />;
  
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
              
              <Route path="/dashboard" element={<ProtectedRoute userOnly><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="account-limits" element={<AccountLimits />} />
                <Route path="transfers" element={<Transfers />} />
                <Route path="transactions" element={<Transactions />} />
                {/* <Route path="cards" element={<Cards />} /> */}
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
                <Route path="security" element={<Security />} />
                <Route path="support" element={<Support />} />
              </Route>
              
              <Route path="/admin" element={<ProtectedRoute adminOnly><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="transfers" element={<AdminTransfers />} />
                <Route path="pending-transfers" element={<PendingTransfers />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="accounts" element={<AccountManagement />} />
                <Route path="transactions" element={<TransactionExplorer />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="audit" element={<AuditLogs />} />
                <Route path="verifications" element={<VerificationManagement />} />
                <Route path="support" element={<AdminSupport />} />
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

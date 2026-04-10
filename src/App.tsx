import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DeviationProvider } from "@/contexts/DeviationContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppLayout } from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import NewRequestPage from "@/pages/NewRequestPage";
import MyRequestsPage from "@/pages/MyRequestsPage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import WorkflowTrackerPage from "@/pages/WorkflowTrackerPage";
import AuditLogPage from "@/pages/AuditLogPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import PolicyLibraryPage from "@/pages/PolicyLibraryPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <ThemeProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <DeviationProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/new-request" element={<NewRequestPage />} />
                  <Route path="/my-requests" element={<MyRequestsPage />} />
                  <Route path="/approvals" element={<ApprovalsPage />} />
                  <Route path="/tracker" element={<WorkflowTrackerPage />} />
                  <Route path="/audit" element={<AuditLogPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/policies" element={<PolicyLibraryPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </DeviationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;

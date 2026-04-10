import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route element={<AppLayout />}>
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
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

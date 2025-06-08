
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { InvoiceProvider } from "./contexts/InvoiceContext";
import RequireAuth from "./components/auth/RequireAuth";
import MainLayout from "./components/layouts/MainLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import InvoiceGenerator from "./pages/InvoiceGenerator";
import InvoicePreview from "./pages/InvoicePreview";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <InvoiceProvider>
          <TooltipProvider>
            <Toaster />
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Index />} />
                <Route path="login" element={<Login />} />
                <Route 
                  path="dashboard" 
                  element={
                    <RequireAuth>
                      <Dashboard />
                    </RequireAuth>
                  } 
                />
                <Route 
                  path="invoice/new" 
                  element={
                    <RequireAuth>
                      <InvoiceGenerator />
                    </RequireAuth>
                  } 
                />
                <Route 
                  path="invoice/edit/:id" 
                  element={
                    <RequireAuth>
                      <InvoiceGenerator />
                    </RequireAuth>
                  } 
                />
                <Route 
                  path="invoice/preview/:id" 
                  element={
                    <RequireAuth>
                      <InvoicePreview />
                    </RequireAuth>
                  } 
                />
                <Route 
                  path="profile" 
                  element={
                    <RequireAuth>
                      <Profile />
                    </RequireAuth>
                  } 
                />
                <Route 
                  path="reports" 
                  element={
                    <RequireAuth>
                      <Reports />
                    </RequireAuth>
                  } 
                />
                <Route 
                  path="settings" 
                  element={
                    <RequireAuth>
                      <Settings />
                    </RequireAuth>
                  } 
                />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </TooltipProvider>
        </InvoiceProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

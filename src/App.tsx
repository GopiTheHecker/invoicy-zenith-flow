
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { InvoiceProvider } from "./contexts/InvoiceContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import InvoiceGenerator from "./pages/InvoiceGenerator";
import InvoicePreview from "./pages/InvoicePreview";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/layouts/MainLayout";
import RequireAuth from "./components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <InvoiceProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route element={<RequireAuth />}>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/invoice/new" element={<InvoiceGenerator />} />
                  <Route path="/invoice/edit/:id" element={<InvoiceGenerator />} />
                  <Route path="/invoice/preview/:id" element={<InvoicePreview />} />
                </Route>
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </InvoiceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

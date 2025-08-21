
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import Index from "./pages/Index";
import Accounts from "./pages/Accounts";
import FinancialInsight from "./pages/FinancialInsight";
import Goals from "./pages/Goals";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <Layout>
              <Index />
            </Layout>
          } />
          <Route path="/accounts" element={
            <Layout>
              <Accounts />
            </Layout>
          } />
          <Route path="/financial-insight" element={
            <Layout>
              <FinancialInsight />
            </Layout>
          } />
          <Route path="/goals" element={
            <Layout>
              <Goals />
            </Layout>
          } />
          <Route path="/calendar" element={
            <Layout>
              <Calendar />
            </Layout>
          } />
          <Route path="/settings" element={
            <Layout>
              <Settings />
            </Layout>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

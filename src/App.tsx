import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ColorPaletteProvider } from "@/contexts/ColorPaletteContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { FloatingChatProvider } from "@/contexts/FloatingChatContext";
import FloatingChat from "@/components/chat/FloatingChat";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Accounts from "./pages/Accounts";
import AccountDetail from "./pages/AccountDetail";
import Budget from "./pages/Budget";
import Compare from "./pages/Compare";
import Scan from "./pages/Scan";
import Goals from "./pages/Goals";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import AddToList from "./pages/AddToList";
import Reports from "./pages/Reports";
import GoogleSheetsCallback from "./pages/GoogleSheetsCallback";
import Landing from "./pages/Landing";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
      <ColorPaletteProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <FloatingChatProvider>
              <FloatingChat />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      <Index />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/accounts" element={
                  <ProtectedRoute>
                    <Layout>
                      <Accounts />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/accounts/:accountId" element={
                  <ProtectedRoute>
                    <Layout>
                      <AccountDetail />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/budget" element={
                  <ProtectedRoute>
                    <Layout>
                      <Budget />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/compare" element={
                  <ProtectedRoute>
                    <Layout>
                      <Compare />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/scan" element={
                  <ProtectedRoute>
                    <Layout>
                      <Scan />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/grocery-budget" element={<Navigate to="/budget" replace />} />
                <Route path="/add-to-list" element={
                  <ProtectedRoute>
                    <Layout>
                      <AddToList />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/chat" element={
                  <ProtectedRoute>
                    <Layout>
                      <Chat />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/goals" element={
                  <ProtectedRoute>
                    <Layout>
                      <Goals />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <Layout>
                      <Reports />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/calendar" element={
                  <ProtectedRoute>
                    <Layout>
                      <Calendar />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/auth/google-sheets/callback" element={
                  <ProtectedRoute>
                    <GoogleSheetsCallback />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </FloatingChatProvider>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ColorPaletteProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

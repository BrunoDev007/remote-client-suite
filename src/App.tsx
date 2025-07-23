import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Plans from "./pages/Plans";
import Financial from "./pages/Financial";
import RemoteAccess from "./pages/RemoteAccess";
import { AppLayout } from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes with Layout */}
            <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><AppLayout><Clients /></AppLayout></ProtectedRoute>} />
            <Route path="/plans" element={<ProtectedRoute><AppLayout><Plans /></AppLayout></ProtectedRoute>} />
            <Route path="/financial" element={<ProtectedRoute><AppLayout><Financial /></AppLayout></ProtectedRoute>} />
            <Route path="/remote-access" element={<ProtectedRoute><AppLayout><RemoteAccess /></AppLayout></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

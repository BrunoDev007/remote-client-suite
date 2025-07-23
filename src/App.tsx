import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
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
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes with Layout */}
          <Route path="/clients" element={<AppLayout><Clients /></AppLayout>} />
          <Route path="/plans" element={<AppLayout><Plans /></AppLayout>} />
          <Route path="/financial" element={<AppLayout><Financial /></AppLayout>} />
          <Route path="/remote-access" element={<AppLayout><RemoteAccess /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><div className="p-6"><h1 className="text-2xl font-bold">Configurações</h1><p>Em desenvolvimento...</p></div></AppLayout>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

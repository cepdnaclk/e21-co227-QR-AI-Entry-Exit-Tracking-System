import { Toaster } from "@/components/ui/toaster"; // UI component for showing toast notifications
import { Toaster as Sonner } from "@/components/ui/sonner"; // Another toast notification system (optional)
import { TooltipProvider } from "@/components/ui/tooltip"; // Provides tooltips across the app
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // React Query for server state management
import { BrowserRouter, Routes, Route } from "react-router-dom"; // React Router for navigation
import Scanner from "./pages/Scanner"; // Main scanner page
import NotFound from "./pages/NotFound"; // 404 page
import BuildingManagement from "./pages/BuildingManagement"; // Building management page
import CountsPage from "@/pages/CountsPage"; // Page showing live building counts

const queryClient = new QueryClient(); // Initialize React Query client

const App = () => (
  // Provide React Query client to the entire app
  <QueryClientProvider client={queryClient}>
    {/* Wrap app with TooltipProvider to enable tooltips */}
    <TooltipProvider>

      {/* Global toast notifications */}
      <Toaster />
      <Sonner />

      {/* BrowserRouter enables client-side routing */}
      <BrowserRouter>
        <Routes>
          {/* Define all valid routes here */}
          <Route path="/" element={<Scanner />} /> {/* Main QR scanner page */}
          <Route path="/buildings" element={<BuildingManagement />} /> {/* Manage buildings */}
          <Route path="/counts" element={<CountsPage />} /> {/* View live building counts */}

          {/* Catch-all route for undefined paths */}
          <Route path="*" element={<NotFound />} /> {/* Shows 404 page for unknown URLs */}
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

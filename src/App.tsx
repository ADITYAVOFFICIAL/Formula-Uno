import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Analytics from "./pages/Analytics";
import DriverProfile from "./pages/DriverProfile";
import TeamProfile from "./pages/TeamProfile";
import CircuitProfile from "./pages/CircuitProfile";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";
import Teams from "./pages/Teams";
import Drivers from "./pages/Drivers";
import Standings from "./pages/Standings"; // Import the new Standings page

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/standings" element={<Standings />} /> {/* Add the new Standings route */}
          <Route path="/driver/:driverId" element={<DriverProfile />} />
          <Route path="/team/:teamId" element={<TeamProfile />} />
          <Route path="/circuit/:circuitName" element={<CircuitProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
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
import Predictions from "./pages/Predictions"; // Import the new Predictions page

const queryClient = new QueryClient();

const App = () => {
  const [isMuted, setIsMuted] = useState(true); // Start muted to avoid autoplay block
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Audio Autoplay Logic ---
  useEffect(() => {
    audioRef.current = new Audio('/max.mp3');
    audioRef.current.loop = true;
    audioRef.current.muted = true; // Start muted to bypass autoplay restrictions
    audioRef.current.volume = 0.6; // Set volume to 60%

    const playAudio = async () => {
      try {
        await audioRef.current?.play();
        console.log("Audio ready - click the volume button to unmute");
      } catch (error) {
        console.error("Audio autoplay was prevented by the browser.", error);
        // Try playing on first user interaction
        const startAudioOnInteraction = async () => {
          if (audioRef.current) {
            try {
              await audioRef.current.play();
              console.log("Audio started after user interaction");
              document.removeEventListener('click', startAudioOnInteraction);
            } catch (e) {
              console.error("Still couldn't play audio:", e);
            }
          }
        };
        document.addEventListener('click', startAudioOnInteraction, { once: true });
      }
    };
    playAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !audioRef.current.muted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navigation />
          {/* Global Audio Control Button */}
          <button
            onClick={toggleMute}
            className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110"
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          </button>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/standings" element={<Standings />} /> {/* Add the new Standings route */}
            <Route path="/predictions" element={<Predictions />} /> {/* Add the new Predictions route */}
            <Route path="/driver/:driverId" element={<DriverProfile />} />
            <Route path="/team/:teamId" element={<TeamProfile />} />
            <Route path="/circuit/:circuitName" element={<CircuitProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, Flag, Users, Volume2, VolumeX } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";

// --- Sub-components for a cleaner main component ---

const StatCard = ({ icon: Icon, value, label }) => (
  <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
    <Card className="bg-card/80 backdrop-blur-md border-border/50 p-6">
      <Icon className="h-10 w-10 text-primary mx-auto mb-4" />
      <p className="text-4xl font-bold">{value}</p>
      <p className="text-muted-foreground">{label}</p>
    </Card>
  </motion.div>
);

const TeamCard = ({ team }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.5 }}
    className="h-full"
  >
    <Card className="overflow-hidden border-2 border-border/50 hover:border-primary transition-all duration-300 group rounded-2xl h-full flex flex-col shadow-lg hover:shadow-primary/20">
      <CardContent className="p-0 flex-grow flex flex-col">
        <Link to={`/team/${team.id}`} className="block">
          <div className="p-6 relative" style={{ background: `linear-gradient(135deg, hsl(${team.color}, 50%, 20%) 0%, hsl(${team.color}, 50%, 10%) 100%)` }}>
            <h3 className="text-2xl font-bold text-white relative z-10">{team.name}</h3>
            <p className="text-white/70 text-sm relative z-10">{team.country}</p>
          </div>
        </Link>
        <div className="p-4 space-y-3 flex-grow">
          {team.drivers.map((driver) => (
            <Link to={`/driver/${driver.id}`} key={driver.id} className="block">
              <div className="flex items-center justify-between p-3 bg-card-foreground/5 rounded-lg hover:bg-card-foreground/10 transition-colors group/driver">
                <div className="flex items-center gap-4">
                  <div className="font-bold text-lg w-8 text-center" style={{ color: `hsl(${team.color})` }}>
                    {driver.number}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{driver.name}</div>
                    <div className="text-sm text-muted-foreground">{driver.nationality}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">{driver.points}</div>
                  <div className="text-xs text-muted-foreground font-semibold">PTS</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// --- Main Home Component ---

const Home = () => {
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef(null);

  // --- Audio Autoplay Logic ---
  useEffect(() => {
    audioRef.current = new Audio('/max.mp3');
    audioRef.current.loop = true;
    audioRef.current.muted = false;

    const playAudio = async () => {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error("Audio autoplay was prevented by the browser.", error);
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

  // --- Data Memoization for Performance ---
  // Removed usage of driversData and teamsData

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative h-[90vh] md:h-screen flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute z-0 w-auto min-w-full min-h-full max-w-none"
        >
          <source src="/max.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        <div className="container mx-auto px-4 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-6 drop-shadow-2xl">
              The Pinnacle of Motorsport
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-10 drop-shadow-lg">
              Explore the high-octane world of Formula 1. Get the latest on your favorite drivers, teams, and the intense battle for the championship.
            </p>
            <div className="flex justify-center gap-4">
              {/* Removed Top Driver button due to missing driversData */}
              <Button asChild size="lg" variant="secondary" className="text-lg">
                <Link to="/teams">
                  Explore Teams
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMute}
          className="absolute bottom-6 right-6 z-20 bg-black/30 text-white border-white/50 hover:bg-white/20"
        >
          {isMuted ? <VolumeX /> : <Volume2 />}
          <span className="sr-only">Toggle Sound</span>
        </Button>
      </section>

      <section className="container mx-auto px-4 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {/* Removed StatCards for teamsData and driversData */}
          <StatCard icon={Flag} value="24" label="Races" />
        </div>
      </section>

      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Constructors & Drivers</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                A grid of titans. Each team and driver pairing is a unique force on the track, pushing the limits of engineering and skill.
            </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Removed TeamCard grid due to missing teamsWithDrivers */}
        </div>
      </section>
    </div>
  );
};

export default Home;
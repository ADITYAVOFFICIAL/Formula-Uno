import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Trophy, Flag, Users, MapPin, Calendar, Timer, Zap, Mountain, Waves } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import React, { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

// --- Configuration ---
const API_BASE_URL = "http://127.0.0.1:8000";
const LATEST_YEAR = 2025;

// --- Type Definitions ---
interface DriverStanding {
  position: number;
  points: number;
  wins: number;
  driverId: string;
  driverNumber: number;
  givenName: string;
  familyName: string;
  constructorNames: string[];
}

interface ConstructorStanding {
  position: number;
  points: number;
  wins: number;
  constructorId: string;
  constructorName: string;
}

interface ScheduleEvent {
  RoundNumber: number;
  Country: string;
  Location: string;
  EventName: string;
  EventDate: string;
  Session5Date: string;
}

interface TrackInfo {
  name: string;
  country: string;
  location: string;
  round: number;
  difficulty: 'easy' | 'medium' | 'hard';
  fastestLap?: {
    time: string;
    driver: string;
    year: number;
  };
}

// --- Track Difficulty Data (Based on Historical Data and Track Characteristics) ---
const TRACK_DIFFICULTY_MAP: { [key: string]: 'easy' | 'medium' | 'hard' } = {
  'Bahrain': 'medium',
  'Jeddah': 'hard',
  'Melbourne': 'medium',
  'Shanghai': 'medium',
  'Miami': 'easy',
  'Imola': 'hard',
  'Monaco': 'hard',
  'Montreal': 'medium',
  'Barcelona': 'medium',
  'Spielberg': 'easy',
  'Silverstone': 'hard',
  'Budapest': 'medium',
  'Spa-Francorchamps': 'hard',
  'Zandvoort': 'medium',
  'Monza': 'easy',
  'Baku': 'hard',
  'Singapore': 'hard',
  'Austin': 'medium',
  'Mexico City': 'medium',
  'São Paulo': 'hard',
  'Las Vegas': 'medium',
  'Lusail': 'easy',
  'Yas Marina': 'medium',
};

// --- Fastest Lap Records (Historical Data - Update with actual records) ---
const FASTEST_LAP_RECORDS: { [key: string]: { time: string; driver: string; year: number } } = {
  'Bahrain': { time: '1:31.447', driver: 'Pedro de la Rosa', year: 2005 },
  'Jeddah': { time: '1:30.734', driver: 'Lewis Hamilton', year: 2021 },
  'Melbourne': { time: '1:20.260', driver: 'Charles Leclerc', year: 2024 },
  'Shanghai': { time: '1:32.238', driver: 'Michael Schumacher', year: 2004 },
  'Miami': { time: '1:29.708', driver: 'Max Verstappen', year: 2023 },
  'Imola': { time: '1:15.484', driver: 'Lewis Hamilton', year: 2020 },
  'Monaco': { time: '1:12.909', driver: 'Lewis Hamilton', year: 2021 },
  'Montreal': { time: '1:13.078', driver: 'Valtteri Bottas', year: 2019 },
  'Barcelona': { time: '1:18.149', driver: 'Max Verstappen', year: 2023 },
  'Spielberg': { time: '1:05.619', driver: 'Carlos Sainz', year: 2020 },
  'Silverstone': { time: '1:27.097', driver: 'Max Verstappen', year: 2020 },
  'Budapest': { time: '1:16.627', driver: 'Lewis Hamilton', year: 2020 },
  'Spa-Francorchamps': { time: '1:46.286', driver: 'Valtteri Bottas', year: 2018 },
  'Zandvoort': { time: '1:11.097', driver: 'Lewis Hamilton', year: 2021 },
  'Monza': { time: '1:21.046', driver: 'Rubens Barrichello', year: 2004 },
  'Baku': { time: '1:43.009', driver: 'Charles Leclerc', year: 2019 },
  'Singapore': { time: '1:41.905', driver: 'Lewis Hamilton', year: 2023 },
  'Austin': { time: '1:36.169', driver: 'Charles Leclerc', year: 2019 },
  'Mexico City': { time: '1:17.774', driver: 'Valtteri Bottas', year: 2021 },
  'São Paulo': { time: '1:10.540', driver: 'Valtteri Bottas', year: 2018 },
  'Las Vegas': { time: '1:35.490', driver: 'Oscar Piastri', year: 2023 },
  'Lusail': { time: '1:24.319', driver: 'Max Verstappen', year: 2023 },
  'Yas Marina': { time: '1:26.103', driver: 'Max Verstappen', year: 2021 },
};

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

const TrackCard = ({ track }: { track: TrackInfo }) => {
  const difficultyConfig = {
    easy: { color: 'bg-green-500/20 text-green-500 border-green-500/50', icon: Waves, label: 'Easy' },
    medium: { color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50', icon: Zap, label: 'Medium' },
    hard: { color: 'bg-red-500/20 text-red-500 border-red-500/50', icon: Mountain, label: 'Hard' }
  };

  const config = difficultyConfig[track.difficulty];
  const DifficultyIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{track.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{track.location}, {track.country}</span>
              </div>
            </div>
            <Badge variant="outline" className={`${config.color} ml-2`}>
              <DifficultyIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Round</span>
              <span className="font-semibold">{track.round}</span>
            </div>
            {track.fastestLap && (
              <>
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Timer className="h-3 w-3" />
                    <span>Fastest Lap Record</span>
                  </div>
                  <div className="font-mono text-lg font-bold text-primary">{track.fastestLap.time}</div>
                  <div className="text-sm text-muted-foreground">
                    {track.fastestLap.driver} ({track.fastestLap.year})
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const LoadingSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <Card key={i}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// --- Main Home Component ---

const Home = () => {
  // Scroll to top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // --- Fetch Data from API ---
  const { data: drivers, isLoading: isLoadingDrivers } = useQuery<DriverStanding[]>({
    queryKey: ["driverStandings", LATEST_YEAR],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/standings/drivers/${LATEST_YEAR}`);
      if (!response.ok) throw new Error("Failed to fetch drivers");
      return response.json();
    },
  });

  const { data: teams, isLoading: isLoadingTeams } = useQuery<ConstructorStanding[]>({
    queryKey: ["constructorStandings", LATEST_YEAR],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/standings/constructors/${LATEST_YEAR}`);
      if (!response.ok) throw new Error("Failed to fetch teams");
      return response.json();
    },
  });

  const { data: schedule, isLoading: isLoadingSchedule } = useQuery<ScheduleEvent[]>({
    queryKey: ["schedule", LATEST_YEAR],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/schedule/${LATEST_YEAR}`);
      if (!response.ok) throw new Error("Failed to fetch schedule");
      return response.json();
    },
  });

  // --- Process Track Data ---
  const tracksByDifficulty = useMemo(() => {
    if (!schedule) return { easy: [], medium: [], hard: [] };

    const tracks: TrackInfo[] = schedule.map(event => {
      const locationKey = event.Location;
      const difficulty = TRACK_DIFFICULTY_MAP[locationKey] || 'medium';
      const fastestLap = FASTEST_LAP_RECORDS[locationKey];

      return {
        name: event.EventName,
        country: event.Country,
        location: event.Location,
        round: event.RoundNumber,
        difficulty,
        fastestLap,
      };
    });

    return {
      easy: tracks.filter(t => t.difficulty === 'easy'),
      medium: tracks.filter(t => t.difficulty === 'medium'),
      hard: tracks.filter(t => t.difficulty === 'hard'),
    };
  }, [schedule]);

  const totalRaces = schedule?.length || 0;
  const totalDrivers = Math.min(drivers?.length || 0, 20);
  const totalTeams = teams?.length || 0;

  const isLoading = isLoadingDrivers || isLoadingTeams || isLoadingSchedule;

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
            <div className="flex justify-center gap-4 flex-wrap">
              <Button asChild size="lg" className="text-lg">
                <Link to="/drivers">
                  View Drivers <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="text-lg">
                <Link to="/teams">
                  Explore Teams
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="container mx-auto px-4 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <StatCard icon={Flag} value={totalRaces} label="Total Races" />
          <StatCard icon={Users} value={totalDrivers} label="Total Drivers" />
          <StatCard icon={Trophy} value={totalTeams} label="Total Teams" />
        </div>
      </section>

      {/* Current Season Tracks Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              {LATEST_YEAR} Season Calendar
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {totalRaces} thrilling races across the globe, each with its unique challenges and fastest lap records.
            </p>
          </motion.div>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-12">
            {/* Easy Tracks */}
            {tracksByDifficulty.easy.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Waves className="h-6 w-6 text-green-500" />
                  <h3 className="text-2xl font-bold">Easy Tracks</h3>
                  <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/50">
                    {tracksByDifficulty.easy.length} Circuits
                  </Badge>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {tracksByDifficulty.easy.map((track, index) => (
                    <TrackCard key={index} track={track} />
                  ))}
                </div>
              </div>
            )}

            {/* Medium Tracks */}
            {tracksByDifficulty.medium.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="h-6 w-6 text-yellow-500" />
                  <h3 className="text-2xl font-bold">Medium Tracks</h3>
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
                    {tracksByDifficulty.medium.length} Circuits
                  </Badge>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {tracksByDifficulty.medium.map((track, index) => (
                    <TrackCard key={index} track={track} />
                  ))}
                </div>
              </div>
            )}

            {/* Hard Tracks */}
            {tracksByDifficulty.hard.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Mountain className="h-6 w-6 text-red-500" />
                  <h3 className="text-2xl font-bold">Hard Tracks</h3>
                  <Badge variant="outline" className="bg-red-500/20 text-red-500 border-red-500/50">
                    {tracksByDifficulty.hard.length} Circuits
                  </Badge>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {tracksByDifficulty.hard.map((track, index) => (
                    <TrackCard key={index} track={track} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Quick Links Section */}
      <section className="container mx-auto px-4 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Explore More
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dive deeper into the world of Formula 1 with detailed statistics and analysis.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Driver Standings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Track the championship battle with live driver standings.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/drivers">View Drivers</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Constructor Standings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Follow the teams competing for the constructor's championship.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/teams">View Teams</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-primary" />
                Championship Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Complete championship standings and race results.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/standings">View Standings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
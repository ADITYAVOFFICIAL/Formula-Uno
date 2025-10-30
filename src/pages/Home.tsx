import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Trophy, Flag, Users, MapPin, Calendar, Award } from "lucide-react";
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
  EventFormat: string;
  Session5Date: string;
}

interface RaceResult {
  Position: number;
  DriverNumber: string;
  BroadcastName: string;
  Abbreviation: string;
  DriverId: string;
  TeamName: string;
  TeamColor: string;
  FirstName: string;
  LastName: string;
  FullName: string;
  Status: string;
  Q1?: string;
  Q2?: string;
  Q3?: string;
  Time?: string;
}

interface TrackInfo {
  name: string;
  country: string;
  location: string;
  round: number;
  difficulty: 'easy' | 'medium' | 'hard';
  eventDate: string;
  session5Date: string;
  eventFormat: string;
  winner2024?: {
    name: string;
    driverId: string;
  };
}

// --- Track Difficulty Data (Based on Historical Data and Track Characteristics) ---
const TRACK_DIFFICULTY_MAP: { [key: string]: 'easy' | 'medium' | 'hard' } = {
  'Sakhir': 'medium',
  'Jeddah': 'hard',
  'Melbourne': 'medium',
  'Shanghai': 'medium',
  'Suzuka': 'hard',
  'Miami Gardens': 'easy',
  'Imola': 'hard',
  'Monaco': 'hard',
  'Montréal': 'medium',
  'Barcelona': 'medium',
  'Spielberg': 'easy',
  'Silverstone': 'hard',
  'Budapest': 'medium',
  'Spa-Francorchamps': 'hard',
  'Zandvoort': 'medium',
  'Monza': 'easy',
  'Baku': 'hard',
  'Marina Bay': 'hard',
  'Austin': 'medium',
  'Mexico City': 'medium',
  'São Paulo': 'hard',
  'Las Vegas': 'medium',
  'Lusail': 'easy',
  'Yas Island': 'medium',
};

// --- 2024 Race Winners (Previous Year) ---
const RACE_WINNERS_2024: { [key: string]: { name: string; driverId: string } } = {
  'Sakhir': { name: 'Max Verstappen', driverId: 'max_verstappen' },
  'Jeddah': { name: 'Max Verstappen', driverId: 'max_verstappen' },
  'Melbourne': { name: 'Carlos Sainz', driverId: 'sainz' },
  'Suzuka': { name: 'Max Verstappen', driverId: 'max_verstappen' },
  'Shanghai': { name: 'Max Verstappen', driverId: 'max_verstappen' },
  'Miami Gardens': { name: 'Lando Norris', driverId: 'norris' },
  'Imola': { name: 'Max Verstappen', driverId: 'max_verstappen' },
  'Monaco': { name: 'Charles Leclerc', driverId: 'leclerc' },
  'Montréal': { name: 'Max Verstappen', driverId: 'max_verstappen' },
  'Barcelona': { name: 'Max Verstappen', driverId: 'max_verstappen' },
  'Spielberg': { name: 'George Russell', driverId: 'russell' },
  'Silverstone': { name: 'Lewis Hamilton', driverId: 'hamilton' },
  'Budapest': { name: 'Oscar Piastri', driverId: 'piastri' },
  'Spa-Francorchamps': { name: 'Lewis Hamilton', driverId: 'hamilton' },
  'Zandvoort': { name: 'Lando Norris', driverId: 'norris' },
  'Monza': { name: 'Charles Leclerc', driverId: 'leclerc' },
  'Baku': { name: 'Oscar Piastri', driverId: 'piastri' },
  'Marina Bay': { name: 'Lando Norris', driverId: 'norris' },
  'Austin': { name: 'Charles Leclerc', driverId: 'leclerc' },
  'Mexico City': { name: 'Carlos Sainz', driverId: 'sainz' },
  'São Paulo': { name: 'Max Verstappen', driverId: 'max_verstappen' },
  'Las Vegas': { name: 'George Russell', driverId: 'russell' },
  'Lusail': { name: 'Max Verstappen', driverId: 'max_verstappen' },
  'Yas Island': { name: 'Lando Norris', driverId: 'norris' },
};

// Helper function to fetch race/qualifying results
const fetchSessionResults = async (year: number, location: string, session: 'Q' | 'R'): Promise<RaceResult[] | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/session/${year}/${location}/${session}/results`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error(`Error fetching ${session} results for ${location}:`, error);
    return null;
  }
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
    easy: { color: 'bg-green-500/20 text-green-500 border-green-500/50', label: 'Easy' },
    medium: { color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50', label: 'Medium' },
    hard: { color: 'bg-red-500/20 text-red-500 border-red-500/50', label: 'Hard' }
  };

  const config = difficultyConfig[track.difficulty];
  
  const formatType = track.eventFormat === 'sprint_qualifying' ? 'Sprint Weekend' : 'Standard';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{track.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{track.location}, {track.country}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <Badge variant="outline">
                Round {track.round}
              </Badge>
              <Badge variant="outline" className={`${config.color} text-xs`}>
                {config.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Race Date</span>
              <span className="font-semibold">
                {new Date(track.session5Date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Format</span>
              <span className="font-semibold">{formatType}</span>
            </div>
            {track.winner2024 && (
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Award className="h-3 w-3" />
                  <span>2024 Winner</span>
                </div>
                <Link 
                  to={`/driver/${track.winner2024.driverId}`}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {track.winner2024.name}
                </Link>
              </div>
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

  // Fetch race results for 2024 to get dynamic data (winner)
  const { data: raceResults2024, isLoading: isLoadingRaceResults } = useQuery({
    queryKey: ["raceWinners2024"],
    queryFn: async () => {
      if (!schedule) return {};
      
      const results: { [location: string]: { 
        winner?: { name: string; driverId: string };
      }} = {};
      
      // Fetch results for all circuits in 2025 schedule
      const racesToFetch = schedule.filter(event => event.RoundNumber > 0);
      
      console.log(`Fetching 2024 race winners for ${racesToFetch.length} circuits`);
      
      // Fetch all races in parallel for MUCH better performance
      const promises = racesToFetch.map(async (event) => {
        const locationResults: typeof results[string] = {};
        
        console.log(`Fetching data for ${event.Location} (${event.EventName})`);
        
        try {
          // Fetch 2024 race results
          const raceResults = await fetchSessionResults(2024, event.Location, 'R');
          
          console.log(`${event.Location}: R results=${raceResults?.length || 0}`);
          
          // Process race results for 2024 winner
          if (raceResults && raceResults.length > 0) {
            const winner = raceResults.find(r => r.Position === 1);
            if (winner) {
              locationResults.winner = {
                name: winner.FullName || `${winner.FirstName} ${winner.LastName}`,
                driverId: winner.DriverId || winner.Abbreviation?.toLowerCase() || '',
              };
            }
          }
          
          return { location: event.Location, data: locationResults };
        } catch (error) {
          console.error(`Error fetching data for ${event.Location}:`, error);
          return { location: event.Location, data: locationResults };
        }
      });
      
      // Wait for all promises to settle (both fulfilled and rejected)
      const settledResults = await Promise.allSettled(promises);
      
      // Collect all successful results
      settledResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          results[result.value.location] = result.value.data;
        }
      });
      
      return results;
    },
    enabled: !!schedule,
    staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // --- Process Track Data ---
  const { allTracks, nextRace } = useMemo(() => {
    if (!schedule) return { allTracks: [], nextRace: null };

    const now = new Date();
    const tracks: TrackInfo[] = schedule
      .filter(event => event.RoundNumber > 0) // Exclude testing sessions
      .map(event => {
        const locationKey = event.Location;
        const difficulty = TRACK_DIFFICULTY_MAP[locationKey] || 'medium';
        
        // Get dynamic data from 2024 results or fall back to static data
        const dynamicData = raceResults2024?.[locationKey];
        const winner2024 = dynamicData?.winner || RACE_WINNERS_2024[locationKey];

        return {
          name: event.EventName,
          country: event.Country,
          location: event.Location,
          round: event.RoundNumber,
          difficulty,
          winner2024,
          eventDate: event.EventDate,
          session5Date: event.Session5Date,
          eventFormat: event.EventFormat,
        };
      });

    // Find next race (race date is in the future)
    const upcomingRaces = tracks.filter(track => new Date(track.session5Date) > now);
    const nextUpcomingRace = upcomingRaces.length > 0 ? upcomingRaces[0] : null;

    return {
      allTracks: tracks,
      nextRace: nextUpcomingRace,
    };
  }, [schedule, raceResults2024]);

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
              {allTracks.length} thrilling races across the globe. View 2024 winners for each circuit.
            </p>
          </motion.div>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-12">
            {/* Next Race Card - Large Featured Card */}
            {nextRace && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/50 shadow-2xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className="bg-primary text-primary-foreground">
                            Next Race
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={
                              nextRace.difficulty === 'easy' 
                                ? 'bg-green-500/20 text-green-500 border-green-500/50'
                                : nextRace.difficulty === 'medium'
                                ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50'
                                : 'bg-red-500/20 text-red-500 border-red-500/50'
                            }
                          >
                            {nextRace.difficulty.charAt(0).toUpperCase() + nextRace.difficulty.slice(1)} Track
                          </Badge>
                          {nextRace.eventFormat === 'sprint_qualifying' && (
                            <Badge variant="outline" className="bg-purple-500/20 text-purple-500 border-purple-500/50">
                              Sprint Weekend
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-3xl md:text-4xl mb-3">{nextRace.name}</CardTitle>
                        <div className="flex flex-wrap gap-4 text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            <span className="text-lg">{nextRace.location}, {nextRace.country}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            <span className="text-lg font-semibold">
                              {new Date(nextRace.session5Date).toLocaleDateString('en-US', { 
                                weekday: 'long',
                                month: 'long', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-2xl px-4 py-2">
                        Round {nextRace.round}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {nextRace.winner2024 && (
                      <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-3">
                          <Award className="h-5 w-5" />
                          <span className="text-lg font-medium">2024 Winner</span>
                        </div>
                        <Link 
                          to={`/driver/${nextRace.winner2024.driverId}`}
                          className="text-3xl md:text-4xl font-bold text-primary hover:underline block mb-2"
                        >
                          {nextRace.winner2024.name}
                        </Link>
                        <div className="text-lg text-muted-foreground">
                          Click to view driver profile
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* All Races in Sequential Order */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Flag className="h-6 w-6 text-primary" />
                <h3 className="text-2xl font-bold">All {totalRaces} Races</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {allTracks.map((track, index) => (
                  <TrackCard key={index} track={track} />
                ))}
              </div>
            </div>
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
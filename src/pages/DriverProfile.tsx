import { useParams, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trophy, Flag, Zap, User, Users, BarChart2, PieChart as PieIcon, TrendingUp, Target, Clock, MessageSquare, Activity, Calendar, Award, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// --- Configuration ---
const API_BASE_URL = "http://127.0.0.1:8000";
const LATEST_YEAR = new Date().getFullYear(); // Dynamic current year
const TOTAL_RACES = 24; // Total races in the 2025 season for win rate calculation
const HISTORICAL_YEARS_RANGE = 35; // Maximum number of years to look back
const HISTORICAL_YEARS = Array.from(
  { length: HISTORICAL_YEARS_RANGE }, 
  (_, i) => LATEST_YEAR - (HISTORICAL_YEARS_RANGE - 1) + i
); // Generates array of years to check
const POINTS_FOR_WIN = 25;
const POINTS_FOR_SPRINT_WIN = 8;
const POINTS_FOR_FASTEST_LAP = 1;

// --- Type Definitions for API Data ---
interface DriverStanding {
  position: number;
  points: number;
  wins: number;
  driverId: string;
  driverNumber: number;
  givenName: string;
  familyName:string;
  dateOfBirth: string;
  driverNationality: string;
  constructorIds: string[];
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

interface LapData {
  Driver: string; // Driver abbreviation (e.g., "VER", "HAM")
  DriverNumber: string; // Driver number as string
  LapNumber: number;
  LapTime: string;
  Sector1Time: string;
  Sector2Time: string;
  Sector3Time: string;
  Compound: string;
  TyreLife: number;
  Position: number;
  Time?: string; // Cumulative time
  PitOutTime?: string;
  PitInTime?: string;
}

interface RaceMessage {
  Time: string;
  Category: string;
  Message: string;
  Flag: string;
}

// --- Utility to map team names to theme colors ---
const teamColorMapping: { [key: string]: string } = {
    "McLaren": "25 95% 58%",
    "Mercedes": "180 40% 60%",
    "Ferrari": "0 86% 52%",
    "Red Bull": "221 75% 58%",
    "Williams": "215 80% 60%",
    "RB F1 Team": "221 70% 55%",
    "Aston Martin": "152 60% 42%",
    "Sauber": "152 60% 42%",
    "Haas F1 Team": "0 0% 85%",
    "Alpine F1 Team": "214 85% 62%",
};

// --- API Fetching Functions ---
const fetchDriverStandings = async (year: number): Promise<DriverStanding[]> => {
  const response = await fetch(`${API_BASE_URL}/standings/drivers/${year}`);
  if (!response.ok) throw new Error("Network response was not ok for drivers");
  return response.json();
};

const fetchConstructorStandings = async (year: number): Promise<ConstructorStanding[]> => {
    const response = await fetch(`${API_BASE_URL}/standings/constructors/${year}`);
    if (!response.ok) throw new Error("Network response was not ok for constructors");
    return response.json();
};

const fetchSchedule = async (year: number): Promise<ScheduleEvent[]> => {
  const response = await fetch(`${API_BASE_URL}/schedule/${year}`);
  if (!response.ok) throw new Error("Failed to fetch schedule");
  return response.json();
};

const fetchSessionLaps = async (year: number, gp: string, session: string): Promise<LapData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/session/${year}/${gp}/${session}/laps`);
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
};

const fetchRaceMessages = async (year: number, gp: string, session: string): Promise<RaceMessage[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/session/${year}/${gp}/${session}/messages`);
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
};

// --- Championship Calculation Helpers ---
const calculateMaxRemainingPoints = (schedule: ScheduleEvent[], currentRound: number): number => {
  if (!schedule) return 0;
  
  // Filter races that haven't happened yet
  const remainingRaces = schedule.filter(event => {
    const raceDate = new Date(event.Session5Date);
    const today = new Date();
    return raceDate > today && event.RoundNumber > currentRound;
  });

  // Count sprint races (you might need to add EventFormat to ScheduleEvent interface)
  // For now, assume conventional races only
  const conventionalRaces = remainingRaces.length;
  const sprintRaces = 0; // Update this if sprint data is available
  
  // Max points = (races * 25) + (sprints * 8) + (fastest laps * 1)
  const maxPoints = (conventionalRaces * POINTS_FOR_WIN) + 
                   (sprintRaces * (POINTS_FOR_SPRINT_WIN + POINTS_FOR_WIN)) +
                   (remainingRaces.length * POINTS_FOR_FASTEST_LAP);
  
  return maxPoints;
};

const calculateChampionshipChances = (
  currentDriver: DriverStanding,
  leaderPoints: number,
  maxRemainingPoints: number,
  allDrivers: DriverStanding[]
): {
  canWin: boolean;
  pointsNeeded: number;
  maxPossiblePoints: number;
  winProbability: number;
  pointsBehindLeader: number;
  driversAhead: number;
} => {
  const currentPoints = currentDriver.points;
  const maxPossiblePoints = currentPoints + maxRemainingPoints;
  const pointsBehindLeader = leaderPoints - currentPoints;
  const canWin = maxPossiblePoints >= leaderPoints;
  const pointsNeeded = Math.max(0, leaderPoints - currentPoints + 1);
  
  // Calculate win probability based on multiple factors
  const driversAhead = allDrivers.filter(d => d.points > currentPoints).length;
  const pointsGap = pointsBehindLeader;
  const racesRemaining = Math.floor(maxRemainingPoints / POINTS_FOR_WIN);
  
  let winProbability = 0;
  if (canWin && racesRemaining > 0) {
    // Base probability on points gap and races remaining
    const gapPercentage = pointsGap / (maxRemainingPoints || 1);
    const positionFactor = 1 - (driversAhead * 0.15); // Penalty for each driver ahead
    const momentumFactor = currentDriver.wins > 0 ? 1.1 : 0.9; // Bonus for winners
    
    // Calculate probability (0-100%)
    winProbability = Math.max(0, Math.min(100, 
      (1 - gapPercentage) * positionFactor * momentumFactor * 100
    ));
    
    // If mathematically eliminated, probability is 0
    if (!canWin) winProbability = 0;
    
    // If leading, high probability
    if (currentDriver.position === 1) {
      winProbability = Math.max(winProbability, 75);
    }
  }
  
  return {
    canWin,
    pointsNeeded,
    maxPossiblePoints,
    winProbability: Math.round(winProbability * 10) / 10,
    pointsBehindLeader,
    driversAhead,
  };
};

// --- Helper & Skeleton Components ---
const StatCard = ({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) => (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10 text-white transform hover:scale-105 transition-transform duration-300">
      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
        {icon}
        <div className="text-4xl font-black mt-2">{value}</div>
        <div className="text-sm text-white/70 uppercase tracking-widest">{label}</div>
      </CardContent>
    </Card>
);

const DriverProfileSkeleton = () => (
    <div className="min-h-screen bg-background">
        <div className="h-[60vh] bg-muted flex items-center justify-center">
            <Skeleton className="h-48 w-3/4" />
        </div>
        <div className="container mx-auto px-4 -mt-24 relative z-20 pb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    </div>
);


const DriverProfile = () => {
  const { driverId } = useParams<{ driverId: string }>();
  const [selectedRace, setSelectedRace] = useState<string>("");

  const { data: drivers, isLoading: isLoadingDrivers } = useQuery<DriverStanding[]>({
    queryKey: ["driverStandings", LATEST_YEAR],
    queryFn: () => fetchDriverStandings(LATEST_YEAR),
  });

  const { data: teams, isLoading: isLoadingTeams } = useQuery<ConstructorStanding[]>({
    queryKey: ["constructorStandings", LATEST_YEAR],
    queryFn: () => fetchConstructorStandings(LATEST_YEAR),
  });

  const { data: schedule } = useQuery<ScheduleEvent[]>({
    queryKey: ["schedule", LATEST_YEAR],
    queryFn: () => fetchSchedule(LATEST_YEAR),
  });

  // Fetch historical data for multiple years
  const historicalQueries = HISTORICAL_YEARS.map(year => 
    useQuery<DriverStanding[]>({
      queryKey: ["driverStandings", year],
      queryFn: () => fetchDriverStandings(year),
      staleTime: Infinity,
    })
  );

  // Fetch lap data for selected race
  const { data: lapData, isLoading: isLoadingLaps } = useQuery<LapData[]>({
    queryKey: ["laps", LATEST_YEAR, selectedRace],
    queryFn: () => fetchSessionLaps(LATEST_YEAR, selectedRace, "R"),
    enabled: !!selectedRace,
  });

  // Fetch race messages for selected race
  const { data: raceMessages, isLoading: isLoadingMessages } = useQuery<RaceMessage[]>({
    queryKey: ["messages", LATEST_YEAR, selectedRace],
    queryFn: () => fetchRaceMessages(LATEST_YEAR, selectedRace, "R"),
    enabled: !!selectedRace,
  });

  const { driver, team, teammate, calculatedMetrics, performanceRadarData, historicalData, driverLapAnalysis, driverMessages, championshipData } = useMemo(() => {
    if (!drivers || !teams) return {};

    const currentDriver = drivers.find((d) => d.driverId === driverId);
    if (!currentDriver) return {};
    
    const primaryTeamId = currentDriver.constructorIds[currentDriver.constructorIds.length - 1];
    const currentTeam = teams.find((t) => t.constructorId === primaryTeamId);
    if (!currentTeam) return {};

    const currentTeammate = drivers.find(d => 
        d.driverId !== currentDriver.driverId && 
        d.constructorIds[d.constructorIds.length - 1] === primaryTeamId
    );

    const gridAveragePoints = drivers.reduce((acc, d) => acc + d.points, 0) / drivers.length;
    
    // Calculate current round based on completed races
    const currentRound = schedule?.filter(event => {
      const raceDate = new Date(event.Session5Date);
      return raceDate < new Date();
    }).length || 0;

    // Championship calculations
    const leaderPoints = drivers[0].points;
    const maxRemainingPoints = calculateMaxRemainingPoints(schedule || [], currentRound);
    const championshipChances = calculateChampionshipChances(
      currentDriver,
      leaderPoints,
      maxRemainingPoints,
      drivers
    );

    const metrics = {
        pointsPerWin: currentDriver.wins > 0 ? (currentDriver.points / currentDriver.wins).toFixed(1) : "N/A",
        winRate: ((currentDriver.wins / TOTAL_RACES) * 100).toFixed(1) + "%",
        teamPointsPercentage: currentTeam.points > 0 ? ((currentDriver.points / currentTeam.points) * 100) : 0,
        age: new Date().getFullYear() - new Date(currentDriver.dateOfBirth).getFullYear(),
        pointsVsTeammate: currentTeammate ? currentDriver.points - currentTeammate.points : "N/A",
        pointsVsGridAvg: (currentDriver.points - gridAveragePoints).toFixed(1),
        winConversion: currentTeam.wins > 0 && currentDriver.wins > 0 ? ((currentDriver.wins / currentTeam.wins) * 100).toFixed(1) + "%" : "N/A",
    };

    // Process historical data
    const historical = HISTORICAL_YEARS.map((year, idx) => {
      const yearData = historicalQueries[idx]?.data;
      const driverYearData = yearData?.find(d => d.driverId === driverId);
      return {
        year,
        points: driverYearData?.points || 0,
        wins: driverYearData?.wins || 0,
        position: driverYearData?.position || null,
      };
    }).filter(d => d.points > 0 || d.wins > 0 || d.position);
    
    // --- IMPROVED PERFORMANCE RADAR CALCULATION ---
    
    // 1. RACE CRAFT - Win rate + podium potential (more comprehensive than just wins)
    const completedRaces = currentRound || 20; // Default to 20 if no schedule
    const winRate = (currentDriver.wins / completedRaces) * 100;
    const raceCraft = Math.min(100, winRate * 3 + (currentDriver.points / completedRaces) * 2);
    
    // 2. CONSISTENCY - Points per race normalized, accounting for reliability
    // Compare against leader's points per race to avoid penalizing lower positions
    const leaderPointsPerRace = drivers[0].points / completedRaces;
    const driverPointsPerRace = currentDriver.points / completedRaces;
    const consistencyScore = (driverPointsPerRace / leaderPointsPerRace) * 100;
    
    // 3. QUALIFYING PERFORMANCE - Estimated from championship position vs team position
    // Better positioned driver in team likely has better quali performance
    const teamDrivers = drivers.filter(d => 
      d.constructorIds[d.constructorIds.length - 1] === primaryTeamId
    );
    const isLeadDriver = teamDrivers.length > 1 ? 
      currentDriver.points >= Math.max(...teamDrivers.map(d => d.points)) : true;
    const qualifyingEstimate = isLeadDriver ? 
      Math.min(100, 70 + (currentDriver.wins * 5)) : // Lead driver bonus
      Math.min(100, 50 + (currentDriver.wins * 3));   // Secondary driver
    
    // 4. RACE PACE - Based on points vs team points and wins
    // Higher contribution = better race pace
    const racePaceScore = Math.min(100, 
      metrics.teamPointsPercentage + 
      (currentDriver.wins / (currentTeam.wins || 1)) * 30
    );
    
    // 5. CHAMPIONSHIP FORM - Position relative to grid size with recent performance weighting
    // Top 3: 90-100, Top 5: 75-89, Top 10: 50-74, Rest: <50
    let championshipForm = 100;
    if (currentDriver.position <= 3) {
      championshipForm = 90 + ((4 - currentDriver.position) * 3.33);
    } else if (currentDriver.position <= 5) {
      championshipForm = 75 + ((6 - currentDriver.position) * 7.5);
    } else if (currentDriver.position <= 10) {
      championshipForm = 50 + ((11 - currentDriver.position) * 5);
    } else {
      championshipForm = Math.max(10, 50 - ((currentDriver.position - 10) * 4));
    }
    
    // 6. EXPERIENCE - Based on years in F1 (calculated from historical data)
    const yearsInF1 = historical.filter(h => h.points > 0 || h.position).length;
    const experienceScore = Math.min(100, (yearsInF1 / 15) * 100); // 15 years = 100%
    
    const radarData = [
        { 
          subject: 'Race Craft', 
          value: Math.round(raceCraft), 
          fullMark: 100,
          description: 'Ability to win races and convert opportunities'
        },
        { 
          subject: 'Consistency', 
          value: Math.round(consistencyScore), 
          fullMark: 100,
          description: 'Reliable points scoring across the season'
        },
        { 
          subject: 'Qualifying', 
          value: Math.round(qualifyingEstimate), 
          fullMark: 100,
          description: 'Saturday performance and grid position'
        },
        { 
          subject: 'Race Pace', 
          value: Math.round(racePaceScore), 
          fullMark: 100,
          description: 'Sunday speed and overtaking ability'
        },
        { 
          subject: 'Form', 
          value: Math.round(championshipForm), 
          fullMark: 100,
          description: 'Current championship standing'
        },
        { 
          subject: 'Experience', 
          value: Math.round(experienceScore), 
          fullMark: 100,
          description: 'Years of F1 racing experience'
        },
    ];

    // Process lap data for current driver
    // Try matching by DriverNumber first, then fall back to Driver field
    const driverLaps = lapData?.filter(lap => {
      // Match by driver number (most reliable)
      if (lap.DriverNumber) {
        return lap.DriverNumber === currentDriver.driverNumber.toString();
      }
      // Fall back to matching by driver abbreviation if available
      // Note: We don't have driverCode in the standings API, so this might not work
      return false;
    }) || [];
    
    console.log('Debug - Driver Number:', currentDriver.driverNumber);
    console.log('Debug - Total laps in data:', lapData?.length);
    console.log('Debug - Filtered laps for driver:', driverLaps.length);
    if (lapData && lapData.length > 0) {
      console.log('Debug - Sample lap data:', lapData[0]);
    }
    
    const lapAnalysis = driverLaps.length > 0 ? {
      totalLaps: driverLaps.length,
      avgPosition: (driverLaps.reduce((acc, lap) => acc + (lap.Position || 0), 0) / driverLaps.length).toFixed(1),
      compoundUsage: driverLaps.reduce((acc, lap) => {
        const compound = lap.Compound || 'UNKNOWN';
        acc[compound] = (acc[compound] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      lapTimes: driverLaps.map(lap => ({
        lapNumber: lap.LapNumber,
        lapTime: lap.LapTime,
        position: lap.Position,
        compound: lap.Compound,
      })),
    } : null;

    // Process race messages for the driver
    const driverRelatedMessages = raceMessages?.filter(msg => 
      msg.Message.toLowerCase().includes(currentDriver.familyName.toLowerCase()) ||
      msg.Message.toLowerCase().includes(currentDriver.givenName.toLowerCase()) ||
      msg.Message.includes(`CAR ${currentDriver.driverNumber}`)
    ) || [];

    return { 
        driver: currentDriver, 
        team: currentTeam, 
        teammate: currentTeammate, 
        calculatedMetrics: {
            ...metrics,
            teamPointsPercentage: metrics.teamPointsPercentage.toFixed(1) + "%",
        },
        performanceRadarData: radarData,
        historicalData: historical,
        driverLapAnalysis: lapAnalysis,
        driverMessages: driverRelatedMessages,
        championshipData: championshipChances,
    };
  }, [drivers, teams, driverId, historicalQueries, lapData, raceMessages, schedule]);


  if (isLoadingDrivers || isLoadingTeams) {
    return <DriverProfileSkeleton />;
  }

  if (!driver || !team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-6xl font-extrabold text-destructive tracking-tighter">404</h1>
          <p className="text-xl text-muted-foreground">Driver Not Found</p>
          <Button asChild>
            <Link to="/drivers">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Drivers
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const teamColor = teamColorMapping[team.constructorName] || 'var(--primary)';
  const COLORS = [`hsl(${teamColor})`, `hsl(${teamColor}, 50%, 80%)`];

  const headToHeadData = teammate ? [
      { name: 'Points', [driver.familyName]: driver.points, [teammate.familyName]: teammate.points },
      { name: 'Wins', [driver.familyName]: driver.wins, [teammate.familyName]: teammate.wins },
  ] : [];

  const pointsContributionData = teammate ? [
      { name: driver.familyName, value: driver.points },
      { name: teammate.familyName, value: teammate.points },
  ] : [{ name: driver.familyName, value: driver.points }];

  // Illustrative data for points progression
  const pointsProgressionData = Array.from({ length: 12 }, (_, i) => ({
    race: `R${i + 1}`,
    [driver.familyName]: Math.floor(driver.points * ((i + 1) / 12) + Math.random() * 25 - 10),
    ...(teammate && { [teammate.familyName]: Math.floor(teammate.points * ((i + 1) / 12) + Math.random() * 25 - 10) }),
  }));


  return (
    <div className="min-h-screen bg-background text-foreground">
      <section
        className="relative min-h-[60vh] flex items-center justify-center text-center"
        style={{ background: `radial-gradient(circle, hsl(${teamColor}) 0%, #000 70%)` }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="absolute top-8 left-8">
            <Button asChild variant="outline" className="bg-transparent text-white border-white/50 hover:bg-white/10 hover:text-white">
              <Link to="/drivers"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
            </Button>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-baseline gap-4">
              <h1 className="text-8xl md:text-9xl font-black text-white tracking-tighter">{driver.givenName}</h1>
              <span className="text-7xl md:text-8xl font-thin text-white/80">{driver.familyName}</span>
            </div>
            <div className="text-5xl font-bold" style={{ color: `hsl(${teamColor})` }}>#{driver.driverNumber}</div>
            <div className="mt-6 flex items-center gap-6 text-xl text-white/90">
              <span>{driver.driverNationality}</span>
              <div className="h-6 w-px bg-white/30" />
              <span>{team.constructorName}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-24 relative z-20 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <StatCard label="Season Points" value={driver.points} icon={<Trophy className="w-8 h-8 text-white/80" />} />
          <StatCard label="Ch. Position" value={driver.position} icon={<Flag className="w-8 h-8 text-white/80" />} />
          <StatCard label="Season Wins" value={driver.wins} icon={<Zap className="w-8 h-8 text-white/80" />} />
          <StatCard label="Age" value={calculatedMetrics.age} icon={<User className="w-8 h-8 text-white/80" />} />
        </div>

        {/* Championship Chances Section */}
        {championshipData && (
          <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border-2 border-primary/30 shadow-2xl mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Trophy className="h-8 w-8 text-primary" />
                Championship Battle Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Win Probability Gauge */}
              <div className="text-center py-6">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="transform -rotate-90 w-48 h-48">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-muted"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke={`hsl(${teamColor})`}
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={`${(championshipData.winProbability / 100) * 502.4} 502.4`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black" style={{ color: `hsl(${teamColor})` }}>
                      {championshipData.winProbability}%
                    </span>
                    <span className="text-sm text-muted-foreground mt-1">Win Probability</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Badge 
                    variant={championshipData.canWin ? "default" : "destructive"}
                    className="text-lg px-4 py-2"
                  >
                    {championshipData.canWin ? "✓ Mathematically In Contention" : "✗ Mathematically Eliminated"}
                  </Badge>
                </div>
              </div>

              {/* Championship Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Points Behind Leader</p>
                  <p className="text-3xl font-bold text-destructive">{championshipData.pointsBehindLeader}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Max Possible Points</p>
                  <p className="text-3xl font-bold" style={{ color: `hsl(${teamColor})` }}>{championshipData.maxPossiblePoints}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Points Needed</p>
                  <p className="text-3xl font-bold text-primary">{championshipData.pointsNeeded}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Drivers Ahead</p>
                  <p className="text-3xl font-bold">{championshipData.driversAhead}</p>
                </div>
              </div>

              {/* Championship Scenario */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Championship Scenario
                </h4>
                <div className="space-y-2 text-sm">
                  {driver.position === 1 ? (
                    <p className="text-green-500">
                      🏆 Currently leading the championship! Needs to maintain consistency to secure the title.
                    </p>
                  ) : championshipData.canWin ? (
                    <>
                      <p>
                        • Must gain <strong className="text-primary">{championshipData.pointsNeeded} points</strong> to overtake the leader
                      </p>
                      <p>
                        • With perfect results, could reach <strong style={{ color: `hsl(${teamColor})` }}>{championshipData.maxPossiblePoints} points</strong>
                      </p>
                      <p>
                        • Currently {championshipData.pointsBehindLeader} points behind with {championshipData.driversAhead} driver{championshipData.driversAhead !== 1 ? 's' : ''} ahead
                      </p>
                      {championshipData.winProbability > 50 ? (
                        <p className="text-green-500">
                          ✓ Strong title contender with {championshipData.winProbability}% probability
                        </p>
                      ) : championshipData.winProbability > 20 ? (
                        <p className="text-yellow-500">
                          ⚠ Outside shot at the title - needs consistent podium finishes
                        </p>
                      ) : (
                        <p className="text-orange-500">
                          ⚠ Long shot - requires wins and leader to stumble significantly
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-destructive">
                      ✗ Mathematically eliminated from championship contention. Even with maximum points, cannot catch the leader.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl"><Target className="h-6 w-6" style={{ color: `hsl(${teamColor})` }} /> Performance Radar</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceRadarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                            <Radar dataKey="value" stroke={`hsl(${teamColor})`} fill={`hsl(${teamColor})`} fillOpacity={0.7} />
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}/>
                        </RadarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl"><TrendingUp className="h-6 w-6" style={{ color: `hsl(${teamColor})` }} /> Points Progression (Illustrative)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={pointsProgressionData}>
                            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                            <XAxis dataKey="race" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                            <Legend />
                            <Line type="monotone" dataKey={driver.familyName} stroke={COLORS[0]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                            {teammate && <Line type="monotone" dataKey={teammate.familyName} stroke={COLORS[1]} strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3 }} activeDot={{ r: 6 }} />}
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl"><BarChart2 className="h-6 w-6" style={{ color: `hsl(${teamColor})` }} /> Intra-Team Battle</CardTitle>
                </CardHeader>
                <CardContent>
                    {teammate ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={headToHeadData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))" }} width={60} />
                                <Tooltip cursor={{fill: 'hsl(var(--border))'}} contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                                <Legend />
                                <Bar dataKey={driver.familyName} fill={COLORS[0]} />
                                <Bar dataKey={teammate.familyName} fill={COLORS[1]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">No teammate data available for comparison.</div>
                    )}
                </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl"><PieIcon className="h-6 w-6" style={{ color: `hsl(${teamColor})` }} /> Contribution to Team</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={pointsContributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {pointsContributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>

        {/* Historical Career Data */}
        {historicalData && historicalData.length > 0 && (
          <div className="mb-8">
            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Calendar className="h-6 w-6" style={{ color: `hsl(${teamColor})` }} /> 
                  Career Progression {historicalData && historicalData.length > 0 && `(${Math.min(...historicalData.map(h => h.year))}-${Math.max(...historicalData.map(h => h.year))})`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={historicalData}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="year" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))" }} label={{ value: 'Points', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))" }} label={{ value: 'Position', angle: 90, position: 'insideRight' }} reversed />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="points" fill={`hsl(${teamColor})`} fillOpacity={0.3} stroke={`hsl(${teamColor})`} strokeWidth={2} />
                    <Bar yAxisId="left" dataKey="wins" fill={COLORS[1]} name="Wins" />
                    <Line yAxisId="right" type="monotone" dataKey="position" stroke="#ff6b6b" strokeWidth={3} dot={{ r: 5 }} name="Championship Position" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Race Analysis Tabs */}
        <Tabs defaultValue="metrics" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="laps">Lap Analysis</TabsTrigger>
            <TabsTrigger value="messages">Race Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardHeader><CardTitle>Advanced Metrics</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm p-2 rounded bg-muted/50"><span className="text-muted-foreground">Points per Win</span><span className="font-bold">{calculatedMetrics.pointsPerWin}</span></div>
                  <div className="flex justify-between text-sm p-2 rounded bg-muted/50"><span className="text-muted-foreground">Season Win Rate</span><span className="font-bold">{calculatedMetrics.winRate}</span></div>
                  <div className="flex justify-between text-sm p-2 rounded bg-muted/50"><span className="text-muted-foreground">Team Points Share</span><span className="font-bold">{calculatedMetrics.teamPointsPercentage}</span></div>
                  <div className="flex justify-between text-sm p-2 rounded bg-muted/50"><span className="text-muted-foreground">Points vs Teammate</span><span className="font-bold">{calculatedMetrics.pointsVsTeammate}</span></div>
                  <div className="flex justify-between text-sm p-2 rounded bg-muted/50"><span className="text-muted-foreground">Points vs Grid Avg</span><span className="font-bold">{calculatedMetrics.pointsVsGridAvg}</span></div>
                  <div className="flex justify-between text-sm p-2 rounded bg-muted/50"><span className="text-muted-foreground">Team Win Conversion</span><span className="font-bold">{calculatedMetrics.winConversion}</span></div>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2 bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-3"><Users className="h-6 w-6 text-primary"/>Team Overview</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg" style={{ background: `linear-gradient(45deg, hsl(${teamColor}) 0%, hsl(${teamColor}, 50%, 30%) 100%)` }}>
                    <h3 className="text-2xl font-bold text-white">{team.constructorName}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-muted-foreground">Ch. Position</p><p className="font-bold text-2xl">{team.position}</p></div>
                    <div><p className="text-muted-foreground">Total Points</p><p className="font-bold text-2xl">{team.points}</p></div>
                    <div><p className="text-muted-foreground">Total Wins</p><p className="font-bold text-2xl">{team.wins}</p></div>
                  </div>
                  <Button asChild className="w-full mt-2" variant="secondary">
                    <Link to={`/team/${team.constructorId}`}>View Full Team Details</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="laps">
            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Activity className="h-6 w-6" style={{ color: `hsl(${teamColor})` }} />
                  Lap Time Analysis
                </CardTitle>
                <div className="mt-4">
                  <select 
                    className="w-full md:w-auto px-4 py-2 rounded-md border border-border bg-background"
                    value={selectedRace}
                    onChange={(e) => setSelectedRace(e.target.value)}
                  >
                    <option value="">Select a race to analyze</option>
                    {schedule
                      ?.filter(event => {
                        // Only show races that have happened (race date is in the past)
                        const raceDate = new Date(event.Session5Date);
                        const today = new Date();
                        // Also filter out testing and sprint races
                        return raceDate < today && 
                               !event.EventName.toLowerCase().includes('test') &&
                               event.Session5Date !== null;
                      })
                      .map(event => (
                        <option key={event.RoundNumber} value={event.Location}>
                          Round {event.RoundNumber}: {event.EventName}
                        </option>
                      ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedRace && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Select a race from the dropdown above to view detailed lap analysis</p>
                  </div>
                )}
                {selectedRace && isLoadingLaps && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading lap data...</p>
                  </div>
                )}
                {selectedRace && !isLoadingLaps && !driverLapAnalysis && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg font-semibold mb-2">No lap data available for this race</p>
                    <p className="text-sm">This could mean:</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• The race hasn't been completed yet</li>
                      <li>• Data hasn't been uploaded to the API</li>
                      <li>• The driver didn't participate in this race</li>
                    </ul>
                  </div>
                )}
                {selectedRace && driverLapAnalysis && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Total Laps</p>
                        <p className="text-3xl font-bold">{driverLapAnalysis.totalLaps}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Avg Position</p>
                        <p className="text-3xl font-bold">{driverLapAnalysis.avgPosition}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Race</p>
                        <p className="text-sm font-bold">{schedule?.find(e => e.Location === selectedRace)?.EventName}</p>
                      </div>
                    </div>

                    {/* Lap Position Progression Chart */}
                    {driverLapAnalysis.lapTimes && driverLapAnalysis.lapTimes.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Position Throughout Race</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={driverLapAnalysis.lapTimes}>
                            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="lapNumber" 
                              tick={{ fill: "hsl(var(--muted-foreground))" }}
                              label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis 
                              reversed 
                              tick={{ fill: "hsl(var(--muted-foreground))" }}
                              label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
                              domain={[1, 20]}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                              formatter={(value: any, name: string) => {
                                if (name === 'position') return [`P${value}`, 'Position'];
                                return [value, name];
                              }}
                            />
                            <Line 
                              type="stepAfter" 
                              dataKey="position" 
                              stroke={`hsl(${teamColor})`} 
                              strokeWidth={3}
                              dot={{ r: 2 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {Object.keys(driverLapAnalysis.compoundUsage).length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Tyre Compound Usage</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={Object.entries(driverLapAnalysis.compoundUsage).map(([compound, count]) => ({ compound, laps: count }))}>
                            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                            <XAxis dataKey="compound" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} label={{ value: 'Laps', angle: -90, position: 'insideLeft' }} />
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                            <Bar dataKey="laps" fill={`hsl(${teamColor})`} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Lap Times Table - showing first 10 laps */}
                    {driverLapAnalysis.lapTimes && driverLapAnalysis.lapTimes.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Lap Times (First 10 Laps)</h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-20">Lap</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Compound</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {driverLapAnalysis.lapTimes.slice(0, 10).map((lap) => (
                                <TableRow key={lap.lapNumber}>
                                  <TableCell className="font-bold">{lap.lapNumber}</TableCell>
                                  <TableCell className="font-mono">{lap.lapTime || 'N/A'}</TableCell>
                                  <TableCell>P{lap.position}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{lap.compound || 'N/A'}</Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <MessageSquare className="h-6 w-6" style={{ color: `hsl(${teamColor})` }} />
                  Race Control Messages
                </CardTitle>
                {selectedRace && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing messages for: {schedule?.find(e => e.Location === selectedRace)?.EventName}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {!selectedRace && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Select a race from the Lap Analysis tab to view race control messages</p>
                  </div>
                )}
                {selectedRace && isLoadingMessages && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading race messages...</p>
                  </div>
                )}
                {selectedRace && !isLoadingMessages && (!driverMessages || driverMessages.length === 0) && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold mb-2">No race control messages found for this driver</p>
                    <p className="text-sm">This could mean:</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• The driver had a clean race with no incidents</li>
                      <li>• Race control messages aren't available for this event</li>
                      <li>• Messages don't specifically mention this driver</li>
                    </ul>
                  </div>
                )}
                {selectedRace && driverMessages && driverMessages.length > 0 && (
                  <div>
                    <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm font-semibold">
                        Found {driverMessages.length} message{driverMessages.length !== 1 ? 's' : ''} mentioning {driver.givenName} {driver.familyName}
                      </p>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {driverMessages.map((msg, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted/50 border-l-4 hover:bg-muted/70 transition-colors" style={{ borderColor: `hsl(${teamColor})` }}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex gap-2">
                              {msg.Category && <Badge variant="outline" className="text-xs">{msg.Category}</Badge>}
                              {msg.Flag && <Badge className="text-xs" style={{ backgroundColor: `hsl(${teamColor})` }}>{msg.Flag}</Badge>}
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">{msg.Time}</span>
                          </div>
                          <p className="text-sm leading-relaxed">{msg.Message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DriverProfile;
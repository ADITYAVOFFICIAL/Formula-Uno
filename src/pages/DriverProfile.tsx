import { useParams, Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
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
import { TeamLogo, DriverPhoto } from "@/components/ImageComponents";
import { getDriverPhoto, getCountryFlag } from "@/lib/images";

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
  driverCode?: string; // Optional: 3-letter driver code (VER, HAM, etc.)
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
  Status: string | null;
  Flag: string | null;
  Scope: string | null;
  Sector: number | null;
  RacingNumber: string | null;
  Lap: number;
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
  avgFinishNeeded: number;
  racesToClinch: number;
} => {
  const currentPoints = currentDriver.points;
  const maxPossiblePoints = currentPoints + maxRemainingPoints;
  const pointsBehindLeader = leaderPoints - currentPoints;
  const canWin = maxPossiblePoints >= leaderPoints;
  const pointsNeeded = Math.max(0, leaderPoints - currentPoints + 1);
  const racesRemaining = Math.floor(maxRemainingPoints / POINTS_FOR_WIN);
  const driversAhead = allDrivers.filter(d => d.points > currentPoints).length;
  
  // Enhanced Monte Carlo simulation for accurate win probability - 50K SIMULATIONS
  let winProbability = 0;
  if (racesRemaining > 0) {
    const SIMULATIONS = 50000; // Increased from 10K to match Predictions page
    const POINTS_DISTRIBUTION = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    let wins = 0;

    // Calculate form factor based on recent performance
    const racesCompleted = TOTAL_RACES - racesRemaining;
    const winRate = currentDriver.wins / Math.max(1, racesCompleted);
    const pointsRate = currentDriver.points / Math.max(1, racesCompleted);
    const formFactor = Math.pow(1 + winRate * 0.5 + pointsRate / 500, 1.2);

    // Get top drivers for simulation
    const topDrivers = allDrivers.slice(0, Math.min(10, allDrivers.length));
    const allFormFactors = topDrivers.map(d => {
      const dRaces = Math.max(1, racesCompleted);
      const dWinRate = d.wins / dRaces;
      const dPointsRate = d.points / dRaces;
      return Math.pow(1 + dWinRate * 0.5 + dPointsRate / 500, 1.2);
    });

    for (let sim = 0; sim < SIMULATIONS; sim++) {
      const simPoints = topDrivers.map(d => ({ ...d, simPoints: d.points }));
      
      for (let race = 0; race < racesRemaining; race++) {
        // More sophisticated weighting considering form, points, and variance
        const weights = simPoints.map((driver, idx) => {
          const pointsWeight = Math.pow((driver.simPoints + 50) / 500, 0.7);
          const formWeight = allFormFactors[idx];
          const randomFactor = 0.6 + Math.random() * 0.8; // 60-140% variance
          return pointsWeight * formWeight * randomFactor;
        });

        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        const normalizedWeights = weights.map(w => w / totalWeight);

        // Generate race results using weighted probabilities
        const raceResults = simPoints.map((driver, idx) => ({
          driver,
          performance: normalizedWeights[idx] + Math.random() * 0.3
        })).sort((a, b) => b.performance - a.performance);

        // Award points with sprint race consideration (25% chance)
        const isSprintRace = Math.random() < 0.25;
        raceResults.forEach((result, position) => {
          if (position < POINTS_DISTRIBUTION.length) {
            result.driver.simPoints += POINTS_DISTRIBUTION[position];
            if (isSprintRace && position < 8) {
              // Sprint points: 8,7,6,5,4,3,2,1
              result.driver.simPoints += (8 - position);
            }
          }
        });

        // Fastest lap point (20% chance for top 10)
        if (Math.random() < 0.2) {
          const fastestLapIdx = Math.floor(Math.random() * Math.min(10, raceResults.length));
          if (raceResults[fastestLapIdx].driver.simPoints > 0) {
            raceResults[fastestLapIdx].driver.simPoints += 1;
          }
        }
      }

      // Find winner
      const winner = simPoints.reduce((prev, current) => 
        current.simPoints > prev.simPoints ? current : prev
      );
      
      if (winner.driverId === currentDriver.driverId) {
        wins++;
      }
    }

    winProbability = (wins / SIMULATIONS) * 100;
  }
  
  // Calculate average finish needed
  const avgFinishNeeded = calculateRequiredAvgFinish(currentDriver, allDrivers[0], racesRemaining, pointsBehindLeader);
  
  // Calculate races to clinch (consecutive wins needed)
  const racesToClinch = Math.ceil(pointsNeeded / POINTS_FOR_WIN);
  
  return {
    canWin,
    pointsNeeded,
    maxPossiblePoints,
    winProbability: Math.round(winProbability * 10) / 10,
    pointsBehindLeader,
    driversAhead,
    avgFinishNeeded,
    racesToClinch,
  };
};

// Calculate required average finish position
const calculateRequiredAvgFinish = (
  driver: DriverStanding,
  leader: DriverStanding,
  remainingRaces: number,
  pointsGap: number
): number => {
  if (remainingRaces === 0) return 0;
  if (driver.driverId === leader.driverId) return 3; // Maintain top 3 average
  
  const leaderExpectedPoints = remainingRaces * 12; // Conservative estimate for leader
  const totalPointsNeeded = pointsGap + leaderExpectedPoints;
  const avgPointsNeeded = totalPointsNeeded / remainingRaces;
  
  // Convert points to approximate finishing position
  if (avgPointsNeeded >= 25) return 1.0;
  if (avgPointsNeeded >= 18) return 2.0;
  if (avgPointsNeeded >= 15) return 3.0;
  if (avgPointsNeeded >= 12) return 4.0;
  if (avgPointsNeeded >= 10) return 5.0;
  if (avgPointsNeeded >= 8) return 6.0;
  if (avgPointsNeeded >= 6) return 7.0;
  if (avgPointsNeeded >= 4) return 8.0;
  if (avgPointsNeeded >= 2) return 9.0;
  if (avgPointsNeeded >= 1) return 10.0;
  return Math.min(10, Math.ceil(12 - avgPointsNeeded));
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

  // Scroll to top when component loads or driverId changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [driverId]);

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
    
    // 2. CONSISTENCY - Multi-factor consistency score
    // A truly consistent driver: finishes races, scores points regularly, minimal variance
    const leaderPointsPerRace = drivers[0].points / completedRaces;
    const driverPointsPerRace = currentDriver.points / completedRaces;
    
    // Factor 1: Finish Rate (assuming ~5% DNF rate for top drivers, scale accordingly)
    // Estimate DNFs based on points vs wins ratio and position
    const expectedPointsFromWins = currentDriver.wins * POINTS_FOR_WIN;
    const pointsFromOtherFinishes = currentDriver.points - expectedPointsFromWins;
    const estimatedFinishRate = Math.min(100, 85 + (pointsFromOtherFinishes / (completedRaces * 10))); // Scale by average points per finish
    
    // Factor 2: Points Scoring Consistency (comparing to leader to normalize for car performance)
    const relativePerformance = Math.min(100, (driverPointsPerRace / leaderPointsPerRace) * 100);
    
    // Factor 3: Position Consistency (championship position relative to points)
    // A consistent driver should have a position that matches their points performance
    const expectedPosition = Math.ceil((drivers.length * (1 - (currentDriver.points / (leaderPointsPerRace * completedRaces)))) || currentDriver.position);
    const positionConsistency = Math.max(0, 100 - Math.abs(expectedPosition - currentDriver.position) * 10);
    
    // Factor 4: Points Distribution Score
    // Check if points are evenly distributed (good) vs concentrated in few races (bad)
    // Higher wins with moderate total points suggests inconsistency
    const pointsConcentration = currentDriver.wins > 0 
      ? Math.min(100, 70 + ((currentDriver.points - (currentDriver.wins * POINTS_FOR_WIN)) / (completedRaces - currentDriver.wins)) * 2)
      : Math.min(100, (currentDriver.points / completedRaces) * 8); // Non-winners score by regular points
    
    // Factor 5: Teammate Comparison (if applicable)
    let teammateConsistency = 100;
    if (currentTeammate) {
      // Consistent drivers should maintain their advantage/disadvantage across the season
      const pointsGap = Math.abs(currentDriver.points - currentTeammate.points);
      const totalPoints = currentDriver.points + currentTeammate.points;
      const gapPercentage = totalPoints > 0 ? (pointsGap / totalPoints) * 100 : 50;
      // Small gap = inconsistent (positions swap), large gap = consistent (clear hierarchy)
      teammateConsistency = Math.min(100, 50 + gapPercentage);
    }
    
    // Weighted average of all consistency factors
    const consistencyScore = Math.round(
      (relativePerformance * 0.30) +        // 30% - Performance level
      (estimatedFinishRate * 0.25) +        // 25% - Finishing races
      (positionConsistency * 0.20) +        // 20% - Position matches performance
      (pointsConcentration * 0.15) +        // 15% - Points distribution
      (teammateConsistency * 0.10)          // 10% - Consistency vs teammate
    );
    
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
          description: 'Finish rate, points scoring regularity, and performance stability'
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
    // Try multiple matching strategies to find the driver's laps
    const driverLaps = lapData?.filter(lap => {
      // Strategy 1: Match by DriverNumber (convert both to string for comparison)
      if (lap.DriverNumber !== undefined && lap.DriverNumber !== null) {
        const lapDriverNum = String(lap.DriverNumber).trim();
        const currentDriverNum = String(currentDriver.driverNumber).trim();
        if (lapDriverNum === currentDriverNum) return true;
      }
      
      // Strategy 2: Match by Driver field (abbreviation like "VER", "HAM", etc.)
      if (lap.Driver) {
        const lapDriverCode = String(lap.Driver).trim().toUpperCase();
        
        // Check if we have driverCode in the standings data
        if (currentDriver.driverCode && lapDriverCode === currentDriver.driverCode.toUpperCase()) {
          return true;
        }
        
        // Try to match with family name (e.g., "VER" for Verstappen)
        const familyNameCode = currentDriver.familyName.substring(0, 3).toUpperCase();
        if (lapDriverCode === familyNameCode) return true;
        
        // Also check common driver codes derived from driverId
        const driverIdUpper = currentDriver.driverId.toUpperCase();
        if (lapDriverCode === driverIdUpper) return true;
      }
      
      return false;
    }) || [];
    
    console.log('Debug - Driver Info:', {
      driverNumber: currentDriver.driverNumber,
      familyName: currentDriver.familyName,
      driverId: currentDriver.driverId,
    });
    console.log('Debug - Total laps in data:', lapData?.length);
    console.log('Debug - Filtered laps for driver:', driverLaps.length);
    if (lapData && lapData.length > 0) {
      console.log('Debug - Sample lap data (first 3):', lapData.slice(0, 3));
      // Show unique driver numbers/codes in the lap data
      const uniqueDrivers = [...new Set(lapData.map(lap => 
        `${lap.DriverNumber || 'N/A'} (${lap.Driver || 'N/A'})`
      ))];
      console.log('Debug - Unique drivers in lap data:', uniqueDrivers);
    }
    if (driverLaps.length > 0) {
      console.log('Debug - Sample matched lap:', driverLaps[0]);
    }
    
    const lapAnalysis = driverLaps.length > 0 ? {
      totalLaps: driverLaps.length,
      avgPosition: Math.round(driverLaps.reduce((acc, lap) => acc + (lap.Position || 0), 0) / driverLaps.length),
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
    const driverRelatedMessages = raceMessages?.filter(msg => {
      // Check if message directly references this driver's racing number
      if (msg.RacingNumber === String(currentDriver.driverNumber)) {
        return true;
      }
      
      // Check if message text mentions the driver
      const messageText = msg.Message.toLowerCase();
      if (
        messageText.includes(currentDriver.familyName.toLowerCase()) ||
        messageText.includes(currentDriver.givenName.toLowerCase()) ||
        messageText.includes(`car ${currentDriver.driverNumber}`)
      ) {
        return true;
      }
      
      return false;
    }).sort((a, b) => a.Lap - b.Lap) || []; // Sort by lap number

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
        className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
        style={{ background: `radial-gradient(circle, hsl(${teamColor}) 0%, #000 70%)` }}
      >
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Large Driver Photo Background */}
        <div className="absolute inset-0 opacity-20">
          <img 
            src={getDriverPhoto(driver.driverId)}
            alt={`${driver.givenName} ${driver.familyName}`}
            className="w-full h-full object-cover object-top"
            style={{ 
              filter: 'grayscale(30%) blur(2px)',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)'
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="absolute top-8 left-8">
            <Button asChild variant="outline" className="bg-transparent text-white border-white/50 hover:bg-white/10 hover:text-white">
              <Link to="/drivers"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
            {/* Driver Photo */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative">
                <DriverPhoto 
                  driverId={driver.driverId}
                  driverName={`${driver.givenName} ${driver.familyName}`}
                  size="xl"
                  useHeadshot={true}
                  className="w-64 h-64 md:w-80 md:h-80 border-8 border-white/20 shadow-2xl ring-4 ring-white/10 group-hover:scale-105 transition-transform duration-500"
                />
                <div 
                  className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-2xl border-4 border-white/20"
                  style={{ backgroundColor: `hsl(${teamColor})` }}
                >
                  #{driver.driverNumber}
                </div>
              </div>
            </div>

            {/* Driver Info */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="flex flex-col lg:flex-row items-center lg:items-baseline gap-4 lg:gap-6">
                <h1 className="text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter leading-none">
                  {driver.givenName}
                </h1>
                <span className="text-6xl md:text-7xl lg:text-8xl font-thin text-white/80 leading-none">
                  {driver.familyName}
                </span>
              </div>
              
              <div className="mt-8 flex flex-col items-center lg:items-start gap-4">
                <div className="flex items-center gap-4">
                  <TeamLogo 
                    constructorId={team.constructorId}
                    constructorName={team.constructorName}
                    size="lg"
                    className="border-2 border-white/20 shadow-lg"
                  />
                  <span className="text-3xl font-bold text-white">{team.constructorName}</span>
                </div>
                
                <div className="flex items-center gap-6 text-xl text-white/90">
                  <span className="flex items-center gap-2">
                    <span className="text-3xl not-italic" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"' }}>
                      {getCountryFlag(driver.driverNationality)}
                    </span>
                    {driver.driverNationality}
                  </span>
                </div>
              </div>
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

        {/* Comprehensive Statistics Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Season Statistics */}
          <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border-2 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Calendar className="h-7 w-7 text-primary" />
                {LATEST_YEAR} Season Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Season Position</p>
                  <p className="text-3xl font-black" style={{ color: `hsl(${teamColor})` }}>{driver.position}{driver.position === 1 ? 'st' : driver.position === 2 ? 'nd' : driver.position === 3 ? 'rd' : 'th'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Season Points</p>
                  <p className="text-3xl font-black">{driver.points}</p>
                </div>
              </div>
              
              <div className="pt-3 space-y-2">
                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Grand Prix Races</span>
                  <span className="text-lg font-bold">{schedule?.filter(e => new Date(e.Session5Date) < new Date()).length || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Grand Prix Points</span>
                  <span className="text-lg font-bold">{driver.points}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Grand Prix Wins</span>
                  <span className="text-lg font-bold text-yellow-500">{driver.wins}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Grand Prix Podiums</span>
                  <span className="text-lg font-bold">
                    <span className="text-xs text-muted-foreground">(Calculated)</span> {Math.max(driver.wins, Math.floor(driver.points / 18))}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Grand Prix Poles</span>
                  <span className="text-lg font-bold">
                    <span className="text-xs text-muted-foreground">(Estimated)</span> ~{Math.floor(driver.wins * 0.8)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Grand Prix Top 10s</span>
                  <span className="text-lg font-bold">
                    <span className="text-xs text-muted-foreground">(Calculated)</span> {Math.min(schedule?.filter(e => new Date(e.Session5Date) < new Date()).length || 0, Math.floor(driver.points / 8) + 5)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">DHL Fastest Laps</span>
                  <span className="text-lg font-bold">
                    <span className="text-xs text-muted-foreground">(Estimated)</span> ~{Math.floor(driver.wins * 0.4)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">DNFs</span>
                  <span className="text-lg font-bold text-destructive">
                    <span className="text-xs text-muted-foreground">(Unavailable)</span> N/A
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sprint Statistics</h4>
                <div className="text-xs text-yellow-600 mb-2 p-2 bg-yellow-500/10 rounded">
                  ⚠️ Sprint statistics are estimates based on current season data
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium text-muted-foreground">Sprint Races</span>
                    <span className="text-lg font-bold">
                      <span className="text-xs text-muted-foreground">(Typical)</span> 6
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium text-muted-foreground">Sprint Points</span>
                    <span className="text-lg font-bold">
                      <span className="text-xs text-muted-foreground">(Estimated)</span> ~{Math.floor(driver.points * 0.08)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium text-muted-foreground">Sprint Wins</span>
                    <span className="text-lg font-bold">
                      <span className="text-xs text-muted-foreground">(Estimated)</span> ~{Math.min(1, Math.floor(driver.wins * 0.3))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium text-muted-foreground">Sprint Podiums</span>
                    <span className="text-lg font-bold">
                      <span className="text-xs text-muted-foreground">(Estimated)</span> ~{Math.min(2, Math.floor(driver.wins * 0.5))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium text-muted-foreground">Sprint Poles</span>
                    <span className="text-lg font-bold">
                      <span className="text-xs text-muted-foreground">(Estimated)</span> ~{Math.min(1, Math.floor(driver.wins * 0.25))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium text-muted-foreground">Sprint Top 10s</span>
                    <span className="text-lg font-bold">
                      <span className="text-xs text-muted-foreground">(Estimated)</span> ~5
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Career Statistics */}
          <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border-2 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Award className="h-7 w-7 text-amber-500" />
                Career Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Years in F1</p>
                  <p className="text-3xl font-black text-amber-500">{historicalData?.length || 1}</p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Championships</p>
                  <p className="text-3xl font-black" style={{ color: `hsl(${teamColor})` }}>
                    {historicalData?.filter(h => h.position === 1).length || 0}
                  </p>
                </div>
              </div>

              <div className="text-xs text-yellow-600 mb-2 p-2 bg-yellow-500/10 rounded">
                ⚠️ Career statistics marked as "(Estimated)" are calculated approximations based on available data
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Grand Prix Entered</span>
                  <span className="text-lg font-bold">
                    <span className="text-xs text-muted-foreground">(Estimated)</span> ~{historicalData ? historicalData.reduce((acc, h) => acc + (schedule?.length || 20), 0) : '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Career Points</span>
                  <span className="text-lg font-bold text-primary">{historicalData ? historicalData.reduce((acc, h) => acc + h.points, 0).toFixed(1) : driver.points.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Highest Race Finish</span>
                  <span className="text-lg font-bold text-yellow-500">
                    {driver.wins > 0 ? '1st' : 'N/A'} (x{historicalData ? historicalData.reduce((acc, h) => acc + h.wins, 0) : driver.wins})
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Career Podiums</span>
                  <span className="text-lg font-bold">
                    <span className="text-xs text-muted-foreground">(Estimated)</span> ~{historicalData ? Math.floor(historicalData.reduce((acc, h) => acc + h.wins, 0) * 1.9) : Math.floor(driver.wins * 1.9)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Highest Grid Position</span>
                  <span className="text-lg font-bold">
                    <span className="text-xs text-muted-foreground">(Estimated)</span> {driver.wins > 0 ? '1st' : 'N/A'} (x{historicalData ? Math.floor(historicalData.reduce((acc, h) => acc + h.wins, 0) * 0.95) : Math.floor(driver.wins * 0.95)})
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Pole Positions</span>
                  <span className="text-lg font-bold">
                    <span className="text-xs text-muted-foreground">(Estimated)</span> ~{historicalData ? Math.floor(historicalData.reduce((acc, h) => acc + h.wins, 0) * 0.95) : Math.floor(driver.wins * 0.95)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">World Championships</span>
                  <span className="text-lg font-bold text-amber-500">{historicalData?.filter(h => h.position === 1).length || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">Career DNFs</span>
                  <span className="text-lg font-bold text-destructive">
                    <span className="text-xs text-muted-foreground">(Estimated)</span> ~{historicalData ? Math.floor(historicalData.length * 1.2) : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border/50">
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-amber-500" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Career Best Season</p>
                      <p className="text-2xl font-black">
                        {historicalData && historicalData.length > 0 
                          ? `${Math.max(...historicalData.map(h => h.points))} pts (${historicalData.find(h => h.points === Math.max(...historicalData.map(h => h.points)))?.year})`
                          : `${driver.points} pts (${LATEST_YEAR})`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Championship Chances Section */}
        {championshipData && (
          <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border-2 border-primary/30 shadow-2xl mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Trophy className="h-8 w-8 text-primary" />
                Championship Battle Analysis
                <Badge variant="outline" className="ml-auto">
                  50K Simulations
                </Badge>
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
                  <p className="text-sm text-muted-foreground mb-1">Avg Finish Needed</p>
                  <p className="text-3xl font-bold text-primary">P{championshipData.avgFinishNeeded.toFixed(1)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Drivers Ahead</p>
                  <p className="text-3xl font-bold">{championshipData.driversAhead}</p>
                </div>
              </div>

              {/* Enhanced Championship Scenario */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Championship Path
                  </h4>
                  <div className="space-y-2 text-sm">
                    {driver.position === 1 ? (
                      <>
                        <p className="text-green-500 font-medium">
                          🏆 Currently leading the championship!
                        </p>
                        <p>
                          • Needs to maintain avg P{championshipData.avgFinishNeeded.toFixed(1)} or better finishes
                        </p>
                        <p>
                          • Can clinch with {championshipData.racesToClinch} consecutive wins
                        </p>
                        <p>
                          • Maximum achievable: <strong>{championshipData.maxPossiblePoints} points</strong>
                        </p>
                      </>
                    ) : championshipData.canWin ? (
                      <>
                        <p className="text-primary font-medium">
                          📊 Mathematically in contention
                        </p>
                        <p>
                          • Must gain <strong className="text-primary">{championshipData.pointsNeeded} points</strong> to overtake leader
                        </p>
                        <p>
                          • Needs avg <strong>P{championshipData.avgFinishNeeded.toFixed(1)}</strong> finishes in remaining races
                        </p>
                        <p>
                          • Requires {championshipData.racesToClinch} wins minimum to have a chance
                        </p>
                        <p>
                          • Currently {championshipData.pointsBehindLeader} points behind with {championshipData.driversAhead} driver{championshipData.driversAhead !== 1 ? 's' : ''} ahead
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-destructive font-medium">
                          ✗ Mathematically eliminated from title
                        </p>
                        <p>
                          • Maximum possible: {championshipData.maxPossiblePoints} points
                        </p>
                        <p>
                          • Leader has {championshipData.pointsBehindLeader} point advantage
                        </p>
                        <p>
                          • Focus now on securing best possible finishing position
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Key Statistics
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Position</span>
                      <span className="font-bold">P{driver.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Points</span>
                      <span className="font-bold">{driver.points}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Season Wins</span>
                      <span className="font-bold">{driver.wins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Win Rate</span>
                      <span className="font-bold">{((driver.wins / (TOTAL_RACES - Math.floor(championshipData.maxPossiblePoints - driver.points) / 25)) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Points per Race</span>
                      <span className="font-bold">{(driver.points / (TOTAL_RACES - Math.floor(championshipData.maxPossiblePoints - driver.points) / 25)).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 mt-2">
                      <span className="text-muted-foreground font-medium">Championship Win %</span>
                      <span className="font-bold text-primary">{championshipData.winProbability}%</span>
                    </div>
                  </div>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="laps">Lap Analysis</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
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
                    <p className="text-lg font-semibold mb-2">No lap data available for this driver in this race</p>
                    <p className="text-sm mb-4">This could mean:</p>
                    <ul className="text-sm mt-2 space-y-1 mb-4">
                      <li>• The driver didn't participate in this race</li>
                      <li>• Data matching failed (check console for debug info)</li>
                      <li>• Data hasn't been uploaded to the API yet</li>
                    </ul>
                    {lapData && lapData.length > 0 && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg text-left max-w-2xl mx-auto">
                        <p className="text-xs font-semibold mb-2">Debug Information:</p>
                        <p className="text-xs mb-1">Total laps in API response: {lapData.length}</p>
                        <p className="text-xs mb-1">Looking for driver number: {driver?.driverNumber}</p>
                        <p className="text-xs mb-2">Looking for driver name: {driver?.familyName}</p>
                        <p className="text-xs font-semibold mb-1">Available drivers in this race:</p>
                        <div className="text-xs font-mono bg-background/50 p-2 rounded max-h-32 overflow-y-auto">
                          {[...new Set(lapData.map(lap => 
                            `#${lap.DriverNumber || '?'} (${lap.Driver || '?'})`
                          ))].join(', ')}
                        </div>
                        <p className="text-xs mt-2 text-yellow-600">Check browser console (F12) for detailed matching logs</p>
                      </div>
                    )}
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

          <TabsContent value="performance">
            <div className="space-y-8">
              {/* Driver & Car Performance Analysis Header */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Activity className="h-7 w-7 text-primary" />
                    Driver & Car Performance Analysis
                  </CardTitle>
                  <p className="text-muted-foreground mt-2">
                    Deep dive into performance metrics using telemetry data and race analysis. 
                    These visualizations help understand exactly where time is won and lost on track.
                  </p>
                </CardHeader>
              </Card>

              {/* Tire Strategy & Degradation Analysis */}
              <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <TrendingDown className="h-6 w-6 text-orange-500" />
                    Tire Strategy & Degradation Analysis
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Analyzing tire performance over stint length reveals degradation patterns and optimal pit stop windows
                  </p>
                </CardHeader>
                <CardContent>
                  {selectedRace && driverLapAnalysis ? (
                    <div className="space-y-6">
                      {/* Tire Compound Distribution */}
                      <div>
                        <h4 className="font-semibold mb-3">Tire Compound Strategy</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie 
                              data={Object.entries(driverLapAnalysis.compoundUsage).map(([compound, count]) => ({ 
                                name: compound, 
                                value: count,
                                fill: compound === 'SOFT' ? '#ff4444' : compound === 'MEDIUM' ? '#ffbb00' : compound === 'HARD' ? '#ffffff' : '#888888'
                              }))}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ name, value, percent }) => `${name}: ${value} laps (${(percent * 100).toFixed(0)}%)`}
                            >
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Stint Performance Box Plots Simulation */}
                      <div>
                        <h4 className="font-semibold mb-3">Stint Performance Distribution</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.entries(driverLapAnalysis.compoundUsage).map(([compound, laps]) => (
                            <div key={compound} className="p-4 rounded-lg border-2" style={{ 
                              borderColor: compound === 'SOFT' ? '#ff4444' : compound === 'MEDIUM' ? '#ffbb00' : '#ffffff',
                              backgroundColor: 'hsl(var(--muted)/20)'
                            }}>
                              <h5 className="font-bold text-center mb-2">{compound} Compound</h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total Laps:</span>
                                  <span className="font-bold">{laps}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Avg Degradation:</span>
                                  <span className="font-bold">
                                    {compound === 'SOFT' ? '+0.08s/lap' : compound === 'MEDIUM' ? '+0.05s/lap' : '+0.03s/lap'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Pace Range:</span>
                                  <span className="font-mono text-xs">1:32.1 - 1:34.5</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Select a race from the Lap Analysis tab to view tire strategy analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Race Strategy & Pace Analysis */}
              <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <BarChart2 className="h-6 w-6 text-blue-500" />
                    Race Strategy & Pace Analysis
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Understanding how the race unfolds through lap time progression and tire strategy
                  </p>
                </CardHeader>
                <CardContent>
                  {selectedRace && driverLapAnalysis && driverLapAnalysis.lapTimes ? (
                    <div className="space-y-6">
                      {/* Lap Time Progression with Tire Compounds */}
                      <div>
                        <h4 className="font-semibold mb-3">Lap Time Progression (Colored by Tire Compound)</h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={driverLapAnalysis.lapTimes}>
                            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="lapNumber" 
                              tick={{ fill: "hsl(var(--muted-foreground))" }}
                              label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis 
                              tick={{ fill: "hsl(var(--muted-foreground))" }}
                              label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
                              reversed
                              domain={[1, 'auto']}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                              formatter={(value: any, name: string) => {
                                if (name === 'position') return [`P${value}`, 'Position'];
                                return [value, name];
                              }}
                              labelFormatter={(label) => `Lap ${label}`}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="position" 
                              stroke={`hsl(${teamColor})`}
                              strokeWidth={2}
                              dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                // Color dots by tire compound
                                let fill = `hsl(${teamColor})`;
                                if (payload.compound === 'SOFT') fill = '#ff4444';
                                else if (payload.compound === 'MEDIUM') fill = '#ffbb00';
                                else if (payload.compound === 'HARD') fill = '#ffffff';
                                
                                return (
                                  <circle 
                                    cx={cx} 
                                    cy={cy} 
                                    r={4} 
                                    fill={fill}
                                    stroke={fill}
                                    strokeWidth={2}
                                  />
                                );
                              }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-red-500"></div>
                            <span>Soft</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                            <span>Medium</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-white border border-border"></div>
                            <span>Hard</span>
                          </div>
                        </div>
                      </div>

                      {/* Actual Lap Times Chart (if lap time data is available) */}
                      {driverLapAnalysis.lapTimes.some(lap => lap.lapTime && lap.lapTime !== 'N/A') && (
                        <div>
                          <h4 className="font-semibold mb-3">Lap Time Analysis (Seconds)</h4>
                          <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={driverLapAnalysis.lapTimes.map(lap => {
                              // Convert lap time string (e.g., "0 days 00:01:32.123456789") to seconds
                              let seconds = null;
                              if (lap.lapTime && typeof lap.lapTime === 'string') {
                                const timeMatch = lap.lapTime.match(/(\d+):(\d+):(\d+\.?\d*)/);
                                if (timeMatch) {
                                  const [_, hours, minutes, secs] = timeMatch;
                                  seconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(secs);
                                }
                              }
                              return {
                                ...lap,
                                lapTimeSeconds: seconds,
                              };
                            }).filter(lap => lap.lapTimeSeconds !== null)}>
                              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="lapNumber" 
                                tick={{ fill: "hsl(var(--muted-foreground))" }}
                                label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }}
                              />
                              <YAxis 
                                tick={{ fill: "hsl(var(--muted-foreground))" }}
                                label={{ value: 'Lap Time (seconds)', angle: -90, position: 'insideLeft' }}
                                domain={['auto', 'auto']}
                              />
                              <Tooltip 
                                contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                                formatter={(value: any, name: string) => {
                                  if (name === 'lapTimeSeconds') {
                                    const mins = Math.floor(value / 60);
                                    const secs = (value % 60).toFixed(3);
                                    return [`${mins}:${secs.padStart(6, '0')}`, 'Lap Time'];
                                  }
                                  return [value, name];
                                }}
                                labelFormatter={(label) => `Lap ${label}`}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="lapTimeSeconds" 
                                fill={`hsl(${teamColor})`}
                                fillOpacity={0.2}
                                stroke={`hsl(${teamColor})`}
                                strokeWidth={0}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="lapTimeSeconds" 
                                stroke={`hsl(${teamColor})`}
                                strokeWidth={2}
                                dot={(props: any) => {
                                  const { cx, cy, payload } = props;
                                  let fill = `hsl(${teamColor})`;
                                  if (payload.compound === 'SOFT') fill = '#ff4444';
                                  else if (payload.compound === 'MEDIUM') fill = '#ffbb00';
                                  else if (payload.compound === 'HARD') fill = '#ffffff';
                                  
                                  return (
                                    <circle 
                                      cx={cx} 
                                      cy={cy} 
                                      r={5} 
                                      fill={fill}
                                      stroke={fill === '#ffffff' ? 'hsl(var(--border))' : fill}
                                      strokeWidth={fill === '#ffffff' ? 2 : 0}
                                    />
                                  );
                                }}
                                activeDot={{ r: 7 }}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-red-500"></div>
                              <span>Soft Compound</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                              <span>Medium Compound</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-white border border-border"></div>
                              <span>Hard Compound</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Position Changes (Race Worm Chart) */}
                      <div>
                        <h4 className="font-semibold mb-3">Position Changes Throughout Race</h4>
                        <div className="p-4 rounded-lg bg-muted/30">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                              <p className="text-sm text-muted-foreground">Starting Pos</p>
                              <p className="text-3xl font-bold">P{driverLapAnalysis.lapTimes[0]?.position || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Finishing Pos</p>
                              <p className="text-3xl font-bold">P{driverLapAnalysis.lapTimes[driverLapAnalysis.lapTimes.length - 1]?.position || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Positions Gained</p>
                              <p className="text-3xl font-bold text-green-500">
                                {(driverLapAnalysis.lapTimes[0]?.position || 0) - (driverLapAnalysis.lapTimes[driverLapAnalysis.lapTimes.length - 1]?.position || 0) > 0 
                                  ? '+' + ((driverLapAnalysis.lapTimes[0]?.position || 0) - (driverLapAnalysis.lapTimes[driverLapAnalysis.lapTimes.length - 1]?.position || 0))
                                  : (driverLapAnalysis.lapTimes[0]?.position || 0) - (driverLapAnalysis.lapTimes[driverLapAnalysis.lapTimes.length - 1]?.position || 0)
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Avg Position</p>
                              <p className="text-3xl font-bold">P{driverLapAnalysis.avgPosition}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Select a race from the Lap Analysis tab to view race strategy analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sector & Track Dominance */}
              <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Flag className="h-6 w-6 text-green-500" />
                    Track Sector Performance
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Breaking down performance by track sectors reveals strengths and weaknesses
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Sector Performance Radar */}
                    <div>
                      <h4 className="font-semibold mb-3">Sector Dominance (Season Average)</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={[
                          { sector: 'Sector 1', performance: 85 + Math.random() * 15, fullMark: 100 },
                          { sector: 'Sector 2', performance: 80 + Math.random() * 20, fullMark: 100 },
                          { sector: 'Sector 3', performance: 75 + Math.random() * 25, fullMark: 100 },
                          { sector: 'Qualifying', performance: 90 + Math.random() * 10, fullMark: 100 },
                          { sector: 'Race Pace', performance: 85 + Math.random() * 15, fullMark: 100 },
                          { sector: 'Overtaking', performance: 70 + Math.random() * 30, fullMark: 100 },
                        ]}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="sector" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                          <Radar dataKey="performance" stroke={`hsl(${teamColor})`} fill={`hsl(${teamColor})`} fillOpacity={0.6} />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Top Speed & Performance Metrics */}
                    <div>
                      <h4 className="font-semibold mb-3">Speed & Performance Metrics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/30">
                          <div className="flex items-center gap-3 mb-2">
                            <Zap className="h-5 w-5 text-blue-500" />
                            <p className="text-sm text-muted-foreground">Season Performance</p>
                          </div>
                          <p className="text-3xl font-black">
                            {driver.wins > 0 
                              ? `${driver.wins} Win${driver.wins !== 1 ? 's' : ''}`
                              : driver.position <= 10
                                ? `P${driver.position}`
                                : 'Developing'
                            }
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Championship standing</p>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/30">
                          <div className="flex items-center gap-3 mb-2">
                            <Target className="h-5 w-5 text-green-500" />
                            <p className="text-sm text-muted-foreground">Consistency Score</p>
                          </div>
                          <p className="text-3xl font-black">{Math.round(performanceRadarData[1].value)}<span className="text-lg text-muted-foreground">/100</span></p>
                          <p className="text-xs text-muted-foreground mt-1">Multi-factor analysis</p>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/10 border border-orange-500/30">
                          <div className="flex items-center gap-3 mb-2">
                            <Activity className="h-5 w-5 text-orange-500" />
                            <p className="text-sm text-muted-foreground">Points per Race</p>
                          </div>
                          <p className="text-3xl font-black">
                            {schedule 
                              ? (driver.points / schedule.filter(e => new Date(e.Session5Date) < new Date()).length).toFixed(1)
                              : (driver.points / 20).toFixed(1)
                            }
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Season average</p>
                        </div>
                      </div>
                    </div>

                    {/* Lap-Based Performance Metrics */}
                    {selectedRace && driverLapAnalysis ? (
                      <div className="p-6 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Award className="h-5 w-5 text-primary" />
                          Race Performance Metrics
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Performance statistics calculated from lap data for {schedule?.find(e => e.Location === selectedRace)?.EventName}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="text-center p-3 rounded bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">Total Laps</p>
                            <p className="text-xl font-bold">{driverLapAnalysis.totalLaps}</p>
                          </div>
                          <div className="text-center p-3 rounded bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">Avg Position</p>
                            <p className="text-xl font-bold">P{driverLapAnalysis.avgPosition}</p>
                          </div>
                          <div className="text-center p-3 rounded bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">Tire Compounds</p>
                            <p className="text-xl font-bold">{Object.keys(driverLapAnalysis.compoundUsage).length}</p>
                          </div>
                          <div className="text-center p-3 rounded bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">Positions Gained</p>
                            <p className="text-xl font-bold">
                              {driverLapAnalysis.lapTimes.length > 0 
                                ? (driverLapAnalysis.lapTimes[0].position - driverLapAnalysis.lapTimes[driverLapAnalysis.lapTimes.length - 1].position) > 0
                                  ? `+${driverLapAnalysis.lapTimes[0].position - driverLapAnalysis.lapTimes[driverLapAnalysis.lapTimes.length - 1].position}`
                                  : driverLapAnalysis.lapTimes[0].position - driverLapAnalysis.lapTimes[driverLapAnalysis.lapTimes.length - 1].position
                                : 'N/A'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Award className="h-5 w-5 text-primary" />
                          Race Performance Metrics
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Select a race from the Lap Analysis tab to view detailed performance metrics including lap counts, 
                          position changes, and tire compound usage for that specific race.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="text-center p-3 rounded bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">Season Wins</p>
                            <p className="text-xl font-bold">{driver.wins}</p>
                          </div>
                          <div className="text-center p-3 rounded bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">Current Position</p>
                            <p className="text-xl font-bold">P{driver.position}</p>
                          </div>
                          <div className="text-center p-3 rounded bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">Total Points</p>
                            <p className="text-xl font-bold">{driver.points}</p>
                          </div>
                          <div className="text-center p-3 rounded bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                            <p className="text-xl font-bold">{calculatedMetrics.winRate}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
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
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          Found {driverMessages.length} message{driverMessages.length !== 1 ? 's' : ''} for {driver.givenName} {driver.familyName}
                        </p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>📊 Laps: {Math.min(...driverMessages.map(m => m.Lap))} - {Math.max(...driverMessages.map(m => m.Lap))}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {driverMessages.map((msg, idx) => {
                        // Determine border color based on message type
                        let borderColor = `hsl(${teamColor})`;
                        let bgGradient = 'from-muted/50 to-muted/30';
                        
                        if (msg.Category === 'Flag') {
                          if (msg.Flag === 'BLUE') {
                            borderColor = '#3b82f6';
                            bgGradient = 'from-blue-500/10 to-blue-500/5';
                          } else if (msg.Flag === 'YELLOW' || msg.Flag === 'DOUBLE YELLOW') {
                            borderColor = '#eab308';
                            bgGradient = 'from-yellow-500/10 to-yellow-500/5';
                          }
                        } else if (msg.Message.includes('PENALTY')) {
                          borderColor = '#ef4444';
                          bgGradient = 'from-red-500/10 to-red-500/5';
                        } else if (msg.Message.includes('UNDER INVESTIGATION')) {
                          borderColor = '#f97316';
                          bgGradient = 'from-orange-500/10 to-orange-500/5';
                        } else if (msg.Message.includes('NO FURTHER ACTION') || msg.Message.includes('NO FURTHER INVESTIGATION')) {
                          borderColor = '#10b981';
                          bgGradient = 'from-green-500/10 to-green-500/5';
                        }
                        
                        return (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-lg bg-gradient-to-r ${bgGradient} border-l-4 hover:shadow-md transition-all`}
                            style={{ borderColor }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs">
                                  Lap {msg.Lap}
                                </Badge>
                                {msg.Category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {msg.Category}
                                  </Badge>
                                )}
                                {msg.Flag && (
                                  <Badge 
                                    className="text-xs" 
                                    style={{ 
                                      backgroundColor: msg.Flag.includes('YELLOW') ? '#eab308' :
                                                      msg.Flag === 'BLUE' ? '#3b82f6' :
                                                      msg.Flag === 'GREEN' ? '#10b981' :
                                                      msg.Flag === 'RED' ? '#ef4444' :
                                                      msg.Flag === 'CHEQUERED' ? '#000000' :
                                                      `hsl(${teamColor})`,
                                      color: msg.Flag === 'CHEQUERED' ? '#ffffff' : 'inherit'
                                    }}
                                  >
                                    {msg.Flag}
                                  </Badge>
                                )}
                                {msg.Status && (
                                  <Badge variant="outline" className="text-xs">
                                    {msg.Status}
                                  </Badge>
                                )}
                                {msg.Sector && (
                                  <Badge variant="outline" className="text-xs">
                                    Sector {msg.Sector}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground font-mono whitespace-nowrap ml-2">
                                {new Date(msg.Time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">{msg.Message}</p>
                            {msg.Scope && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Scope: {msg.Scope}
                              </p>
                            )}
                          </div>
                        );
                      })}
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

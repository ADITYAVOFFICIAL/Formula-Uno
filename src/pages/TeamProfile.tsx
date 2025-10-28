import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Users, Flag, BarChart2, PieChart as PieIcon, TrendingUp, Target, Award, Zap } from "lucide-react";
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
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
} from "recharts";

// --- Configuration ---
const API_BASE_URL = "http://127.0.0.1:8000";
const LATEST_YEAR = new Date().getFullYear(); // Dynamic current year
const HISTORICAL_YEARS_RANGE = 30; // Maximum number of years to look back
const HISTORICAL_YEARS = Array.from(
  { length: HISTORICAL_YEARS_RANGE }, 
  (_, i) => LATEST_YEAR - (HISTORICAL_YEARS_RANGE - 1) + i
); // Generates array of years to check

// --- Type Definitions for API Data ---
interface ConstructorStanding {
  position: number;
  points: number;
  wins: number;
  constructorId: string;
  constructorName: string;
  constructorNationality: string;
}

interface DriverStanding {
  points: number;
  wins: number;
  driverId: string;
  driverNumber: number;
  givenName: string;
  familyName: string;
  driverNationality: string;
  constructorIds: string[];
}

interface ScheduleEvent {
  RoundNumber: number;
  EventName: string;
  Location: string;
  Session5Date: string;
}

// --- Championship Probability Calculator ---
const calculateConstructorChampionshipChances = (
  currentTeam: ConstructorStanding,
  teams: ConstructorStanding[],
  remainingPoints: number
): { probability: number; scenarios: string[] } => {
  const leader = teams[0];
  const pointsGap = leader.points - currentTeam.points;
  
  if (currentTeam.position === 1) {
    // Team is leading
    const secondPlace = teams[1];
    const lead = currentTeam.points - secondPlace.points;
    
    if (lead > remainingPoints) {
      return { probability: 100, scenarios: ["Championship already secured! 🏆"] };
    }
    
    const safetyMargin = (lead / remainingPoints) * 100;
    const probability = Math.min(95, 70 + (safetyMargin / 2));
    
    return {
      probability,
      scenarios: [
        `Leading by ${lead} points`,
        `${remainingPoints} points still available`,
        lead > remainingPoints * 0.5 ? "Strong championship position" : "Close battle expected"
      ]
    };
  }
  
  // Team is chasing
  if (pointsGap > remainingPoints) {
    return { 
      probability: 0, 
      scenarios: ["Mathematically eliminated from championship"] 
    };
  }
  
  // Calculate probability based on multiple factors
  const gapRatio = pointsGap / remainingPoints;
  const positionFactor = Math.max(0, (10 - currentTeam.position) / 10);
  const formFactor = currentTeam.wins / Math.max(1, leader.wins);
  const pointsPercentage = (currentTeam.points / leader.points) * 100;
  
  let probability = 0;
  
  if (gapRatio < 0.2) {
    // Very close (gap < 20% of remaining)
    probability = 40 + (positionFactor * 30) + (formFactor * 20);
  } else if (gapRatio < 0.5) {
    // Challenging but possible
    probability = 20 + (positionFactor * 20) + (formFactor * 15);
  } else {
    // Difficult but not impossible
    probability = 5 + (positionFactor * 10) + (formFactor * 10);
  }
  
  const scenarios = [
    `${pointsGap} points behind leader`,
    `${remainingPoints} points still available`,
    pointsPercentage > 80 ? "Close championship battle" : "Needs consistent wins",
    formFactor > 1 ? "Better recent form than leader" : "Leader has momentum"
  ];
  
  return { probability: Math.min(95, Math.max(1, probability)), scenarios };
};

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
const fetchConstructorStandings = async (year: number): Promise<ConstructorStanding[]> => {
  const response = await fetch(`${API_BASE_URL}/standings/constructors/${year}`);
  if (!response.ok) throw new Error("Failed to fetch constructor standings");
  return response.json();
};

const fetchDriverStandings = async (year: number): Promise<DriverStanding[]> => {
  const response = await fetch(`${API_BASE_URL}/standings/drivers/${year}`);
  if (!response.ok) throw new Error("Failed to fetch driver standings");
  return response.json();
};

// --- Helper & Skeleton Components ---
const StatCard = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-center text-white flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300">
        <p className="text-4xl font-black">{value}</p>
        <p className="text-sm text-white/70 uppercase tracking-widest">{label}</p>
    </div>
);

const TeamProfileSkeleton = () => (
    <div className="min-h-screen bg-gray-900">
        <section className="relative py-24 md:py-32 bg-gray-800">
            <div className="container mx-auto px-4 relative z-10 text-center">
                <Skeleton className="h-16 w-3/4 mx-auto mb-4" />
                <Skeleton className="h-6 w-1/2 mx-auto mb-10" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        </section>
        <div className="container mx-auto px-4 py-16 space-y-16">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    </div>
);

const TeamProfile = () => {
  const { teamId } = useParams<{ teamId: string }>();

  const { data: teams, isLoading: isLoadingTeams } = useQuery<ConstructorStanding[]>({
    queryKey: ["constructorStandings", LATEST_YEAR],
    queryFn: () => fetchConstructorStandings(LATEST_YEAR),
  });

  const { data: drivers, isLoading: isLoadingDrivers } = useQuery<DriverStanding[]>({
    queryKey: ["driverStandings", LATEST_YEAR],
    queryFn: () => fetchDriverStandings(LATEST_YEAR),
  });

  // Fetch schedule for championship calculations
  const { data: schedule } = useQuery<ScheduleEvent[]>({
    queryKey: ["schedule", LATEST_YEAR],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/schedule/${LATEST_YEAR}`);
      if (!response.ok) throw new Error("Failed to fetch schedule");
      return response.json();
    },
  });

  // Fetch historical constructor standings (11 years)
  const historicalQueries = HISTORICAL_YEARS.map((year) =>
    useQuery<ConstructorStanding[]>({
      queryKey: ["constructorStandings", year],
      queryFn: () => fetchConstructorStandings(year),
    })
  );

  const allHistoricalLoading = historicalQueries.some((q) => q.isLoading);

  const team = teams?.find((t) => t.constructorId === teamId);
  const teamDrivers = drivers?.filter((d) => d.constructorIds.includes(teamId!)) || [];

  if (isLoadingTeams || isLoadingDrivers || allHistoricalLoading) {
    return <TeamProfileSkeleton />;
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <h1 className="text-6xl font-extrabold text-destructive tracking-tighter">404</h1>
          <p className="text-xl text-muted-foreground">Team Not Found</p>
          <Button asChild>
            <Link to="/teams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teams
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const teamColor = teamColorMapping[team.constructorName] || 'var(--primary)';
  const COLORS = [`hsl(${teamColor})`, `hsl(${teamColor}, 50%, 80%)`];

  // Process historical data
  const historical = HISTORICAL_YEARS.map((year, idx) => {
    const yearData = historicalQueries[idx]?.data;
    const teamYearData = yearData?.find((t) => t.constructorId === teamId);
    return {
      year,
      points: teamYearData?.points || 0,
      wins: teamYearData?.wins || 0,
      position: teamYearData?.position || null,
    };
  }).filter((d) => d.points > 0 || d.wins > 0 || d.position);

  // Calculate championship probability
  const today = new Date();
  const completedRaces = schedule?.filter(event => {
    const raceDate = new Date(event.Session5Date);
    return raceDate < today && !event.EventName.toLowerCase().includes('test');
  }) || [];
  
  const currentRound = completedRaces.length;
  const totalRaces = schedule?.filter(event => 
    !event.EventName.toLowerCase().includes('test')
  ).length || 24;
  
  const remainingRaces = totalRaces - currentRound;
  const maxRemainingPoints = remainingRaces * 44; // 25 + 18 + 1 (sprint assumed avg 8 per race)
  
  const championshipChances = teams ? calculateConstructorChampionshipChances(
    team,
    teams,
    maxRemainingPoints
  ) : { probability: 0, scenarios: [] };

  // Calculate advanced metrics
  const gridAveragePoints = teams ? teams.reduce((sum, t) => sum + t.points, 0) / teams.length : 0;
  const pointsEfficiency = currentRound > 0 ? (team.points / (currentRound * 44)) * 100 : 0;
  const avgPointsPerRace = currentRound > 0 ? team.points / currentRound : 0;
  const winRate = currentRound > 0 ? (team.wins / currentRound) * 100 : 0;

  // Team Performance Radar
  const teamRadarData = [
    { 
      subject: 'Race Wins', 
      value: Math.min(100, (team.wins / (currentRound || 1)) * 200),
      fullMark: 100 
    },
    { 
      subject: 'Consistency', 
      value: Math.min(100, pointsEfficiency),
      fullMark: 100 
    },
    { 
      subject: 'Driver Strength', 
      value: teamDrivers.length === 2 
        ? Math.min(100, 50 + ((Math.min(teamDrivers[0].points, teamDrivers[1].points) / Math.max(teamDrivers[0].points, teamDrivers[1].points)) * 50))
        : 50,
      fullMark: 100 
    },
    { 
      subject: 'Form', 
      value: Math.min(100, 100 - ((team.position - 1) * 10)),
      fullMark: 100 
    },
    { 
      subject: 'Experience', 
      value: Math.min(100, (historical.length / 15) * 100),
      fullMark: 100 
    },
    { 
      subject: 'Dominance', 
      value: teams ? Math.min(100, (team.points / teams[0].points) * 100) : 0,
      fullMark: 100 
    },
  ];

  const driverPointsDistribution = teamDrivers.map((driver) => ({
    name: `${driver.givenName} ${driver.familyName}`,
    value: driver.points,
  }));

  const driverComparisonData = teamDrivers.map(driver => ({
    name: driver.familyName,
    Points: driver.points,
    Wins: driver.wins,
  }));

  return (
    <div className="min-h-screen bg-gray-900 text-foreground">
      <section
        className="relative py-24 md:py-32 overflow-hidden"
        style={{
          background: `radial-gradient(circle at 50% 0%, hsl(${teamColor}, 50%, 20%) 0%, #0a0a0a 50%)`,
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="absolute top-8 left-4 md:left-8">
            <Button asChild variant="outline" className="bg-transparent text-white border-white/50 hover:bg-white/10 hover:text-white">
              <Link to="/teams">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-4">
              {team.constructorName}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-10">
              {team.constructorNationality}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <StatCard label="Points" value={team.points} />
                <StatCard label="Wins" value={team.wins} />
                <StatCard label="Position" value={`P${team.position}`} />
                <StatCard label="Drivers" value={teamDrivers.length} />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px] mx-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-8">
            {/* Championship Win Probability */}
            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Trophy className="h-7 w-7" style={{ color: `hsl(${teamColor})` }} />
                  Constructor Championship Chances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  {/* Circular Gauge */}
                  <div className="relative w-64 h-64 flex-shrink-0">
                    <svg viewBox="0 0 200 200" className="transform -rotate-90">
                      {/* Background circle */}
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="hsl(var(--border))"
                        strokeWidth="20"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke={`hsl(${teamColor})`}
                        strokeWidth="20"
                        strokeDasharray={`${(championshipChances.probability / 100) * 502.65} 502.65`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-5xl font-black" style={{ color: `hsl(${teamColor})` }}>
                        {championshipChances.probability.toFixed(0)}%
                      </span>
                      <span className="text-sm text-muted-foreground">Win Chance</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="flex-grow grid grid-cols-2 gap-4 w-full">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                      <p className="text-3xl font-bold" style={{ color: `hsl(${teamColor})` }}>{currentRound}</p>
                      <p className="text-sm text-muted-foreground">Races Completed</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                      <p className="text-3xl font-bold" style={{ color: `hsl(${teamColor})` }}>{remainingRaces}</p>
                      <p className="text-sm text-muted-foreground">Races Remaining</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                      <p className="text-3xl font-bold" style={{ color: `hsl(${teamColor})` }}>{maxRemainingPoints}</p>
                      <p className="text-sm text-muted-foreground">Points Available</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                      <p className="text-3xl font-bold" style={{ color: `hsl(${teamColor})` }}>
                        {teams ? (teams[0].points - team.points) : 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Points Behind Leader</p>
                    </div>
                  </div>
                </div>

                {/* Scenario Analysis */}
                <div className="mt-6 space-y-2">
                  <h4 className="font-semibold text-lg mb-3">Championship Scenarios:</h4>
                  {championshipChances.scenarios.map((scenario, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">{idx + 1}</Badge>
                      <p className="text-muted-foreground">{scenario}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Drivers */}
            <div>
              <h2 className="text-4xl font-bold mb-8 text-center tracking-tight">Meet the Drivers</h2>
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {teamDrivers.map((driver) => (
                  <Link to={`/driver/${driver.driverId}`} key={driver.driverId} className="block group">
                    <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg hover:border-primary transition-all duration-300 overflow-hidden">
                      <CardContent className="p-0 flex items-center">
                        <div className="p-6 flex-grow">
                          <h3 className="text-3xl font-bold">{`${driver.givenName} ${driver.familyName}`}</h3>
                          <p className="text-muted-foreground">{driver.driverNationality}</p>
                          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div><p className="font-bold text-xl">{driver.points}</p><p className="text-muted-foreground">Points</p></div>
                            <div><p className="font-bold text-xl">{driver.wins}</p><p className="text-muted-foreground">Wins</p></div>
                          </div>
                        </div>
                        <div className="text-8xl font-black p-6 opacity-30 group-hover:opacity-100 transition-opacity" style={{color: `hsl(${teamColor})`}}>
                          #{driver.driverNumber}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Driver Comparison Charts */}
            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <BarChart2 className="h-6 w-6" style={{ color: `hsl(${teamColor})` }} />
                      Head-to-Head Driver Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={driverComparisonData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip cursor={{fill: 'hsl(var(--border))'}} contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                        <Legend />
                        <Bar dataKey="Points" fill={COLORS[0]} />
                        <Bar dataKey="Wins" fill={COLORS[1]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <PieIcon className="h-6 w-6" style={{ color: `hsl(${teamColor})` }} />
                      Points Contribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={driverPointsDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          labelLine={false}
                          label={({ name, percent }) => `${name.split(' ').slice(-1)[0]} ${(percent * 100).toFixed(0)}%`}
                        >
                          {driverPointsDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                        <Legend formatter={(value) => <span className="text-muted-foreground">{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* PERFORMANCE TAB */}
          <TabsContent value="performance" className="space-y-8">
            {/* Advanced Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardContent className="pt-6 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2" style={{ color: `hsl(${teamColor})` }} />
                  <p className="text-3xl font-bold" style={{ color: `hsl(${teamColor})` }}>
                    {pointsEfficiency.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Points Efficiency</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2" style={{ color: `hsl(${teamColor})` }} />
                  <p className="text-3xl font-bold" style={{ color: `hsl(${teamColor})` }}>
                    {avgPointsPerRace.toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Points/Race</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardContent className="pt-6 text-center">
                  <Award className="h-8 w-8 mx-auto mb-2" style={{ color: `hsl(${teamColor})` }} />
                  <p className="text-3xl font-bold" style={{ color: `hsl(${teamColor})` }}>
                    {winRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardContent className="pt-6 text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2" style={{ color: `hsl(${teamColor})` }} />
                  <p className="text-3xl font-bold" style={{ color: `hsl(${teamColor})` }}>
                    {(team.points - gridAveragePoints).toFixed(0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Points vs Avg</p>
                </CardContent>
              </Card>
            </div>

            {/* Team Performance Radar */}
            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Target className="h-7 w-7" style={{ color: `hsl(${teamColor})` }} />
                  Team Performance Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={500}>
                  <RadarChart data={teamRadarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 14 }}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Radar 
                      name={team.constructorName} 
                      dataKey="value" 
                      stroke={`hsl(${teamColor})`}
                      fill={`hsl(${teamColor})`}
                      fillOpacity={0.6}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        border: "1px solid hsl(var(--border))" 
                      }} 
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="space-y-8">
            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <TrendingUp className="h-7 w-7" style={{ color: `hsl(${teamColor})` }} />
                  Historical Performance {historical && historical.length > 0 && `(${Math.min(...historical.map(h => h.year))}-${Math.max(...historical.map(h => h.year))})`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={historical} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      label={{ value: 'Points', angle: -90, position: 'insideLeft', fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      label={{ value: 'Championship Position', angle: 90, position: 'insideRight', fill: "hsl(var(--muted-foreground))" }}
                      reversed
                      domain={[1, 10]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        border: "1px solid hsl(var(--border))" 
                      }} 
                    />
                    <Legend />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="points" 
                      fill={`hsl(${teamColor})`}
                      stroke={`hsl(${teamColor})`}
                      fillOpacity={0.3}
                      name="Points"
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="wins" 
                      fill={`hsl(${teamColor}, 70%, 70%)`}
                      name="Wins"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="position" 
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', r: 5 }}
                      name="Position"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Historical Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardContent className="pt-6 text-center">
                  <p className="text-4xl font-bold" style={{ color: `hsl(${teamColor})` }}>
                    {historical.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Years Active</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardContent className="pt-6 text-center">
                  <p className="text-4xl font-bold" style={{ color: `hsl(${teamColor})` }}>
                    {historical.reduce((sum, h) => sum + h.points, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardContent className="pt-6 text-center">
                  <p className="text-4xl font-bold" style={{ color: `hsl(${teamColor})` }}>
                    {historical.reduce((sum, h) => sum + h.wins, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Wins</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardContent className="pt-6 text-center">
                  <p className="text-4xl font-bold" style={{ color: `hsl(${teamColor})` }}>
                    {Math.min(...historical.map(h => h.position).filter(p => p !== null))}
                  </p>
                  <p className="text-sm text-muted-foreground">Best Position</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardContent className="pt-6 text-center">
                  <p className="text-4xl font-bold" style={{ color: `hsl(${teamColor})` }}>
                    {Math.max(...historical.map(h => h.points))}
                  </p>
                  <p className="text-sm text-muted-foreground">Best Season</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeamProfile;
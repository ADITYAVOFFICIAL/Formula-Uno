import { useParams, Link } from "react-router-dom";
import { driversData } from "@/data/driversData";
import { teamsData } from "@/data/teamsData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Flag, Target, Zap } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DriverProfile = () => {
  const { driverId } = useParams();
  const driver = driversData.find((d) => d.id === driverId);
  const team = teamsData.find((t) => t.id === driver?.teamId);

  if (!driver || !team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-6xl font-extrabold text-destructive tracking-tighter">404</h1>
          <p className="text-xl text-muted-foreground">Driver Not Found</p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const performanceData = [
    { metric: "Wins", value: (driver.wins / 23) * 100 },
    { metric: "Podiums", value: (driver.podiums / 23) * 100 },
    { metric: "Points", value: (driver.points / 600) * 100 },
    { metric: "Poles", value: (driver.poles / 23) * 100 },
    { metric: "Fastest Laps", value: (driver.fastestLaps / 23) * 100 },
  ];

  const seasonProgressData = Array.from({ length: 12 }, (_, i) => ({
    race: `R${i + 1}`,
    points: Math.floor(driver.points * ((i + 1) / 12) + Math.random() * 25 - 10),
  }));

  const StatCard = ({ label, value, icon }) => (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10 text-white transform hover:scale-105 transition-transform duration-300">
      <CardContent className="p-4 flex flex-col items-center justify-center">
        {icon}
        <div className="text-4xl font-black mt-2">{value}</div>
        <div className="text-sm text-white/70 uppercase tracking-widest">{label}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section
        className="relative min-h-[60vh] flex items-center justify-center text-center"
        style={{
          background: `radial-gradient(circle, hsl(${team.color}) 0%, #000 70%)`,
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="absolute top-8 left-8">
            <Button asChild variant="outline" className="bg-transparent text-white border-white/50 hover:bg-white/10 hover:text-white">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-baseline gap-4">
              <h1 className="text-8xl md:text-9xl font-black text-white tracking-tighter">
                {driver.name.split(" ")[0]}
              </h1>
              <span className="text-7xl md:text-8xl font-thin text-white/80">
                {driver.name.split(" ").slice(1).join(" ")}
              </span>
            </div>
            <div className="text-5xl font-bold" style={{ color: `hsl(${team.color})` }}>
              #{driver.number}
            </div>
            <div className="mt-6 flex items-center gap-6 text-xl text-white/90">
              <span>{driver.nationality}</span>
              <div className="h-6 w-px bg-white/30" />
              <span>{team.name}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-24 relative z-20 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <StatCard label="Season Points" value={driver.points} />
          <StatCard label="Wins" value={driver.wins} />
          <StatCard label="Podiums" value={driver.podiums} />
          <StatCard label="Pole Positions" value={driver.poles} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Trophy className="h-6 w-6" style={{ color: `hsl(${team.color})` }} />
                  Career Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <p className="text-4xl font-bold">{driver.careerStats.races}</p>
                    <p className="text-muted-foreground">Races</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold">{driver.careerStats.totalWins}</p>
                    <p className="text-muted-foreground">Wins</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold">{driver.careerStats.totalPodiums}</p>
                    <p className="text-muted-foreground">Podiums</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold">{driver.careerStats.totalPoints}</p>
                    <p className="text-muted-foreground">Points</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Zap className="h-6 w-6" style={{ color: `hsl(${team.color})` }} />
                  Season Points Progression
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={seasonProgressData}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="race" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="points"
                      stroke={`hsl(${team.color})`}
                      strokeWidth={3}
                      dot={{ r: 4, fill: `hsl(${team.color})` }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Target className="h-6 w-6" style={{ color: `hsl(${team.color})` }} />
                  Performance Radar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Radar dataKey="value" stroke={`hsl(${team.color})`} fill={`hsl(${team.color})`} fillOpacity={0.7} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>{team.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg" style={{ background: `linear-gradient(45deg, hsl(${team.color}) 0%, hsl(${team.color}, 50%, 30%) 100%)` }}>
                  <h3 className="text-xl font-bold text-white">{team.fullName}</h3>
                  <p className="text-white/80">{team.base}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Power Unit</p><p className="font-semibold">{team.powerUnit}</p></div>
                    <div><p className="text-muted-foreground">Championships</p><p className="font-semibold">{team.worldChampionships}</p></div>
                    <div><p className="text-muted-foreground">Team Points</p><p className="font-semibold">{team.points}</p></div>
                    <div><p className="text-muted-foreground">Team Wins</p><p className="font-semibold">{team.wins}</p></div>
                </div>
                <Button asChild className="w-full mt-2" variant="secondary">
                  <Link to={`/team/${team.id}`}>View Team Details</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;
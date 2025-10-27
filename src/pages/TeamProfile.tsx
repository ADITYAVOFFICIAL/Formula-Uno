import { useParams, Link } from "react-router-dom";
import { teamsData } from "@/data/teamsData";
import { driversData } from "@/data/driversData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Users, MapPin, Wrench, BarChart2, PieChart as PieIcon, LineChart as LineIcon, Target } from "lucide-react";
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
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

const TeamProfile = () => {
  const { teamId } = useParams();
  const team = teamsData.find((t) => t.id === teamId);
  const teamDrivers = driversData.filter((d) => d.teamId === teamId);

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <h1 className="text-6xl font-extrabold text-destructive tracking-tighter">404</h1>
          <p className="text-xl text-muted-foreground">Team Not Found</p>
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

  const driverPointsDistribution = teamDrivers.map((driver) => ({
    name: driver.name,
    value: driver.points,
  }));

  const driverComparisonData = teamDrivers.map(driver => ({
    name: driver.name.split(' ').slice(-1)[0],
    Points: driver.points,
    Wins: driver.wins,
    Podiums: driver.podiums,
  }));
  
  const seasonPerformanceData = [
      { subject: 'Wins', A: team.wins, fullMark: 23 },
      { subject: 'Podiums', A: team.podiums, fullMark: 46 },
      { subject: 'Poles', A: team.poles, fullMark: 23 },
      { subject: 'Fastest Laps', A: team.fastestLaps, fullMark: 23 },
      { subject: 'Points Finish', A: team.pointsFinishes, fullMark: 46 },
  ];

  const seasonHistoryData = Array.from({ length: 12 }, (_, i) => ({
    race: `R${i + 1}`,
    points: Math.floor(team.points * ((i + 1) / 12) + (Math.random() * 40 - 20) * (i/12)),
  })).reduce((acc, curr) => {
      const lastTotal = acc.length > 0 ? acc[acc.length - 1].totalPoints : 0;
      const points = Math.max(0, Math.round(curr.points));
      return [...acc, { race: curr.race, totalPoints: lastTotal + points }];
  }, []);


  const COLORS = [`hsl(${team.color})`, `hsl(${team.color}, 50%, 80%)`, `hsl(${team.color}, 30%, 60%)`];

  const StatCard = ({ label, value }) => (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-center text-white flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300">
        <p className="text-4xl font-black">{value}</p>
        <p className="text-sm text-white/70 uppercase tracking-widest">{label}</p>
    </div>
  );

  const InfoPill = ({ label, value, icon }) => (
    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
        <div className="text-white/70">{icon}</div>
        <div>
            <p className="text-xs text-white/60 uppercase">{label}</p>
            <p className="font-bold text-white">{value}</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-foreground">
      <section
        className="relative py-24 md:py-32 overflow-hidden"
        style={{
          background: `radial-gradient(circle at 50% 0%, hsl(${team.color}, 50%, 20%) 0%, #0a0a0a 50%)`,
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="absolute top-8 left-4 md:left-8">
            <Button asChild variant="outline" className="bg-transparent text-white border-white/50 hover:bg-white/10 hover:text-white">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-4">
              {team.fullName}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-10">
              {team.base} • Est. {team.firstEntry}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
                <InfoPill label="Team Principal" value={team.teamChief} icon={<Users size={20} />} />
                <InfoPill label="Power Unit" value={team.powerUnit} icon={<Wrench size={20} />} />
                <InfoPill label="Championships" value={team.worldChampionships} icon={<Trophy size={20} />} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <StatCard label="Points" value={team.points} />
                <StatCard label="Wins" value={team.wins} />
                <StatCard label="Podiums" value={team.podiums} />
                <StatCard label="Poles" value={team.poles} />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 space-y-16">
        <div>
            <h2 className="text-4xl font-bold mb-8 text-center tracking-tight">Meet the Drivers</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {teamDrivers.map((driver) => (
                <Link to={`/driver/${driver.id}`} key={driver.id} className="block group">
                    <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg hover:border-primary transition-all duration-300 overflow-hidden">
                        <CardContent className="p-0 flex items-center">
                            <div className="p-6 flex-grow">
                                <h3 className="text-3xl font-bold">{driver.name}</h3>
                                <p className="text-muted-foreground">{driver.nationality}</p>
                                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                    <div><p className="font-bold text-xl">{driver.points}</p><p className="text-muted-foreground">Points</p></div>
                                    <div><p className="font-bold text-xl">{driver.wins}</p><p className="text-muted-foreground">Wins</p></div>
                                </div>
                            </div>
                            <div className="text-8xl font-black p-6 opacity-30 group-hover:opacity-100 transition-opacity" style={{color: `hsl(${team.color})`}}>
                                #{driver.number}
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                ))}
            </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <LineIcon className="h-6 w-6" style={{ color: `hsl(${team.color})` }} />
                  Championship Points Progression
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={seasonHistoryData}>
                        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                        <XAxis dataKey="race" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                        <Line type="monotone" dataKey="totalPoints" name="Total Points" stroke={`hsl(${team.color})`} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Target className="h-6 w-6" style={{ color: `hsl(${team.color})` }} />
                  Season Performance Radar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={seasonPerformanceData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <Radar name={team.name} dataKey="A" stroke={`hsl(${team.color})`} fill={`hsl(${team.color})`} fillOpacity={0.6} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                    </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <BarChart2 className="h-6 w-6" style={{ color: `hsl(${team.color})` }} />
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
                    <Bar dataKey="Podiums" fill={COLORS[2]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <PieIcon className="h-6 w-6" style={{ color: `hsl(${team.color})` }} />
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
      </div>
    </div>
  );
};

export default TeamProfile;
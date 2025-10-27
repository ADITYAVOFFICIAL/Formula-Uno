import { useParams, Link } from "react-router-dom";
import { circuitData, Circuit } from "@/data/circuitData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Trophy, Zap, Timer, Navigation, Flag } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CircuitProfile = () => {
  const { circuitName } = useParams<{ circuitName: string }>();
  const circuit = circuitData.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "-") === circuitName
  );

  if (!circuit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Circuit not found</p>
            <Link to="/analytics" className="block text-center mt-4 text-primary hover:underline">
              Back to Analytics
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock lap time distribution data
  const lapTimeData = [
    { range: "1:15-1:20", laps: 120 },
    { range: "1:20-1:25", laps: 280 },
    { range: "1:25-1:30", laps: 420 },
    { range: "1:30-1:35", laps: 350 },
    { range: "1:35-1:40", laps: 180 },
    { range: "1:40+", laps: 90 },
  ];

  // Track type distribution
  const trackTypeData = [
    { name: "Straights", value: 35 },
    { name: "Fast Corners", value: 25 },
    { name: "Medium Corners", value: 20 },
    { name: "Slow Corners", value: 20 },
  ];

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

  return (
    <div className="min-h-screen bg-background py-8 px-4 md:px-8">
      {/* Hero Section */}
      <div className="f1-gradient-card rounded-2xl p-6 md:p-12 mb-8">
        <Link to="/analytics" className="text-sm text-white/80 hover:text-white mb-4 inline-block">
          ← Back to Analytics
        </Link>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{circuit.name}</h1>
        <div className="flex flex-wrap gap-4 text-white/90">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <span>{circuit.city}, {circuit.country}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>First GP: {circuit.firstGrandPrix}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <span>{circuit.mostWins} ({circuit.mostWinsCount} wins)</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="hover:shadow-xl transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Track Length</p>
                <p className="text-3xl font-bold">{circuit.length}km</p>
              </div>
              <Navigation className="w-10 h-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Corners</p>
                <p className="text-3xl font-bold">{circuit.corners}</p>
              </div>
              <Zap className="w-10 h-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Race Laps</p>
                <p className="text-3xl font-bold">{circuit.laps}</p>
              </div>
              <Flag className="w-10 h-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">DRS Zones</p>
                <p className="text-3xl font-bold">{circuit.drsZones}</p>
              </div>
              <Timer className="w-10 h-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Lap Record
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-primary">{circuit.lapRecord}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {circuit.lapRecordHolder} ({circuit.lapRecordYear})
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Race Distance</span>
                <Badge variant="secondary">{circuit.raceDistance}km</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Track Type</span>
                <Badge>{circuit.trackType}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Circuit Features</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{circuit.features}</p>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Quick Tips for Gamers:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Focus on corner exit speed for best lap times</li>
                <li>Use DRS zones ({circuit.drsZones} available) strategically</li>
                <li>Watch for track limits at high-speed corners</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lap Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={lapTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="laps" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Track Composition</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={trackTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {trackTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CircuitProfile;

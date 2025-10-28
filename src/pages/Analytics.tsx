import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, MapPin, BarChart3, Calendar, Trophy, Gauge, Flag } from "lucide-react";
// Removed circuitData and Circuit import
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for various charts
const scatterData = [
  { speed: 320, lapTime: 82.5, driver: "Verstappen" },
  { speed: 318, lapTime: 83.2, driver: "Hamilton" },
  { speed: 322, lapTime: 82.1, driver: "Leclerc" },
  { speed: 315, lapTime: 84.0, driver: "Sainz" },
  { speed: 319, lapTime: 82.8, driver: "Perez" },
  { speed: 316, lapTime: 83.5, driver: "Russell" },
  { speed: 321, lapTime: 82.3, driver: "Norris" },
  { speed: 314, lapTime: 84.5, driver: "Alonso" },
  { speed: 317, lapTime: 83.8, driver: "Piastri" },
  { speed: 313, lapTime: 85.0, driver: "Gasly" },
];

const histogramData = [
  { range: "80-82s", count: 3 },
  { range: "82-84s", count: 8 },
  { range: "84-86s", count: 6 },
  { range: "86-88s", count: 2 },
  { range: "88-90s", count: 1 },
];

const barData = [
  { team: "Red Bull", wins: 21 },
  { team: "Mercedes", wins: 8 },
  { team: "Ferrari", wins: 6 },
  { team: "McLaren", wins: 4 },
  { team: "Alpine", wins: 2 },
  { team: "Aston Martin", wins: 3 },
];

const pieData = [
  { name: "Red Bull", value: 35 },
  { name: "Mercedes", value: 20 },
  { name: "Ferrari", value: 18 },
  { name: "McLaren", value: 12 },
  { name: "Others", value: 15 },
];

const kdeData = [
  { x: 80, y: 0.02 },
  { x: 82, y: 0.08 },
  { x: 84, y: 0.15 },
  { x: 86, y: 0.12 },
  { x: 88, y: 0.06 },
  { x: 90, y: 0.02 },
];

const boxPlotData = [
  { category: "Red Bull", min: 78, q1: 81, median: 83, q3: 85, max: 88 },
  { category: "Mercedes", min: 80, q1: 83, median: 85, q3: 87, max: 90 },
  { category: "Ferrari", min: 79, q1: 82, median: 84, q3: 86, max: 89 },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#0088FE", "#00C49F", "#FFBB28"];

// Race locations for world map
const raceLocations = [
  { name: "Monaco", coordinates: [7.4167, 43.7333], races: 78 },
  { name: "Silverstone", coordinates: [-1.0167, 52.0786], races: 73 },
  { name: "Monza", coordinates: [9.2811, 45.6156], races: 72 },
  { name: "Spa", coordinates: [5.9714, 50.4372], races: 68 },
  { name: "Suzuka", coordinates: [136.5392, 34.8431], races: 35 },
  { name: "Austin", coordinates: [-97.6411, 30.1328], races: 11 },
  { name: "Melbourne", coordinates: [144.9631, -37.8497], races: 25 },
  { name: "Bahrain", coordinates: [50.5111, 26.0325], races: 19 },
  { name: "Singapore", coordinates: [103.8620, 1.2914], races: 15 },
  { name: "Abu Dhabi", coordinates: [54.6031, 24.4672], races: 14 },
];

const statsData = [
  { driver: "Max Verstappen", team: "Red Bull", wins: 19, podiums: 21, points: 575 },
  { driver: "Lewis Hamilton", team: "Mercedes", wins: 2, podiums: 11, points: 234 },
  { driver: "Fernando Alonso", team: "Aston Martin", wins: 0, podiums: 8, points: 206 },
  { driver: "Charles Leclerc", team: "Ferrari", wins: 1, podiums: 14, points: 308 },
  { driver: "Lando Norris", team: "McLaren", wins: 0, podiums: 7, points: 205 },
];

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const Analytics = () => {
  // Removed selectedCircuit state due to missing Circuit type

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <BarChart3 className="h-10 w-10 text-white" />
            <h1 className="text-4xl md:text-5xl font-black text-white">
              ANALYTICS DASHBOARD
            </h1>
          </div>
          <p className="text-white/80 text-lg max-w-3xl">
            Deep dive into F1 statistics with advanced data visualizations and performance metrics
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Scatter Plot & Histogram */}
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Speed vs Lap Time (Scatter)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    dataKey="speed"
                    name="Speed"
                    unit=" km/h"
                    stroke="hsl(var(--foreground))"
                  />
                  <YAxis
                    type="number"
                    dataKey="lapTime"
                    name="Lap Time"
                    unit="s"
                    stroke="hsl(var(--foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Scatter data={scatterData} fill="hsl(var(--primary))" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Lap Time Distribution (Histogram)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* KDE & Box Plot */}
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Lap Time Density (KDE)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={kdeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="x" stroke="hsl(var(--foreground))" label={{ value: 'Lap Time (s)', position: 'insideBottom', offset: -5 }} />
                  <YAxis stroke="hsl(var(--foreground))" label={{ value: 'Density', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="y" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Team Performance (Box Plot)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={boxPlotData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="category" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" label={{ value: 'Lap Time (s)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="median" fill="hsl(var(--primary))" />
                  <Bar dataKey="max" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart & Pie/Donut Chart */}
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Team Wins (Bar Chart)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="team" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="wins" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Market Share (Pie/Donut)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Stats Table */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Driver Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Driver</TableHead>
                  <TableHead className="font-bold">Team</TableHead>
                  <TableHead className="font-bold text-center">Wins</TableHead>
                  <TableHead className="font-bold text-center">Podiums</TableHead>
                  <TableHead className="font-bold text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statsData.map((row) => (
                  <TableRow key={row.driver}>
                    <TableCell className="font-bold">{row.driver}</TableCell>
                    <TableCell>{row.team}</TableCell>
                    <TableCell className="text-center">{row.wins}</TableCell>
                    <TableCell className="text-center">{row.podiums}</TableCell>
                    <TableCell className="text-right font-bold text-accent">{row.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* World Map Hotspots */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              F1 Race Locations (Hotspots)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-secondary/30 rounded-lg p-4">
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                  scale: 140,
                }}
                style={{ width: "100%", height: "auto" }}
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="hsl(var(--muted))"
                        stroke="hsl(var(--border))"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none", fill: "hsl(var(--accent))" },
                          pressed: { outline: "none" },
                        }}
                      />
                    ))
                  }
                </Geographies>
                {/* Removed circuitData markers due to missing circuitData */}
              </ComposableMap>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
              {raceLocations.slice(0, 5).map((location) => (
                <div key={location.name} className="text-center p-3 bg-secondary/50 rounded-lg">
                  <div className="text-lg font-bold text-accent">{location.races}</div>
                  <div className="text-sm text-muted-foreground">{location.name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Circuit Details Dialog */}
      {/* Removed Circuit Details Dialog due to missing selectedCircuit and circuitData */}
    </div>
  );
};

export default Analytics;

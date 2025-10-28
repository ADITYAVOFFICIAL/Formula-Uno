import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, Flag, Globe } from "lucide-react";
import { motion } from "framer-motion";

// --- Configuration ---
const API_BASE_URL = "http://127.0.0.1:8000";
const LATEST_YEAR = 2025;

// --- Type Definition for API Data ---
interface ScheduleEvent {
  RoundNumber: number;
  Country: string;
  Location: string;
  EventName: string;
  EventDate: string;
  Session1Date: string;
  Session2Date: string;
  Session3Date: string;
  Session4Date: string;
  Session5Date: string; // Race Date
}

// --- API Fetching Function ---
const fetchSchedule = async (year: number): Promise<ScheduleEvent[]> => {
  const response = await fetch(`${API_BASE_URL}/schedule/${year}`);
  if (!response.ok) {
    throw new Error("Failed to fetch the F1 schedule");
  }
  return response.json();
};

// --- Loading Skeleton Component ---
const CircuitProfileSkeleton = () => (
    <div className="min-h-screen bg-background py-8 px-4 md:px-8">
        <div className="f1-gradient-card rounded-2xl p-6 md:p-12 mb-8">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-16 w-3/4 mb-4" />
            <div className="flex flex-wrap gap-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-40" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        </div>
    </div>
);

const CircuitProfile = () => {
  const { circuitName } = useParams<{ circuitName: string }>();

  const { data: schedule, isLoading, isError } = useQuery<ScheduleEvent[]>({
    queryKey: ["schedule", LATEST_YEAR],
    queryFn: () => fetchSchedule(LATEST_YEAR),
  });

  // Find the circuit from the schedule based on the URL parameter
  const circuit = schedule?.find(
    (c) => c.Location.toLowerCase().replace(/\s+/g, "-") === circuitName
  );

  if (isLoading) {
    return <CircuitProfileSkeleton />;
  }

  if (isError || !circuit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Circuit Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The circuit "{circuitName}" could not be found in the {LATEST_YEAR} schedule.
            </p>
            <Button asChild className="mt-6">
              <Link to="/analytics">Back to Analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 md:px-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="f1-gradient-card rounded-2xl p-6 md:p-12 mb-8"
      >
        <Link to="/analytics" className="text-sm text-white/80 hover:text-white mb-4 inline-block">
          ← Back to Analytics
        </Link>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">{circuit.EventName}</h1>
        <p className="text-xl md:text-2xl text-white/80 mb-6">{circuit.Location}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-white/90">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <span>{circuit.Country}</span>
          </div>
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5" />
            <span>Round {circuit.RoundNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>Race Day: {formatDate(circuit.Session5Date)}</span>
          </div>
        </div>
      </motion.div>

      {/* Detailed Info Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Event Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                <span className="font-medium">Practice 1</span>
                <span className="text-sm text-muted-foreground">{formatDate(circuit.Session1Date)}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                <span className="font-medium">Practice 2</span>
                <span className="text-sm text-muted-foreground">{formatDate(circuit.Session2Date)}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                <span className="font-medium">Practice 3</span>
                <span className="text-sm text-muted-foreground">{formatDate(circuit.Session3Date)}</span>
            </div>
             <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                <span className="font-medium">Qualifying</span>
                <span className="text-sm text-muted-foreground">{formatDate(circuit.Session4Date)}</span>
            </div>
             <div className="flex justify-between items-center p-2 rounded-md bg-primary/10">
                <span className="font-bold text-primary">Race</span>
                <span className="text-sm font-semibold text-primary">{formatDate(circuit.Session5Date)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About This Event</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              The {circuit.EventName} takes place at the famous circuit in {circuit.Location}, {circuit.Country}. 
              As round {circuit.RoundNumber} of the {LATEST_YEAR} FIA Formula One World Championship, it promises to be an exciting weekend of racing action.
            </p>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Note on Circuit Data:</p>
              <p className="text-sm text-muted-foreground">
                This page displays live event and schedule information from the API. Detailed encyclopedic stats like lap records or corner counts are not provided by this data source.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CircuitProfile;
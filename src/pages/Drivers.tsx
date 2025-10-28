import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { DriverCardImage, TeamLogo } from "@/components/ImageComponents";
import { getCountryFlag } from "@/lib/images";

// --- Configuration ---
const API_BASE_URL = "http://127.0.0.1:8000";
const LATEST_YEAR = 2025; // Hardcoded to match the provided API data

// --- Type Definitions for API Data ---
// Correctly typed for the /standings/drivers/{year} endpoint
interface DriverStanding {
  position: number;
  points: number;
  wins: number;
  driverId: string;
  driverNumber: number;
  driverCode: string;
  givenName: string;
  familyName: string;
  driverNationality: string;
  constructorIds: string[];
  constructorNames: string[];
}

// --- Utility to map team names to theme colors ---
// Keys updated to match `constructorNames` from the API
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

// --- API Fetching Function ---
const fetchDriverStandings = async (year: number): Promise<DriverStanding[]> => {
  const response = await fetch(`${API_BASE_URL}/standings/drivers/${year}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch driver standings for ${year}`);
  }
  return response.json();
};

// --- Loading Skeleton Component ---
const DriverCardSkeleton = () => (
    <Card className="overflow-hidden border-2 border-border/50 rounded-2xl h-full flex flex-col shadow-lg">
        <CardContent className="p-6 flex-grow">
            <div className="flex justify-between items-start">
                <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-7 w-40" />
                </div>
                <Skeleton className="h-12 w-12" />
            </div>
            <Skeleton className="h-4 w-24 mt-2" />
        </CardContent>
        <CardFooter className="p-4 bg-card/50 border-t border-border/50 flex-col items-start space-y-3">
            <div className="grid grid-cols-3 gap-2 w-full text-center">
                {[...Array(3)].map((_, i) => (
                    <div key={i}>
                        <Skeleton className="h-6 w-10 mx-auto" />
                        <Skeleton className="h-3 w-12 mx-auto mt-1" />
                    </div>
                ))}
            </div>
            <Skeleton className="h-10 w-full mt-2" />
        </CardFooter>
    </Card>
);


const Drivers = () => {
  // Scroll to top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch the complete driver standings for the year
  const { data: drivers, isLoading, isError, error } = useQuery<DriverStanding[]>({
    queryKey: ["driverStandings", LATEST_YEAR],
    queryFn: () => fetchDriverStandings(LATEST_YEAR),
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 20 }).map((_, index) => (
            <DriverCardSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to Load Driver Data</AlertTitle>
          <AlertDescription>
            Could not fetch the latest driver standings from the server. Please ensure the backend is running and try again.
            <br />
            <span className="font-mono text-xs mt-2 block">Error: {(error as Error)?.message}</span>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {drivers?.slice(0, 20).map((driver, index) => {
          const teamName = driver.constructorNames[0] || 'N/A';
          const teamColor = teamColorMapping[teamName] || 'var(--foreground)';

          return (
            <motion.div
              key={driver.driverId}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Card className="overflow-hidden border-2 border-border/50 hover:border-primary transition-all duration-300 group rounded-2xl h-full flex flex-col shadow-lg hover:shadow-primary/20">
                {/* Driver Image */}
                <div className="relative h-48 overflow-hidden" style={{ backgroundColor: `hsl(${teamColor}, 20%, 15%)` }}>
                  <DriverCardImage 
                    driverId={driver.driverId}
                    driverName={`${driver.givenName} ${driver.familyName}`}
                    className="group-hover:scale-110 transition-transform duration-300"
                  />
                  <div 
                    className="absolute top-2 right-2 text-6xl font-black opacity-20"
                    style={{ color: `hsl(${teamColor})` }}
                  >
                    {driver.driverNumber}
                  </div>
                </div>
                
                <CardContent className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <span className="text-sm not-italic" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"' }}>
                          {getCountryFlag(driver.driverNationality)}
                        </span>
                        {driver.driverNationality}
                      </p>
                      <h3 className="text-xl font-bold leading-tight">{`${driver.givenName} ${driver.familyName}`}</h3>
                    </div>
                    <TeamLogo 
                      constructorId={driver.constructorIds[driver.constructorIds.length - 1]}
                      constructorName={teamName}
                      size="sm"
                      className="flex-shrink-0 ml-2"
                    />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: `hsl(${teamColor})` }}>
                    {teamName}
                  </p>
                </CardContent>
                <CardFooter className="p-4 bg-card/50 border-t border-border/50 flex-col items-start space-y-3">
                  <div className="grid grid-cols-3 gap-2 w-full text-center">
                    <div>
                      <p className="font-bold text-lg">{driver.points}</p>
                      <p className="text-xs text-muted-foreground">Points</p>
                    </div>
                    <div>
                      <p className="font-bold text-lg">{driver.position === 1 ? '🏆' : driver.position}</p>
                      <p className="text-xs text-muted-foreground">Position</p>
                    </div>
                    <div>
                      <p className="font-bold text-lg">{driver.wins}</p>
                      <p className="text-xs text-muted-foreground">Wins</p>
                    </div>
                  </div>
                  <Button asChild className="w-full mt-2">
                    <Link to={`/driver/${driver.driverId}`}>
                      View Profile <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
              The {LATEST_YEAR} Grid
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Meet the elite drivers competing for glory in this year's Formula 1 World Championship.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        {renderContent()}
      </section>
    </div>
  );
};

export default Drivers;
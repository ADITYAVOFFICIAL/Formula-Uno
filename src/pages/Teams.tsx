import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Trophy, Users, Flag, AlertTriangle, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { TeamLogo, DriverPhoto } from "@/components/ImageComponents";

// --- Configuration ---
const API_BASE_URL = "http://127.0.0.1:8000";
const LATEST_YEAR = 2025;

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
  driverId: string;
  driverNumber: number;
  givenName: string;
  familyName: string;
  constructorIds: string[];
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

// --- Loading Skeleton Component ---
const TeamCardSkeleton = () => (
    <Card className="overflow-hidden border-2 border-border/50 rounded-2xl h-full flex flex-col shadow-lg">
        <CardHeader className="p-0 border-b-4 border-muted">
            <div className="p-6 bg-card/50">
                <Skeleton className="h-7 w-3/5 mb-2" />
                <Skeleton className="h-4 w-2/5" />
            </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4 flex-grow">
            <Skeleton className="h-4 w-1/2" />
            <div className="mt-4 pt-4 border-t border-border/50">
                <Skeleton className="h-5 w-1/4 mb-3" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>
        </CardContent>
        <CardFooter className="p-6 bg-card/50 border-t border-border/50 flex-col items-start space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-10 w-full mt-2" />
        </CardFooter>
    </Card>
);

const Teams = () => {
  // Scroll to top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: teams, isLoading: isLoadingTeams, isError: isErrorTeams, error: errorTeams } = useQuery<ConstructorStanding[]>({
    queryKey: ["constructorStandings", LATEST_YEAR],
    queryFn: () => fetchConstructorStandings(LATEST_YEAR),
  });

  const { data: drivers, isLoading: isLoadingDrivers } = useQuery<DriverStanding[]>({
    queryKey: ["driverStandings", LATEST_YEAR],
    queryFn: () => fetchDriverStandings(LATEST_YEAR),
  });

  const isLoading = isLoadingTeams || isLoadingDrivers;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-40 pb-24">
        <div className="container mx-auto px-4">
           <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
             {Array.from({ length: 10 }).map((_, i) => <TeamCardSkeleton key={i} />)}
           </div>
        </div>
      </div>
    );
  }

  if (isErrorTeams) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert variant="destructive" className="max-w-xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Teams</AlertTitle>
          <AlertDescription>{(errorTeams as Error).message}</AlertDescription>
        </Alert>
      </div>
    );
  }

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
              Meet The Constructors
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover the teams battling for supremacy in the {LATEST_YEAR} Formula 1 World Championship.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {teams?.map((team, index) => {
            // Filter for CURRENT drivers only (last constructor in their constructorIds array)
            // Limit to 2 drivers per team (current lineup)
            const teamDrivers = drivers?.filter(d => {
              const currentTeamId = d.constructorIds[d.constructorIds.length - 1];
              return currentTeamId === team.constructorId;
            }).slice(0, 2) || [];
            const teamColor = teamColorMapping[team.constructorName] || 'var(--primary)';
            
            return (
              <motion.div
                key={team.constructorId}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden border-2 border-border/50 hover:border-primary transition-all duration-300 group rounded-2xl h-full flex flex-col shadow-lg hover:shadow-primary/20">
                  <CardHeader 
                    className="p-0 border-b-4"
                    style={{ borderColor: `hsl(${teamColor})` }}
                  >
                    <div className="p-6 bg-card/50 flex items-center gap-4">
                      <TeamLogo 
                        constructorId={team.constructorId} 
                        constructorName={team.constructorName}
                        size="lg"
                        className="shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-2xl font-bold truncate">{team.constructorName}</CardTitle>
                        <p className="text-sm text-muted-foreground">{team.constructorNationality}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4 flex-grow">
                    <div className="mt-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2"><UserRound className="w-4 h-4" /> Drivers</h4>
                      <div className="space-y-2">
                        {teamDrivers.map(driver => (
                          <Link to={`/driver/${driver.driverId}`} key={driver.driverId} className="block">
                            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                              <DriverPhoto 
                                driverId={driver.driverId}
                                driverName={`${driver.givenName} ${driver.familyName}`}
                                size="sm"
                                useHeadshot={true}
                                className="shrink-0"
                              />
                              <span className="font-medium flex-1">{`${driver.givenName} ${driver.familyName}`}</span>
                              <span className="text-xs font-bold shrink-0" style={{color: `hsl(${teamColor})`}}>#{driver.driverNumber}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 bg-card/50 border-t border-border/50 flex-col items-start space-y-4">
                    <div className="flex justify-between w-full text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Trophy className="w-4 h-4" />
                            Championship Position
                        </div>
                        <span className="font-bold">{team.position}</span>
                    </div>
                     <div className="flex justify-between w-full text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Flag className="w-4 h-4" />
                            Season Wins
                        </div>
                        <span className="font-bold">{team.wins}</span>
                    </div>
                    <Button asChild className="w-full mt-2">
                      <Link to={`/team/${team.constructorId}`}>
                        View Team Profile <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Teams;
import { useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { Trophy, AlertTriangle } from "lucide-react";
import { TeamLogo, DriverPhoto } from "@/components/ImageComponents";

// --- Configuration ---
const API_BASE_URL = "http://127.0.0.1:8000";
const LATEST_YEAR = 2025;

// --- Type Definitions for API Data ---
// Based on the /standings/drivers/{year} endpoint
interface DriverStanding {
  position: number;
  points: number;
  wins: number;
  driverId: string;
  givenName: string;
  familyName: string;
  constructorIds: string[];
  constructorNames: string[];
}

// Based on the /standings/constructors/{year} endpoint
interface ConstructorStanding {
  position: number;
  points: number;
  wins: number;
  constructorId: string;
  constructorName: string;
  constructorNationality: string;
}


// --- Utility to map team names to theme colors ---
// Updated to match constructorNames from the API response
const teamColorMapping: { [key: string]: string } = {
    "McLaren": "25 95% 58%",
    "Mercedes": "180 40% 60%",
    "Ferrari": "0 86% 52%",
    "Red Bull": "221 75% 58%", // API returns "Red Bull"
    "Williams": "215 80% 60%",
    "RB F1 Team": "221 70% 55%", // API returns "RB F1 Team"
    "Aston Martin": "152 60% 42%",
    "Sauber": "152 60% 42%", // API returns "Sauber"
    "Haas F1 Team": "0 0% 85%",
    "Alpine F1 Team": "214 85% 62%", // API returns "Alpine F1 Team"
};


// --- API Fetching Functions ---
const fetchDriverStandings = async (year: number): Promise<DriverStanding[]> => {
  const response = await fetch(`${API_BASE_URL}/standings/drivers/${year}`);
  if (!response.ok) throw new Error("Failed to fetch driver standings");
  return response.json();
};

const fetchConstructorStandings = async (year: number): Promise<ConstructorStanding[]> => {
  const response = await fetch(`${API_BASE_URL}/standings/constructors/${year}`);
  if (!response.ok) throw new Error("Failed to fetch constructor standings");
  return response.json();
};

// --- Loading Skeleton Component ---
const StandingsTableSkeleton = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-[80px] text-center"><Skeleton className="h-5 w-8 mx-auto" /></TableHead>
        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
        <TableHead className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {Array.from({ length: 10 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell className="text-center"><Skeleton className="h-6 w-6 mx-auto" /></TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="w-1 h-6 rounded-full" />
              <Skeleton className="h-5 w-40" />
            </div>
          </TableCell>
          <TableCell className="text-right"><Skeleton className="h-6 w-12 ml-auto" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);


const Standings = () => {
  // Scroll to top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch driver standings directly
  const { 
    data: driverStandings, 
    isLoading: isLoadingDrivers, 
    isError: isErrorDrivers, 
    error: errorDrivers 
  } = useQuery<DriverStanding[]>({
    queryKey: ["driverStandings", LATEST_YEAR],
    queryFn: () => fetchDriverStandings(LATEST_YEAR),
  });

  // Fetch constructor standings directly
  const { 
    data: constructorStandings, 
    isLoading: isLoadingConstructors, 
    isError: isErrorConstructors, 
    error: errorConstructors 
  } = useQuery<ConstructorStanding[]>({
    queryKey: ["constructorStandings", LATEST_YEAR],
    queryFn: () => fetchConstructorStandings(LATEST_YEAR),
  });

  const renderDriverStandings = () => {
    if (isLoadingDrivers) return <StandingsTableSkeleton />;
    if (isErrorDrivers) return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{(errorDrivers as Error).message}</AlertDescription></Alert>;
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] text-center">Pos</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead className="hidden md:table-cell">Team</TableHead>
            <TableHead className="text-right">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {driverStandings?.slice(0, 20).map((driver) => (
            <TableRow key={driver.driverId} className="hover:bg-accent/50 transition-colors">
              <TableCell className="text-center font-bold text-xl">{driver.position}</TableCell>
              <TableCell>
                <Link to={`/driver/${driver.driverId}`} className="flex items-center gap-3 group">
                  <DriverPhoto 
                    driverId={driver.driverId}
                    driverName={`${driver.givenName} ${driver.familyName}`}
                    useHeadshot={true}
                    size="sm"
                    className="shrink-0"
                  />
                  <div 
                    className="w-1 h-6 rounded-full shrink-0" 
                    style={{ backgroundColor: `hsl(${teamColorMapping[driver.constructorNames[0]]})` }}
                  ></div>
                  <span className="font-medium group-hover:text-primary transition-colors">{`${driver.givenName} ${driver.familyName}`}</span>
                </Link>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Link to={`/team/${driver.constructorIds[0]}`} className="flex items-center gap-2 hover:underline group">
                  <TeamLogo 
                    constructorId={driver.constructorIds[0]}
                    constructorName={driver.constructorNames[0]}
                    size="sm"
                    className="shrink-0"
                  />
                  <span className="group-hover:text-primary transition-colors">{driver.constructorNames[0]}</span>
                </Link>
              </TableCell>
              <TableCell className="text-right font-black text-lg text-primary">{driver.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderConstructorStandings = () => {
    if (isLoadingConstructors) return <StandingsTableSkeleton />;
    if (isErrorConstructors) return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{(errorConstructors as Error).message}</AlertDescription></Alert>;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] text-center">Pos</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-right">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {constructorStandings?.map((team) => (
            <TableRow key={team.constructorId} className="hover:bg-accent/50 transition-colors">
              <TableCell className="text-center font-bold text-xl">{team.position}</TableCell>
              <TableCell>
                <Link to={`/team/${team.constructorId}`} className="flex items-center gap-3 group">
                  <TeamLogo 
                    constructorId={team.constructorId}
                    constructorName={team.constructorName}
                    size="sm"
                    className="shrink-0"
                  />
                  <div 
                    className="w-1 h-6 rounded-full shrink-0" 
                    style={{ backgroundColor: `hsl(${teamColorMapping[team.constructorName]})` }}
                  ></div>
                  <span className="font-medium group-hover:text-primary transition-colors">{team.constructorName}</span>
                </Link>
              </TableCell>
              <TableCell className="text-right font-black text-lg text-primary">{team.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
              Championship Standings
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Follow the intense battle for the driver and constructor titles throughout the {LATEST_YEAR} season.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
          <Tabs defaultValue="drivers" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto h-12">
              <TabsTrigger value="drivers" className="text-lg h-10">Driver Standings</TabsTrigger>
              <TabsTrigger value="constructors" className="text-lg h-10">Constructor Standings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="drivers">
              <Card className="mt-6 border-2 border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-primary" />
                    Driver Championship
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderDriverStandings()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="constructors">
              <Card className="mt-6 border-2 border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-primary" />
                    Constructor Championship
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderConstructorStandings()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </section>
    </div>
  );
};

export default Standings;
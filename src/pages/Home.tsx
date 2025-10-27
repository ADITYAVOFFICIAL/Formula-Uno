import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, Flag, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { driversData } from "@/data/driversData";
import { teamsData } from "@/data/teamsData";
import { motion } from "framer-motion";

const Home = () => {
  const topDriver = driversData.reduce((prev, current) => (prev.points > current.points) ? prev : current);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6">
              The Pinnacle of Motorsport
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Explore the high-octane world of Formula 1. Get the latest on your favorite drivers, teams, and the intense battle for the championship.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg" className="text-lg">
                <Link to={`/driver/${topDriver.id}`}>
                  Top Driver <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="text-lg">
                <Link to="/teams">
                  Explore Teams
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <Card className="bg-card/80 backdrop-blur-md border-border/50 p-6">
            <Trophy className="h-10 w-10 text-primary mx-auto mb-4" />
            <p className="text-4xl font-bold">{teamsData.length}</p>
            <p className="text-muted-foreground">Constructors</p>
          </Card>
          <Card className="bg-card/80 backdrop-blur-md border-border/50 p-6">
            <Users className="h-10 w-10 text-primary mx-auto mb-4" />
            <p className="text-4xl font-bold">{driversData.length}</p>
            <p className="text-muted-foreground">Drivers</p>
          </Card>
          <Card className="bg-card/80 backdrop-blur-md border-border/50 p-6">
            <Flag className="h-10 w-10 text-primary mx-auto mb-4" />
            <p className="text-4xl font-bold">24</p>
            <p className="text-muted-foreground">Races</p>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Constructors & Drivers</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                A grid of titans. Each team and driver pairing is a unique force on the track, pushing the limits of engineering and skill.
            </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {teamsData.map((team) => {
            const teamDrivers = driversData.filter(d => d.teamId === team.id);
            
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="overflow-hidden border-2 border-border/50 hover:border-primary transition-all duration-300 group rounded-2xl h-full flex flex-col">
                  <CardContent className="p-0 flex-grow flex flex-col">
                    <Link to={`/team/${team.id}`} className="block">
                        <div className="p-6 relative" style={{ background: `linear-gradient(135deg, hsl(${team.color}, 50%, 20%) 0%, hsl(${team.color}, 50%, 10%) 100%)` }}>
                            <h3 className="text-2xl font-bold text-white relative z-10">{team.name}</h3>
                            <p className="text-white/70 text-sm relative z-10">{team.country}</p>
                        </div>
                    </Link>
                    <div className="p-4 space-y-3 flex-grow">
                      {teamDrivers.map((driver) => (
                        <Link 
                          to={`/driver/${driver.id}`} 
                          key={driver.id}
                          className="block"
                        >
                          <div className="flex items-center justify-between p-3 bg-card-foreground/5 rounded-lg hover:bg-card-foreground/10 transition-colors group/driver">
                            <div className="flex items-center gap-4">
                              <div className="font-bold text-lg w-8 text-center text-muted-foreground group-hover/driver:text-primary transition-colors" style={{color: `hsl(${team.color})`}}>
                                {driver.number}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">
                                  {driver.name}
                                </div>
                                <div className="text-sm text-muted-foreground">{driver.nationality}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold">
                                {driver.points}
                              </div>
                              <div className="text-xs text-muted-foreground font-semibold">PTS</div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Home;
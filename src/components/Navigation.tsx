import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Menu, Users, Trophy, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import f1Logo from "@/assets/f1-logo.png";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/teams", label: "Teams", icon: Users },
    { path: "/drivers", label: "Drivers", icon: UserRound },
    { path: "/standings", label: "Standings", icon: Trophy },
  ];

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const NavLink = ({ path, label, icon: Icon, isMobile = false }) => (
    <Link
      to={path}
      onClick={() => isMobile && setIsSheetOpen(false)}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        isActive(path)
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        isMobile && "text-base"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg"
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.img
            src={f1Logo}
            alt="F1 Logo"
            className="h-8 w-auto"
            whileHover={{ rotate: 15, scale: 1.1 }}
          />
          <span className="hidden sm:inline-block text-lg font-bold tracking-tight text-foreground">
            F1 Dashboard
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <NavLink key={item.path} {...item} />
          ))}
        </nav>

        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <div className="flex items-center justify-between pb-6 border-b">
                <Link
                  to="/"
                  onClick={() => setIsSheetOpen(false)}
                  className="flex items-center gap-3"
                >
                  <img src={f1Logo} alt="F1 Logo" className="h-7 w-auto" />
                  <span className="font-bold text-lg">F1 Dashboard</span>
                </Link>
              </div>
              <nav className="flex flex-col gap-3 pt-6">
                {navItems.map((item) => (
                  <NavLink key={item.path} {...item} isMobile />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
};

export default Navigation;
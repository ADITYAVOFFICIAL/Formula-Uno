import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
        className="flex flex-col items-center"
      >
        {/* GIF Display */}
        <img
          src="/cid.gif"
          alt="Animated racing car"
          className="w-full max-w-sm md:max-w-md mb-8 rounded-lg shadow-lg"
        />

        {/* Error Text */}
        <h1 className="text-6xl md:text-8xl font-black text-destructive tracking-tighter">
          404
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-muted-foreground max-w-md">
          Oops! You've taken a wrong turn. This page doesn't exist.
        </p>

        {/* Go Home Button */}
        <Button asChild size="lg" className="mt-10 text-lg">
          <Link to="/">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Return to the Pit Lane
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getTeamLogo, getDriverPhoto, getDriverHeadshot } from "@/lib/images";

interface TeamLogoProps {
  constructorId: string;
  constructorName: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "h-8 w-auto",
  md: "h-12 w-auto",
  lg: "h-16 w-auto",
  xl: "h-24 w-auto",
};

export const TeamLogo = ({ 
  constructorId, 
  constructorName, 
  className,
  size = "md" 
}: TeamLogoProps) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const logoUrl = getTeamLogo(constructorId);

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted rounded-lg",
        sizeMap[size],
        className
      )}>
        <span className="text-xs font-bold text-muted-foreground uppercase">
          {constructorName.substring(0, 3)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative", sizeMap[size], className)}>
      {loading && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
      )}
      <img
        src={logoUrl}
        alt={`${constructorName} logo`}
        className={cn(
          "object-contain transition-opacity duration-300",
          sizeMap[size],
          loading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </div>
  );
};

interface DriverPhotoProps {
  driverId: string;
  driverName: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  useHeadshot?: boolean; // Use circular headshot instead of full body photo
}

const photoSizeMap = {
  sm: "h-16 w-16",
  md: "h-24 w-24",
  lg: "h-32 w-32",
  xl: "h-48 w-48",
};

export const DriverPhoto = ({ 
  driverId, 
  driverName, 
  className,
  size = "md",
  useHeadshot = false
}: DriverPhotoProps) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const photoUrl = useHeadshot ? getDriverHeadshot(driverId) : getDriverPhoto(driverId);

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted rounded-full",
        photoSizeMap[size],
        className
      )}>
        <span className="text-xl font-bold text-muted-foreground">
          {driverName.split(' ').map(n => n[0]).join('')}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-full overflow-hidden", photoSizeMap[size], className)}>
      {loading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={photoUrl}
        alt={`${driverName} photo`}
        className={cn(
          "object-cover w-full h-full transition-opacity duration-300",
          loading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </div>
  );
};

interface DriverCardImageProps {
  driverId: string;
  driverName: string;
  className?: string;
  useHeadshot?: boolean; // Use circular headshot instead of full body photo
}

export const DriverCardImage = ({ 
  driverId, 
  driverName, 
  className,
  useHeadshot = false 
}: DriverCardImageProps) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const photoUrl = useHeadshot ? getDriverHeadshot(driverId) : getDriverPhoto(driverId);

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 h-48",
        className
      )}>
        <span className="text-4xl font-bold text-muted-foreground">
          {driverName.split(' ').map(n => n[0]).join('')}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative h-48 overflow-hidden bg-gradient-to-br from-muted/50 to-background", className)}>
      {loading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={photoUrl}
        alt={`${driverName}`}
        className={cn(
          "object-contain object-bottom w-full h-full transition-all duration-300",
          loading ? "opacity-0 scale-95" : "opacity-100 scale-100"
        )}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </div>
  );
};

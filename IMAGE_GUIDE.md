# F1 Dashboard - Adding Team Logos & Driver Images

## 📸 Complete Implementation Guide

This guide shows you how to add team logos and driver images to your F1 Dashboard.

---

## 🚀 Quick Start (3 Easy Steps)

### Step 1: Files Already Created ✅
- ✅ `/src/lib/images.ts` - Image utility functions
- ✅ `/src/components/ImageComponents.tsx` - React components with error handling

### Step 2: Import Components in Your Pages

```tsx
import { TeamLogo, DriverPhoto, DriverCardImage } from "@/components/ImageComponents";
```

### Step 3: Use the Components

#### Team Logo Example:
```tsx
<TeamLogo 
  constructorId="red_bull" 
  constructorName="Red Bull Racing"
  size="lg"  // sm, md, lg, xl
/>
```

#### Driver Photo Example:
```tsx
<DriverPhoto 
  driverId="max_verstappen" 
  driverName="Max Verstappen"
  size="md"  // sm, md, lg, xl
/>
```

#### Driver Card Image (for profile pages):
```tsx
<DriverCardImage 
  driverId="max_verstappen" 
  driverName="Max Verstappen"
/>
```

---

## 📝 Implementation Examples

### 1️⃣ Update Teams Page (`Teams.tsx`)

Add team logos to team cards:

```tsx
import { TeamLogo } from "@/components/ImageComponents";

// Inside the TeamCard component, add this in CardHeader:
<CardHeader className="p-0 border-b-4" style={{ borderColor: `hsl(${teamColor})` }}>
  <div className="p-6 bg-gradient-to-br from-card/50 to-card/30 flex items-center gap-4">
    <TeamLogo 
      constructorId={team.constructorId}
      constructorName={team.constructorName}
      size="lg"
      className="flex-shrink-0"
    />
    <div className="flex-1">
      <CardTitle className="text-2xl mb-1">{team.constructorName}</CardTitle>
      <p className="text-sm text-muted-foreground">{team.constructorNationality}</p>
    </div>
  </div>
</CardHeader>
```

### 2️⃣ Update Drivers Page (`Drivers.tsx`)

Add driver photos to driver cards:

```tsx
import { DriverCardImage } from "@/components/ImageComponents";

// Inside the DriverCard component:
<Card className="...">
  <DriverCardImage 
    driverId={driver.driverId}
    driverName={`${driver.givenName} ${driver.familyName}`}
    className="border-b-4"
    style={{ borderColor: `hsl(${teamColor})` }}
  />
  <CardHeader>
    <CardTitle>#{driver.driverNumber} {driver.givenName} {driver.familyName}</CardTitle>
  </CardHeader>
  {/* ... rest of card content */}
</Card>
```

### 3️⃣ Update Driver Profile Page (`DriverProfile.tsx`)

Add large driver image to hero section:

```tsx
import { DriverCardImage, TeamLogo } from "@/components/ImageComponents";

// In the hero section (around line 644):
<div className="relative h-96 bg-gradient-to-br from-card/90 to-card/70">
  <div className="absolute inset-0 overflow-hidden">
    <DriverCardImage 
      driverId={driver.driverId}
      driverName={`${driver.givenName} ${driver.familyName}`}
      className="h-full opacity-20"
    />
  </div>
  <div className="relative z-10 container mx-auto px-4 h-full flex items-end pb-12">
    <div className="flex items-center gap-6">
      <DriverPhoto 
        driverId={driver.driverId}
        driverName={`${driver.givenName} ${driver.familyName}`}
        size="xl"
        className="border-4 border-primary shadow-2xl"
      />
      <div>
        <h1 className="text-5xl font-black mb-2">
          {driver.givenName} {driver.familyName}
        </h1>
        <div className="flex items-center gap-4">
          <TeamLogo 
            constructorId={team.constructorId}
            constructorName={team.constructorName}
            size="md"
          />
          <span className="text-xl text-muted-foreground">#{driver.driverNumber}</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 4️⃣ Update Team Profile Page (`TeamProfile.tsx`)

```tsx
import { TeamLogo, DriverPhoto } from "@/components/ImageComponents";

// In team header:
<div className="flex items-center gap-6 mb-6">
  <TeamLogo 
    constructorId={team.constructorId}
    constructorName={team.constructorName}
    size="xl"
  />
  <div>
    <h1 className="text-5xl font-black">{team.constructorName}</h1>
  </div>
</div>

// In driver lineup section:
{teamDrivers?.map((driver) => (
  <div key={driver.driverId} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
    <DriverPhoto 
      driverId={driver.driverId}
      driverName={`${driver.givenName} ${driver.familyName}`}
      size="md"
    />
    <div>
      <p className="font-semibold">#{driver.driverNumber} {driver.givenName} {driver.familyName}</p>
    </div>
  </div>
))}
```

### 5️⃣ Update Predictions Page (`Predictions.tsx`)

```tsx
import { DriverPhoto } from "@/components/ImageComponents";

// In podium prediction cards:
<div className="flex items-center gap-4">
  <DriverPhoto 
    driverId={driver.driverId}
    driverName={`${driver.givenName} ${driver.familyName}`}
    size="lg"
  />
  <div>
    <h3 className="text-2xl font-bold">{driver.givenName} {driver.familyName}</h3>
    <p className="text-sm text-muted-foreground">#{driver.driverNumber}</p>
  </div>
</div>
```

---

## 🎨 Component Props Reference

### `<TeamLogo />` Props:
```tsx
{
  constructorId: string;     // e.g., "red_bull", "ferrari"
  constructorName: string;   // e.g., "Red Bull Racing"
  className?: string;        // Additional CSS classes
  size?: "sm" | "md" | "lg" | "xl";  // Size preset
}
```

**Sizes:**
- `sm`: 8rem height
- `md`: 12rem height (default)
- `lg`: 16rem height
- `xl`: 24rem height

### `<DriverPhoto />` Props:
```tsx
{
  driverId: string;          // e.g., "max_verstappen"
  driverName: string;        // e.g., "Max Verstappen"
  className?: string;        // Additional CSS classes
  size?: "sm" | "md" | "lg" | "xl";  // Size preset
}
```

**Sizes:**
- `sm`: 16px × 16px
- `md`: 24px × 24px (default)
- `lg`: 32px × 32px
- `xl`: 48px × 48px

### `<DriverCardImage />` Props:
```tsx
{
  driverId: string;          // e.g., "max_verstappen"
  driverName: string;        // e.g., "Max Verstappen"
  className?: string;        // Additional CSS classes
}
```

---

## 🔄 Image Sources

### Current Implementation:
- ✅ Uses **Formula 1 official CDN** (external URLs)
- ✅ Automatic **fallback** to placeholder on error
- ✅ **Skeleton loading** states
- ✅ **Error handling** with initials

### Supported Teams:
- ✅ McLaren
- ✅ Mercedes
- ✅ Ferrari
- ✅ Red Bull Racing
- ✅ Williams
- ✅ RB F1 Team (AlphaTauri)
- ✅ Aston Martin
- ✅ Sauber
- ✅ Haas F1 Team
- ✅ Alpine F1 Team

### Supported Drivers (2024-2025 Season):
- ✅ Max Verstappen, Lando Norris, Charles Leclerc
- ✅ Oscar Piastri, Carlos Sainz, George Russell
- ✅ Lewis Hamilton, Sergio Perez
- ✅ Fernando Alonso, Lance Stroll
- ✅ Yuki Tsunoda, Pierre Gasly
- ✅ Alexander Albon, Nico Hülkenberg
- ✅ And more... (see `/src/components/ImageComponents.tsx`)

---

## 📦 Optional: Download Images Locally

### For Better Performance (Optional):

1. **Create directories:**
```bash
mkdir public/teams
mkdir public/drivers
```

2. **Download images from F1 website:**
```bash
# Teams (save as PNG):
public/teams/red_bull.png
public/teams/ferrari.png
public/teams/mclaren.png
# ... etc

# Drivers (save as PNG):
public/drivers/max_verstappen.png
public/drivers/charles_leclerc.png
# ... etc
```

3. **Update `ImageComponents.tsx` to prefer local files:**
```tsx
// Change the getDriverPhotoUrl function:
const getDriverPhotoUrl = (id: string) => {
  // Try local file first
  const localPath = `/drivers/${id}.png`;
  
  // Fallback to CDN
  const photoMap: Record<string, string> = { ... };
  return photoMap[id.toLowerCase()] || localPath;
};
```

---

## 🎭 Styling Examples

### With Border & Shadow:
```tsx
<DriverPhoto 
  driverId={driver.driverId}
  driverName={driver.name}
  size="lg"
  className="border-4 border-primary shadow-2xl"
/>
```

### With Gradient Background:
```tsx
<div className="p-4 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
  <TeamLogo 
    constructorId={team.id}
    constructorName={team.name}
    size="xl"
  />
</div>
```

### Hover Effects:
```tsx
<DriverPhoto 
  driverId={driver.driverId}
  driverName={driver.name}
  size="md"
  className="transition-transform hover:scale-110 cursor-pointer"
/>
```

---

## ✨ Features

✅ **Automatic Loading States** - Skeleton animations while loading
✅ **Error Handling** - Graceful fallback to initials/text
✅ **Responsive Design** - Works on all screen sizes
✅ **TypeScript Support** - Full type safety
✅ **Performance Optimized** - Lazy loading images
✅ **Accessibility** - Proper alt text on all images

---

## 🐛 Troubleshooting

### Images Not Loading?
1. Check browser console for CORS errors
2. Verify driver/team IDs match exactly (case-sensitive)
3. Check internet connection (using external CDN)

### Fallback Images Showing?
- This means the image URL is invalid or blocked
- Driver/team might not be in the mapping
- Add custom URL to the photoMap/logoMap

### Slow Loading?
- Consider downloading images locally (see above)
- Enable image preloading in your main App.tsx:
```tsx
import { preloadDriverPhotos, preloadTeamLogos } from "@/lib/images";

useEffect(() => {
  preloadDriverPhotos();
  preloadTeamLogos();
}, []);
```

---

## 🎯 Quick Copy-Paste Code Blocks

See examples above for ready-to-use code snippets for:
- Teams page
- Drivers page
- Driver profile page
- Team profile page
- Predictions page

---

## 📞 Need Help?

Check the component files:
- `/src/components/ImageComponents.tsx` - React components
- `/src/lib/images.ts` - Utility functions

All components include TypeScript types and JSDoc comments!

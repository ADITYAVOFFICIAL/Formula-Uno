/**
 * Image utility for F1 Dashboard
 * Provides fallback image URLs for team logos and driver photos
 * 
 * USAGE:
 * 1. Download images and place in /public/teams/ and /public/drivers/
 * 2. Or use the external URLs provided as fallbacks
 */

// Team Logo URLs - Using external CDN as fallback
export const TEAM_LOGOS: Record<string, string> = {
  // Constructor IDs from API
  "mclaren": "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/mclaren.png",
  "mercedes": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Mercedes_AMG_Petronas_F1_Logo.svg/2560px-Mercedes_AMG_Petronas_F1_Logo.svg.png",
  "ferrari": "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/ferrari.png",
  "red_bull": "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/red%20bull.png",
  "williams": "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/williams.png",
  "rb": "https://www.racefans.net/wp-content/uploads/2024/01/vcarb.jpg",
  "aston_martin": "https://cdn.brandfetch.io/idG_CbGWC2/w/1912/h/700/theme/light/logo.png?c=1dxbfHSJFAPEGdCLU4o5B",
  "sauber": "https://f1store4.formula1.com/content/ws/all/c98ef232-bdec-463e-950b-8c8fefbd8c92.svg",
  "haas": "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/haas.png",
  "alpine": "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/alpine.png",
};

// Driver Photo URLs - Using external CDN as fallback
export const DRIVER_PHOTOS: Record<string, string> = {
  // Driver IDs from API (use lowercase for consistency)
  "max_verstappen": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/redbullracing/maxver01/2025redbullracingmaxver01right.webp",
  "norris": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/mclaren/lannor01/2025mclarenlannor01right.webp",
  "lando_norris": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/mclaren/lannor01/2025mclarenlannor01right.webp",
  "leclerc": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/ferrari/chalec01/2025ferrarichalec01right.webp",
  "charles_leclerc": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/ferrari/chalec01/2025ferrarichalec01right.webp",
  "piastri": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/mclaren/oscpia01/2025mclarenoscpia01right.webp",
  "oscar_piastri": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/mclaren/oscpia01/2025mclarenoscpia01right.webp",
  "sainz": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/williams/carsai01/2025williamscarsai01right.webp",
  "carlos_sainz": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/williams/carsai01/2025williamscarsai01right.webp",
  "russell": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/mercedes/georus01/2025mercedesgeorus01right.webp",
  "george_russell": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/mercedes/georus01/2025mercedesgeorus01right.webp",
  "hamilton": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/ferrari/lewham01/2025ferrarilewham01right.webp",
  "lewis_hamilton": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/ferrari/lewham01/2025ferrarilewham01right.webp",
  "alonso": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/astonmartin/feralo01/2025astonmartinferalo01right.webp",
  "fernando_alonso": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/astonmartin/feralo01/2025astonmartinferalo01right.webp",
  "stroll": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/astonmartin/lanstr01/2025astonmartinlanstr01right.webp",
  "lance_stroll": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/astonmartin/lanstr01/2025astonmartinlanstr01right.webp",
  "tsunoda": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/redbullracing/yuktsu01/2025redbullracingyuktsu01right.webp",
  "yuki_tsunoda": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/redbullracing/yuktsu01/2025redbullracingyuktsu01right.webp",
  "gasly": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/alpine/piegas01/2025alpinepiegas01right.webp",
  "pierre_gasly": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/alpine/piegas01/2025alpinepiegas01right.webp",
  "albon": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/williams/alealb01/2025williamsalealb01right.webp",
  "alexander_albon": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/williams/alealb01/2025williamsalealb01right.webp",
  "hulkenberg": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/kicksauber/nichul01/2025kicksaubernichul01right.webp",
  "nico_hulkenberg": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/kicksauber/nichul01/2025kicksaubernichul01right.webp",
  "ocon": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/haasf1team/estoco01/2025haasf1teamestoco01right.webp",
  "esteban_ocon": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/haasf1team/estoco01/2025haasf1teamestoco01right.webp",
  "lawson": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/racingbulls/lialaw01/2025racingbullslialaw01right.webp",
  "liam_lawson": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/racingbulls/lialaw01/2025racingbullslialaw01right.webp",
  "colapinto": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/alpine/fracol01/2025alpinefracol01right.webp",
  "franco_colapinto": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/alpine/fracol01/2025alpinefracol01right.webp",
  "hadjar": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/racingbulls/isahad01/2025racingbullsisahad01right.webp",
  "isack_hadjar": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/racingbulls/isahad01/2025racingbullsisahad01right.webp",
  "bearman": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/haasf1team/olibea01/2025haasf1teamolibea01right.webp",
  "oliver_bearman": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/haasf1team/olibea01/2025haasf1teamolibea01right.webp",
  "bortoleto": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/kicksauber/gabbor01/2025kicksaubergabbor01right.webp",
  "gabriel_bortoleto": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/kicksauber/gabbor01/2025kicksaubergabbor01right.webp",
  "antonelli": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/mercedes/andant01/2025mercedesandant01right.webp",
  "kimi_antonelli": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/mercedes/andant01/2025mercedesandant01right.webp",
};

// Driver Headshot URLs - Circular cropped headshots optimized for Teams page
// These are better suited for small circular displays (driver roster cards, etc.)
export const DRIVER_HEADSHOTS: Record<string, string> = {
  // McLaren
  "norris": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/norris",
  "lando_norris": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/norris",
  "piastri": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/piastri",
  "oscar_piastri": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/piastri",
  
  // Red Bull
  "max_verstappen": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/verstappen",
  
  // Mercedes
  "russell": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/russell",
  "george_russell": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/russell",
  "antonelli": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/antonelli",
  "kimi_antonelli": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/antonelli",
  "andrea_kimi_antonelli": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/antonelli",
  
  // Ferrari
  "leclerc": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/leclerc",
  "charles_leclerc": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/leclerc",
  "hamilton": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/hamilton",
  "lewis_hamilton": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/hamilton",
  
  // Williams
  "sainz": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/sainz",
  "carlos_sainz": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/sainz",
  "albon": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/albon",
  "alexander_albon": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/albon",
  
  // Aston Martin
  "alonso": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/alonso",
  "fernando_alonso": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/alonso",
  "stroll": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/stroll",
  "lance_stroll": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/stroll",
  
  // RB
  "tsunoda": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/tsunoda",
  "yuki_tsunoda": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/tsunoda",
  "lawson": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2024Drivers/lawson",
  "liam_lawson": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2024Drivers/lawson",
  "hadjar": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/hadjar",
  "isack_hadjar": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/hadjar",
  
  // Alpine
  "gasly": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/gasly",
  "pierre_gasly": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/gasly",
  "colapinto": "https://i.pinimg.com/736x/e8/de/48/e8de480879447bd3ce3df44889d15872.jpg",
  "franco_colapinto": "https://i.pinimg.com/736x/e8/de/48/e8de480879447bd3ce3df44889d15872.jpg",
  
  // Haas
  "ocon": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/ocon",
  "esteban_ocon": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/ocon",
  "bearman": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/bearman",
  "oliver_bearman": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/bearman",
  
  // Sauber
  "hulkenberg": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/hulkenberg",
  "nico_hulkenberg": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/hulkenberg",
  "bortoleto": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/bortoleto",
  "gabriel_bortoleto": "https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/bortoleto",
};

// Fallback images
const FALLBACK_DRIVER_IMAGE = "https://i.pinimg.com/736x/80/68/99/806899178ea17ec910abc4b9de512af3.jpg";
const FALLBACK_TEAM_LOGO = "https://ih1.redbubble.net/image.5573385567.0715/raf,360x360,075,t,fafafa:ca443f4786.jpg";

/**
 * Get team logo URL
 * Priority: 1) Local file (/teams/), 2) External CDN, 3) Fallback
 */
export const getTeamLogo = (constructorId: string): string => {
  const normalizedId = constructorId.toLowerCase();
  
  // Try local file first (if you've downloaded images)
  // const localPath = `/teams/${normalizedId}.png`;
  
  // Use external CDN as fallback
  return TEAM_LOGOS[normalizedId] || FALLBACK_TEAM_LOGO;
};

/**
 * Get driver photo URL
 * Priority: 1) Local file (/drivers/), 2) External CDN, 3) Fallback
 */
export const getDriverPhoto = (driverId: string): string => {
  const normalizedId = driverId.toLowerCase();
  
  // Try local file first (if you've downloaded images)
  // const localPath = `/drivers/${normalizedId}.png`;
  
  // Use external CDN as fallback
  return DRIVER_PHOTOS[normalizedId] || FALLBACK_DRIVER_IMAGE;
};

/**
 * Get driver headshot URL (optimized for circular displays like Teams page)
 * Priority: 1) Headshot CDN, 2) Regular photo, 3) Fallback
 */
export const getDriverHeadshot = (driverId: string): string => {
  const normalizedId = driverId.toLowerCase();
  
  // Try headshot first (better for circular displays)
  return DRIVER_HEADSHOTS[normalizedId] || getDriverPhoto(driverId);
};

/**
 * Preload images to improve performance
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Preload all team logos
 */
export const preloadTeamLogos = async (): Promise<void> => {
  const promises = Object.values(TEAM_LOGOS).map(preloadImage);
  await Promise.allSettled(promises);
};

/**
 * Preload all driver photos
 */
export const preloadDriverPhotos = async (): Promise<void> => {
  const promises = Object.values(DRIVER_PHOTOS).map(preloadImage);
  await Promise.allSettled(promises);
};

/**
 * Country to flag emoji mapping
 * Maps country names/nationalities to their corresponding flag emojis
 */
export const COUNTRY_FLAGS: Record<string, string> = {
  // European countries
  "British": "🇬🇧",
  "Dutch": "🇳🇱",
  "Monegasque": "🇲🇨",
  "Spanish": "🇪🇸",
  "German": "🇩🇪",
  "French": "🇫🇷",
  "Finnish": "🇫🇮",
  "Danish": "🇩🇰",
  "Italian": "🇮🇹",
  "Austrian": "🇦🇹",
  "Belgian": "🇧🇪",
  "Swiss": "🇨🇭",
  
  // Americas
  "Mexican": "🇲🇽",
  "Canadian": "🇨🇦",
  "American": "🇺🇸",
  "Brazilian": "🇧🇷",
  "Argentine": "🇦🇷",
  "Argentinian": "🇦🇷",
  "Colombian": "🇨🇴",
  
  // Asia-Pacific
  "Australian": "🇦🇺",
  "Japanese": "🇯🇵",
  "Thai": "🇹🇭",
  "Chinese": "🇨🇳",
  "Indian": "🇮🇳",
  "New Zealander": "🇳🇿",
  "Singaporean": "🇸🇬",
  
  // Other
  "South African": "🇿🇦",
  "Russian": "🇷🇺",
  
  // Common variations
  "UK": "🇬🇧",
  "USA": "🇺🇸",
  "Netherlands": "🇳🇱",
  "Spain": "🇪🇸",
  "Germany": "🇩🇪",
  "France": "🇫🇷",
  "Finland": "🇫🇮",
  "Denmark": "🇩🇰",
  "Italy": "🇮🇹",
  "Austria": "🇦🇹",
  "Belgium": "🇧🇪",
  "Switzerland": "🇨🇭",
  "Mexico": "🇲🇽",
  "Canada": "🇨🇦",
  "Brazil": "🇧🇷",
  "Australia": "🇦🇺",
  "Japan": "🇯🇵",
  "Thailand": "🇹🇭",
  "China": "🇨🇳",
  "Monaco": "🇲🇨",
};

/**
 * Get country flag emoji for a nationality
 */
export const getCountryFlag = (nationality: string): string => {
  return COUNTRY_FLAGS[nationality] || "🏁";
};

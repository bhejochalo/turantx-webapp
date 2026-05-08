// Shared Google Maps loader + city/address helpers
// Used by LandingPage (inline booking) and AddressSelection (fallback)

const GOOGLE_SCRIPT_ID = "google-maps-script";

export const CITY_KEYWORDS = [
  "mumbai",
  "pune",
  "delhi",
  "new delhi",
  "bangalore",
  "bengaluru",
  "kolkata",
];

export function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) return resolve(window.google);

    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

export const extractCity = (address = "") => {
  const a = address.toLowerCase();
  if (a.includes("bengaluru") || a.includes("bangalore")) return "Bangalore";
  if (a.includes("mumbai")) return "Mumbai";
  if (a.includes("pune")) return "Pune";
  if (a.includes("kolkata")) return "Kolkata";
  if (a.includes("new delhi") || a.includes("delhi")) return "Delhi";
  return null;
};

export const getCityFromComponents = (components = []) => {
  const get = (...types) => {
    for (const type of types) {
      const c = components.find((comp) => comp.types.includes(type));
      if (c) return c.long_name;
    }
    return null;
  };
  const raw = get("locality", "administrative_area_level_2") || "";
  const r = raw.toLowerCase();
  if (r.includes("bengaluru") || r.includes("bangalore")) return "Bangalore";
  if (r.includes("mumbai")) return "Mumbai";
  if (r.includes("pune")) return "Pune";
  if (r.includes("kolkata")) return "Kolkata";
  if (r.includes("delhi")) return "Delhi";
  return raw || null;
};

export const isAllowedCity = (description = "") => {
  const d = description.toLowerCase();
  return CITY_KEYWORDS.some((city) => d.includes(city));
};

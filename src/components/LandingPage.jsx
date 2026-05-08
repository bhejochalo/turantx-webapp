import { useState, useEffect, useRef, useCallback } from "react";
import "./LandingPage.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Loader from "./Loader";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { loadContent, DEFAULT_CONTENT } from "../services/contentService";
import { useNavigate } from "react-router-dom";
import {
  loadGoogleMaps,
  calculateDistance,
  extractCity,
  getCityFromComponents,
  isAllowedCity,
} from "../utils/googleMaps";
import { showToast } from "./Toast";

/* ─── SVG icon set (Lucide-style, 22 × 22, 1.8px stroke) ─── */
const IC = {
  route: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  match: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  plane: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.8.2-1.3.8-1.1 1.7l2.7 4.5c.3.5 1 .6 1.5.2L7.5 10l3.5 8.5c.2.5.8.8 1.3.6l4.5-2c.7-.2.8-.9 1-1.9z"/>
    </svg>
  ),
  rupee: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12M6 8h12m-7.5 5 7.5 8M6 13h3c6.667 0 6.667-10 0-10"/>
    </svg>
  ),
  doc: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14 2z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  search: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  handoff: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/>
      <path d="M16.5 9.4 7.55 4.24"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/>
      <circle cx="18.5" cy="15.5" r="2.5"/><path d="M20.27 17.27 22 19"/>
    </svg>
  ),
  check: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  zap: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  shield: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  tag: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  /* Replacements for emoji icons (compact 18×18 strokes) */
  travellerSm: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.8.2-1.3.8-1.1 1.7l2.7 4.5c.3.5 1 .6 1.5.2L7.5 10l3.5 8.5c.2.5.8.8 1.3.6l4.5-2c.7-.2.8-.9 1-1.9z"/>
    </svg>
  ),
  senderSm: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  play: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z"/>
    </svg>
  ),
  star: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="12 2 15.1 8.6 22 9.5 17 14.4 18.2 21.4 12 18 5.8 21.4 7 14.4 2 9.5 8.9 8.6"/>
    </svg>
  ),
  wave: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>
      <path d="M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>
    </svg>
  ),
};

const HOW_IT_WORKS = {
  traveller: [
    { n: "01", icon: IC.route,  title: "Post your route",  desc: "Enter your flight city, date and available space. Takes 2 minutes." },
    { n: "02", icon: IC.match,  title: "Get matched",      desc: "We find a sender with an urgent document on your exact route." },
    { n: "03", icon: IC.plane,  title: "Fly & carry",      desc: "Sender hands the document to you. You carry it on your flight — no extra effort." },
    { n: "04", icon: IC.rupee,  title: "Get paid",         desc: "₹200–800 lands in your UPI within minutes of delivery confirmation." },
  ],
  sender: [
    { n: "01", icon: IC.doc,     title: "Post your request",   desc: "Describe your document, pickup city, destination and deadline." },
    { n: "02", icon: IC.search,  title: "Traveller matched",   desc: "We match you with a PNR-verified traveller flying your route today." },
    { n: "03", icon: IC.handoff, title: "Hand off your doc",   desc: "Meet the traveller before departure. You arrange the handoff point." },
    { n: "04", icon: IC.check,   title: "Delivered",           desc: "Recipient collects at destination. You get WhatsApp confirmation." },
  ],
};

const FEATURES = [
  {
    icon: IC.zap,
    title: "Same-Day Delivery",
    desc: "Documents move at flight speed. No warehouses, no transit hubs — straight from you to them.",
    tag: "Hours, not days",
  },
  {
    icon: IC.shield,
    title: "Verified All Round",
    desc: "PNR-verified travellers. ID-verified senders. Every match is manually reviewed before confirmation.",
    tag: "Zero blind trust",
  },
  {
    icon: IC.tag,
    title: "Just ₹99 to Send",
    desc: "Flat ₹99 per document delivery. Travellers earn ₹200–800 per flight. Payment via WhatsApp link or UPI QR after match.",
    tag: "₹99 flat fee",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const savedPhone = localStorage.getItem("PHONE_NUMBER") || "";
  const heroRef = useRef(null);
  const howRef = useRef(null);
  const statsRef = useRef(null);
  const heroTextRef = useRef(null);
  const heroFormRef = useRef(null);
  const heroBgRef = useRef(null);
  const finalCtaRef = useRef(null);
  const [hideStickyFab, setHideStickyFab] = useState(false);
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const [activeRole, setActiveRole] = useState(
    typeof window !== "undefined" && window.innerWidth <= 900 ? 1 : 0
  );
  const [mobileShowLogin, setMobileShowLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [howTab, setHowTab] = useState("traveller");
  const [openFaq, setOpenFaq] = useState(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [statCounts, setStatCounts] = useState(DEFAULT_CONTENT.stats.map(() => 0));
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const prefersReducedMotion = typeof window !== "undefined"
    && window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    let cancelled = false;
    loadContent().then((c) => { if (!cancelled) setContent(c); });
    return () => { cancelled = true; };
  }, []);

  /* ============================================================
     Google Maps autocomplete — inline booking
     ============================================================ */
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const debounceTimer = useRef(null);
  const [apiError, setApiError] = useState(false);

  const savedAddrs = (() => {
    try {
      const s = sessionStorage.getItem("addressSelectionData");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  const [fromInput, setFromInput] = useState(savedAddrs?.from?.fullAddress || "");
  const [toInput, setToInput] = useState(savedAddrs?.to?.fullAddress || "");
  const [fromAddress, setFromAddress] = useState(savedAddrs?.from?.fullAddress || "");
  const [toAddress, setToAddress] = useState(savedAddrs?.to?.fullAddress || "");
  const [fromCoords, setFromCoords] = useState(
    savedAddrs?.from ? { lat: savedAddrs.from.latitude, lng: savedAddrs.from.longitude } : null
  );
  const [toCoords, setToCoords] = useState(
    savedAddrs?.to ? { lat: savedAddrs.to.latitude, lng: savedAddrs.to.longitude } : null
  );
  const [fromComponents, setFromComponents] = useState([]);
  const [toComponents, setToComponents] = useState([]);
  const [fromCity, setFromCity] = useState(savedAddrs?.from?.city || null);
  const [toCity, setToCity] = useState(savedAddrs?.to?.city || null);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromDrop, setShowFromDrop] = useState(false);
  const [showToDrop, setShowToDrop] = useState(false);
  const [distance, setDistance] = useState(savedAddrs?.distance || null);
  const [routeError, setRouteError] = useState("");

  /* ---------- Load Google Maps ---------- */
  useEffect(() => {
    if (!apiKey) return;
    loadGoogleMaps(apiKey)
      .then((google) => {
        autocompleteService.current = new google.maps.places.AutocompleteService();
        placesService.current = new google.maps.places.PlacesService(document.createElement("div"));
      })
      .catch(() => setApiError(true));
  }, [apiKey]);

  /* ---------- Theme — always light ---------- */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  /* ---------- openTrackMode from sessionStorage (mobile bottom nav) ---------- */
  useEffect(() => {
    if (sessionStorage.getItem("openTrackMode") === "true") {
      sessionStorage.removeItem("openTrackMode");
      setMobileShowLogin(true);
    }
    if (sessionStorage.getItem("openSendMode") === "true") {
      sessionStorage.removeItem("openSendMode");
      setActiveRole(1);
      setMobileShowLogin(true);
    }
    if (sessionStorage.getItem("openEarnMode") === "true") {
      sessionStorage.removeItem("openEarnMode");
      setActiveRole(0);
      setMobileShowLogin(true);
    }
  }, []);

  /* ---------- body scroll lock when mobile sheet open ---------- */
  useEffect(() => {
    const cls = "tx-sheet-open";
    if (mobileShowLogin) {
      document.body.classList.add(cls);
    } else {
      document.body.classList.remove(cls);
    }
    return () => document.body.classList.remove(cls);
  }, [mobileShowLogin]);

  /* ---------- listen for Send / Earn taps from mobile bottom nav ---------- */
  useEffect(() => {
    const pulseForm = () => {
      const el = heroFormRef.current;
      if (!el) return;
      el.classList.remove("hero-form-pulse");
      void el.offsetWidth;
      el.classList.add("hero-form-pulse");
      setTimeout(() => el.classList.remove("hero-form-pulse"), 900);
    };
    const onOpenSend = () => {
      setActiveRole(1);
      setMobileShowLogin(true);
      pulseForm();
    };
    const onOpenEarn = () => {
      setActiveRole(0);
      setMobileShowLogin(true);
      pulseForm();
    };
    window.addEventListener("tx:openSendSheet", onOpenSend);
    window.addEventListener("tx:openEarnSheet", onOpenEarn);
    return () => {
      window.removeEventListener("tx:openSendSheet", onOpenSend);
      window.removeEventListener("tx:openEarnSheet", onOpenEarn);
    };
  }, []);

  /* ---------- scroll-reveal ---------- */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("lp-visible"); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".lp-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ---------- Stats counter animation ---------- */
  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.4 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  /* ---------- Hide mobile sticky FAB when Final CTA is in view ---------- */
  useEffect(() => {
    if (!finalCtaRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHideStickyFab(entry.isIntersecting),
      { threshold: 0.25 }
    );
    observer.observe(finalCtaRef.current);
    return () => observer.disconnect();
  }, []);

  /* ---------- Header transparency: tag body while hero is on screen ---------- */
  useEffect(() => {
    if (!heroRef.current) return;
    const cls = "tx-on-hero";
    document.body.classList.add(cls);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) document.body.classList.add(cls);
        else document.body.classList.remove(cls);
      },
      { rootMargin: "-64px 0px 0px 0px", threshold: 0 }
    );
    observer.observe(heroRef.current);
    return () => {
      observer.disconnect();
      document.body.classList.remove(cls);
    };
  }, []);


  useEffect(() => {
    if (!statsVisible) return;
    const duration = 1800;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setStatCounts(content.stats.map((s) => Math.round(eased * s.num)));
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [statsVisible, content.stats]);

  /* ---------- autocomplete fetch ---------- */
  const fetchSuggestions = useCallback((input, setSuggestions, setShow) => {
    if (!input || input.length < 2) {
      setSuggestions([]);
      setShow(false);
      return;
    }
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      autocompleteService.current?.getPlacePredictions(
        { input, componentRestrictions: { country: "IN" } },
        (predictions, status) => {
          if (status === "OK" && predictions) {
            const filtered = predictions.filter((p) => isAllowedCity(p.description));
            setSuggestions(filtered);
            setShow(filtered.length > 0);
          } else {
            setSuggestions([]);
            setShow(false);
          }
        }
      );
    }, 250);
  }, []);

  const selectSuggestion = (prediction, type) => {
    placesService.current?.getDetails(
      { placeId: prediction.place_id, fields: ["formatted_address", "geometry", "address_components"] },
      (place, status) => {
        if (status !== "OK" || !place?.geometry) return;

        const address = place.formatted_address;
        const coords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        const components = place.address_components || [];
        const city = extractCity(prediction.description) || getCityFromComponents(components) || extractCity(address);

        if (type === "from") {
          setFromInput(address); setFromAddress(address);
          setFromCoords(coords); setFromComponents(components);
          setFromCity(city);
          setFromSuggestions([]); setShowFromDrop(false);
        } else {
          setToInput(address); setToAddress(address);
          setToCoords(coords); setToComponents(components);
          setToCity(city);
          setToSuggestions([]); setShowToDrop(false);
        }
      }
    );
  };

  /* ---------- persist + distance ---------- */
  useEffect(() => {
    const fromData = fromAddress ? {
      fullAddress: fromAddress, city: fromCity,
      latitude: fromCoords?.lat || null, longitude: fromCoords?.lng || null,
    } : null;
    const toData = toAddress ? {
      fullAddress: toAddress, city: toCity,
      latitude: toCoords?.lat || null, longitude: toCoords?.lng || null,
    } : null;
    if (!fromData && !toData) {
      sessionStorage.removeItem("addressSelectionData");
    } else {
      sessionStorage.setItem("addressSelectionData", JSON.stringify({ from: fromData, to: toData, distance }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAddress, toAddress]);

  useEffect(() => {
    if (!fromAddress || !toAddress || !fromCoords || !toCoords) return;
    if (fromCity && toCity && fromCity === toCity) {
      setRouteError("Pickup and destination cities must be different.");
      setDistance(null);
      return;
    }
    setRouteError("");
    setDistance(calculateDistance(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCity, toCity, fromAddress, toAddress]);

  const clearFrom = () => {
    setFromInput(""); setFromAddress(""); setFromCity(null);
    setFromCoords(null); setFromComponents([]);
    setFromSuggestions([]); setShowFromDrop(false);
    setDistance(null); setRouteError("");
  };
  const clearTo = () => {
    setToInput(""); setToAddress(""); setToCity(null);
    setToCoords(null); setToComponents([]);
    setToSuggestions([]); setShowToDrop(false);
    setDistance(null); setRouteError("");
  };

  /* ---------- helpers ---------- */
  const checkUserStatus = async (phone) => {
    try {
      const userSnap = await getDoc(doc(db, "users", phone));
      if (!userSnap.exists()) return { exists: false, role: null };
      const { role, latestRequestKey } = userSnap.data();
      if (!role || !latestRequestKey) return { exists: true, role: null };
      return { exists: true, role: role.toUpperCase() };
    } catch { return { exists: false, role: null }; }
  };

  const waitMinLoader = async (startTime, min = 2500) => {
    const elapsed = Date.now() - startTime;
    if (elapsed < min) await new Promise((res) => setTimeout(res, min - elapsed));
  };

  const canContinue = !!(fromAddress && toAddress && distance && !routeError);

  const handleContinue = () => {
    if (!canContinue) {
      if (!fromAddress) { showToast("Enter your pickup city", "warning"); return; }
      if (!toAddress) { showToast("Enter your destination city", "warning"); return; }
      if (routeError) { showToast(routeError, "warning"); return; }
      return;
    }
    const userType = activeRole === 0 ? "TRAVELER" : "SENDER";
    localStorage.setItem("USER_ROLE", userType);

    const from = {
      city: fromCity || getCityFromComponents(fromComponents) || extractCity(fromAddress) || fromAddress,
      fullAddress: fromAddress,
      latitude: fromCoords?.lat || null,
      longitude: fromCoords?.lng || null,
    };
    const to = {
      city: toCity || getCityFromComponents(toComponents) || extractCity(toAddress) || toAddress,
      fullAddress: toAddress,
      latitude: toCoords?.lat || null,
      longitude: toCoords?.lng || null,
    };
    const resolvedPhone = localStorage.getItem("PHONE_NUMBER") || "";

    if (userType === "SENDER") {
      navigate("/item-details", { state: { phoneNumber: resolvedPhone, userType, from, to, distance } });
    } else {
      navigate("/flight-details", { state: { phoneNumber: resolvedPhone, userType, from, to, distance } });
    }
  };

  const handleReturningUser = async () => {
    const startTime = Date.now();
    setLoading(true);
    const { exists, role: existingRole } = await checkUserStatus(savedPhone);
    if (exists && existingRole) {
      await waitMinLoader(startTime);
      setLoading(false);
      navigate("/dashboard", { state: { phoneNumber: savedPhone } });
    } else {
      setLoading(false);
    }
  };

  /* ---------- GSAP — hero entrance + mouse parallax + scroll ---------- */
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    // Capture refs at mount time so cleanup can safely reference them
    const heroEl    = heroRef.current;
    const ctx = gsap.context(() => {

      // ── 1. Hero entrance timeline ──
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Background orbs bloom in first (behind everything)
      tl.from(".hero-orb-1", { scale: 0.4, autoAlpha: 0, duration: 2.0, ease: "power2.out" }, 0)
        .from(".hero-orb-2", { scale: 0.3, autoAlpha: 0, duration: 2.2, ease: "power2.out" }, 0.08)
        .from(".hero-orb-3", { scale: 0.3, autoAlpha: 0, duration: 1.6, ease: "power2.out" }, 0.04);

      // Tagline slides in
      tl.from(".brand-tagline", { y: 20, autoAlpha: 0, duration: 0.55 }, 0.22);

      // Headline words stagger up with a clip effect
      tl.from(".hw", {
          y: 80,
          autoAlpha: 0,
          stagger: 0.09,
          duration: 0.80,
          ease: "power4.out",
        }, 0.34);

      // Value line + badges + demo link cascade
      tl.from(".hero-value-line", { y: 18, autoAlpha: 0, duration: 0.55 }, 0.52)
        .from(".trust-badge",     { y: 14, autoAlpha: 0, stagger: 0.055, duration: 0.40 }, 0.64)
        .from(".hero-demo-link",  { y: 14, autoAlpha: 0, duration: 0.40 }, 0.78);

      // Form card enters from right — slightly delayed, more dramatic
      tl.from(".hero-form-card", {
          x: 48,
          autoAlpha: 0,
          duration: 0.85,
          ease: "power4.out",
        }, 0.26);

      // ── 2. Mouse-tracking micro-parallax on orbs (desktop only) ──
      if (window.innerWidth > 900 && heroEl) {
        let rAF = null;
        const handleMouseMove = (e) => {
          if (rAF) return; // throttle to one rAF per frame
          rAF = requestAnimationFrame(() => {
            rAF = null;
            const { left, top, width, height } = heroEl.getBoundingClientRect();
            const x = (e.clientX - left - width  / 2) / width;
            const y = (e.clientY - top  - height / 2) / height;
            gsap.to(".hero-orb-1", { x: x * -38, y: y * -24, duration: 1.8, ease: "power2.out", overwrite: "auto" });
            gsap.to(".hero-orb-2", { x: x *  28, y: y *  18, duration: 2.0, ease: "power2.out", overwrite: "auto" });
            gsap.to(".hero-orb-3", { x: x * -18, y: y *  12, duration: 1.5, ease: "power2.out", overwrite: "auto" });
            gsap.to(".hero-text-block", { x: x * 6, y: y * 4, duration: 1.4, ease: "power2.out", overwrite: "auto" });
          });
        };
        heroEl.addEventListener("mousemove", handleMouseMove, { passive: true });
        heroEl._gsapMouseMove = handleMouseMove;
      }

      // ── 3. Scroll parallax — quickSetter for zero-jank perf ──
      if (window.innerWidth > 900 && heroTextRef.current && heroFormRef.current && heroBgRef.current) {
        const setTextY = gsap.quickSetter(heroTextRef.current, "y", "px");
        const setFormY = gsap.quickSetter(heroFormRef.current, "y", "px");
        const setBgY   = gsap.quickSetter(heroBgRef.current,   "y", "px");
        ScrollTrigger.create({
          trigger: heroEl,
          start: "top top",
          end: "+=100%",
          onUpdate: (self) => {
            const p = self.progress;
            setTextY(-120 * p);
            setFormY(-55 * p);
            setBgY(-28 * p);
          },
        });
      }

      // ── 4. Magnetic CTA button effect ──
      const loginBtn = document.querySelector(".login-btn.active");
      if (loginBtn) {
        const handleMagnet = (e) => {
          const { left, top, width, height } = loginBtn.getBoundingClientRect();
          const x = (e.clientX - left - width  / 2) * 0.18;
          const y = (e.clientY - top  - height / 2) * 0.18;
          gsap.to(loginBtn, { x, y, duration: 0.35, ease: "power2.out", overwrite: "auto" });
        };
        const handleMagnetLeave = () => {
          gsap.to(loginBtn, { x: 0, y: 0, duration: 0.55, ease: "elastic.out(1, 0.5)", overwrite: "auto" });
        };
        loginBtn.addEventListener("mousemove",  handleMagnet);
        loginBtn.addEventListener("mouseleave", handleMagnetLeave);
        loginBtn._gsapMagnet      = handleMagnet;
        loginBtn._gsapMagnetLeave = handleMagnetLeave;
      }

    }); // end gsap.context

    // Cleanup mouse listeners not captured by gsap.context
    return () => {
      ctx.revert();
      if (heroEl?._gsapMouseMove) {
        heroEl.removeEventListener("mousemove", heroEl._gsapMouseMove);
      }
      const btn = document.querySelector(".login-btn");
      if (btn?._gsapMagnet) {
        btn.removeEventListener("mousemove",  btn._gsapMagnet);
        btn.removeEventListener("mouseleave", btn._gsapMagnetLeave);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToHow = () => howRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToHero = () => heroRef.current?.scrollIntoView({ behavior: "smooth" });

  if (loading) return <Loader />;

  const showBanner = content.banner?.active && sessionStorage.getItem("tx_banner_dismissed") !== "1";
  const dismissBanner = () => {
    sessionStorage.setItem("tx_banner_dismissed", "1");
    setContent((p) => ({ ...p, banner: { ...p.banner, active: false } }));
  };

  return (
    <div className="landing-page">

      {showBanner && (
        <div className={`lp-banner lp-banner-${content.banner.style || "info"}`} role="status">
          {content.banner.link ? (
            <a href={content.banner.link} className="lp-banner-text">
              {content.banner.text}
              <span className="lp-banner-arrow" aria-hidden>→</span>
            </a>
          ) : (
            <span className="lp-banner-text">{content.banner.text}</span>
          )}
          <button className="lp-banner-close" onClick={dismissBanner} aria-label="Dismiss banner">×</button>
        </div>
      )}

      {/* ═══════════════ SECTION 1 — HERO ═══════════════ */}
      <section className="lp-hero" data-theme="dark" ref={heroRef}>

        {/* Background layers: glow, grain, orbs, dot-grid */}
        <div className="hero-bg" ref={heroBgRef}>
          <div className="hero-grain" />
          <div className="hero-orbs" aria-hidden="true">
            <div className="hero-orb hero-orb-1" />
            <div className="hero-orb hero-orb-2" />
            <div className="hero-orb hero-orb-3" />
          </div>
          <div className="hero-grid" aria-hidden="true" />
        </div>

        {mobileShowLogin && (
          <div className="mobile-sheet-overlay" onClick={() => setMobileShowLogin(false)} />
        )}

        {/* ── Centered content ── */}
        <div className="hero-center">

          {/* Heading block */}
          <div className="hero-text-block" ref={heroTextRef}>
            <p className="brand-tagline">{content.hero.tagline}</p>
            <h1>
              <span className="hw">{content.hero.headlinePart1}</span>
              <br />
              <span className="hero-gradient-text hw">{content.hero.headlinePart2}</span>
            </h1>
            <p className="hero-value-line">
              <span className="hero-value-desktop">
                {content.hero.subtextDesktop}
              </span>
              <span className="hero-value-mobile">
                {content.hero.subtextMobile}
              </span>
            </p>
            <div className="tx-proof-chip" aria-label="Trust score">
              <span className="tx-proof-chip-stars" aria-hidden>
                {IC.star}{IC.star}{IC.star}{IC.star}{IC.star}
              </span>
              <span><strong>4.8</strong></span>
              <span className="tx-proof-chip-divider" aria-hidden />
              <span className="tx-proof-chip-meta">1,200+ deliveries · 5 cities live</span>
            </div>
            <div className="trust-badges">
              <span className="trust-badge"><span className="trust-badge-check">✓</span>ID-Verified Senders</span>
              <span className="trust-badge"><span className="trust-badge-check">✓</span>PNR-Verified Travellers</span>
              <span className="trust-badge"><span className="trust-badge-check">✓</span>Manual Match Review</span>
              <span className="trust-badge trust-badge-price"><span className="trust-badge-check">₹</span>Flat ₹{content.pricing.senderFee} to Send</span>
            </div>
            <button type="button" className="hero-demo-link" onClick={() => navigate("/demo")} aria-label="Watch a demo of how TurantX works">
              <span className="tx-icon tx-icon-sm" aria-hidden>{IC.play}</span>
              Watch how it works
              <span className="hero-how-arrow" aria-hidden>↓</span>
            </button>
          </div>

          {/* Booking card + track CTA */}
          <div className={`hero-form-wrap${mobileShowLogin ? " mobile-open" : ""}`} ref={heroFormRef}>

            {savedPhone && (
              <button type="button" className="returning-banner" onClick={handleReturningUser} aria-label="Welcome back, track your order">
                <span className="returning-wave tx-icon tx-icon-md" aria-hidden>{IC.wave}</span>
                <span className="returning-text">Welcome back</span>
                <span className="returning-cta">Track your order →</span>
              </button>
            )}

            <div className="hero-form-card">

              <div className="booking-role-toggle">
                <button
                  type="button"
                  className={`booking-role-btn${activeRole === 0 ? " active" : ""}`}
                  onClick={() => setActiveRole(0)}
                  aria-pressed={activeRole === 0}
                >
                  <span className="tx-icon tx-icon-md" aria-hidden>{IC.travellerSm}</span>
                  I'm Travelling
                </button>
                <button
                  type="button"
                  className={`booking-role-btn${activeRole === 1 ? " active" : ""}`}
                  onClick={() => setActiveRole(1)}
                  aria-pressed={activeRole === 1}
                >
                  <span className="tx-icon tx-icon-md" aria-hidden>{IC.senderSm}</span>
                  I'm Sending
                </button>
              </div>

              {apiError && (
                <div className="booking-api-error">
                  ⚠️ Unable to load address search. Please check your connection and refresh.
                </div>
              )}

              <div className="booking-fields">
                <div className="booking-field">
                  <label className="booking-field-label">
                    <span className="booking-field-dot from" />
                    {activeRole === 0 ? "Flying from" : "Pickup city"}
                  </label>
                  <div className="booking-input-wrap">
                    <input
                      className={`booking-input${fromInput ? " has-value" : ""}`}
                      placeholder="Start typing a city or area…"
                      value={fromInput}
                      aria-label={activeRole === 0 ? "Flying from city" : "Pickup city"}
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={showFromDrop}
                      aria-controls="from-suggestions"
                      autoComplete="off"
                      onChange={(e) => {
                        setFromInput(e.target.value);
                        setFromAddress(""); setFromCity(null);
                        setDistance(null); setRouteError("");
                        fetchSuggestions(e.target.value, setFromSuggestions, setShowFromDrop);
                      }}
                      onFocus={() => fromSuggestions.length > 0 && setShowFromDrop(true)}
                      onBlur={() => setTimeout(() => setShowFromDrop(false), 150)}
                    />
                    {fromInput && (
                      <button
                        className="booking-input-clear"
                        onMouseDown={(e) => { e.preventDefault(); clearFrom(); }}
                        aria-label="Clear from city"
                      >×</button>
                    )}
                    {showFromDrop && fromSuggestions.length > 0 && (
                      <ul id="from-suggestions" className="booking-dropdown" role="listbox">
                        {fromSuggestions.map((p) => (
                          <li key={p.place_id} role="option" aria-selected={false} onMouseDown={() => selectSuggestion(p, "from")}>
                            <span className="drop-main">{p.structured_formatting?.main_text}</span>
                            <span className="drop-sub">{p.structured_formatting?.secondary_text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="booking-field-separator">
                  <div className="booking-sep-line" />
                  <span className="booking-sep-icon">✈</span>
                  <div className="booking-sep-line" />
                </div>

                <div className="booking-field">
                  <label className="booking-field-label">
                    <span className="booking-field-dot to" />
                    {activeRole === 0 ? "Flying to" : "Destination city"}
                  </label>
                  <div className="booking-input-wrap">
                    <input
                      className={`booking-input${toInput ? " has-value" : ""}`}
                      placeholder="Start typing a city or area…"
                      value={toInput}
                      aria-label={activeRole === 0 ? "Flying to city" : "Destination city"}
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={showToDrop}
                      aria-controls="to-suggestions"
                      autoComplete="off"
                      onChange={(e) => {
                        setToInput(e.target.value);
                        setToAddress(""); setToCity(null);
                        setDistance(null); setRouteError("");
                        fetchSuggestions(e.target.value, setToSuggestions, setShowToDrop);
                      }}
                      onFocus={() => toSuggestions.length > 0 && setShowToDrop(true)}
                      onBlur={() => setTimeout(() => setShowToDrop(false), 150)}
                    />
                    {toInput && (
                      <button
                        className="booking-input-clear"
                        onMouseDown={(e) => { e.preventDefault(); clearTo(); }}
                        aria-label="Clear to city"
                      >×</button>
                    )}
                    {showToDrop && toSuggestions.length > 0 && (
                      <ul id="to-suggestions" className="booking-dropdown" role="listbox">
                        {toSuggestions.map((p) => (
                          <li key={p.place_id} role="option" aria-selected={false} onMouseDown={() => selectSuggestion(p, "to")}>
                            <span className="drop-main">{p.structured_formatting?.main_text}</span>
                            <span className="drop-sub">{p.structured_formatting?.secondary_text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {routeError && (
                <div className="booking-route-error">⚠️ {routeError}</div>
              )}
              {distance && !routeError && (
                <div className="booking-distance-pill">
                  <span className="distance-icon">🛫</span>
                  <span className="distance-value">{distance} km</span>
                  <span className="distance-label">approx route</span>
                </div>
              )}

              <button
                className={`login-btn${canContinue ? " active" : ""}`}
                onClick={handleContinue}
                disabled={!canContinue}
                aria-disabled={!canContinue}
              >
                <span className="login-btn-desktop">
                  {activeRole === 0 ? "Post My Route & Get Matched  →" : "Find a Traveller Now  →"}
                </span>
                <span className="login-btn-mobile">
                  {activeRole === 0 ? "Post Route & Get Matched  →" : "Send a Document  →"}
                </span>
              </button>

              {!canContinue && (
                <p className="login-hint" aria-live="polite">
                  {!fromAddress && !toAddress
                    ? "Enter pickup and destination cities to continue"
                    : !fromAddress
                    ? "Enter your pickup city to continue"
                    : !toAddress
                    ? "Enter your destination city to continue"
                    : routeError || ""}
                </p>
              )}

              <p className="login-note">
                By continuing, you agree to TurantX's&nbsp;
                <a href="/info/terms" className="login-link">Terms</a>
                {" & "}
                <a href="/info/privacy" className="login-link">Privacy Policy</a>
              </p>

              <button
                type="button"
                className="mobile-demo-link"
                onClick={() => navigate("/demo")}
                aria-label="Watch a 30-second demo"
              >
                <span className="mobile-demo-play tx-icon tx-icon-sm" aria-hidden>{IC.play}</span>
                <span>New here? Watch 30-sec demo</span>
              </button>
            </div>

          </div>
        </div>

        {/* Scroll hint */}
        <div className="scroll-hint" onClick={scrollToHow} style={{ cursor: "pointer" }}>
          <span>Scroll to explore</span>
          <div className="scroll-arrow" />
        </div>

      </section>



{/* ═══════════════ SECTION 2 — HOW IT WORKS ═══════════════ */}
      <section className="lp-section lp-how lp-reveal" ref={howRef}>
        <div className="lp-container">
          <p className="lp-eyebrow">Simple 4-step flow</p>
          <h2 className="lp-heading">How TurantX Works</h2>
          <p className="lp-subheading">Whether you're flying or sending — the whole thing takes minutes to set up.</p>

          <div className="how-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={howTab === "traveller"}
              className={`how-tab${howTab === "traveller" ? " active" : ""}`}
              onClick={() => setHowTab("traveller")}
            >
              <span className="tx-icon tx-icon-md" aria-hidden>{IC.travellerSm}</span>
              I'm a Traveller
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={howTab === "sender"}
              className={`how-tab${howTab === "sender" ? " active" : ""}`}
              onClick={() => setHowTab("sender")}
            >
              <span className="tx-icon tx-icon-md" aria-hidden>{IC.senderSm}</span>
              I'm a Sender
            </button>
          </div>

          <div className="how-steps">
            {HOW_IT_WORKS[howTab].map((step, i) => (
              <div key={i} className="how-step-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="how-step-num">{step.n}</div>
                <div className="how-step-icon">{step.icon}</div>
                <h3 className="how-step-title">{step.title}</h3>
                <p className="how-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="how-demo-cta"
            onClick={() => navigate("/demo")}
          >
            <span className="how-demo-cta-icon tx-icon tx-icon-sm" aria-hidden>{IC.play}</span>
            <span className="how-demo-cta-text">See the full walkthrough</span>
            <span className="how-demo-cta-arrow" aria-hidden>→</span>
          </button>
        </div>
      </section>

      {/* ═══════════════ SECTION 3 — WHY TURANTX ═══════════════ */}
      <section className="lp-section lp-why lp-reveal">
        <div className="lp-container">
          <p className="lp-eyebrow">Built different</p>
          <h2 className="lp-heading">Why TurantX?</h2>
          <p className="lp-subheading">Traditional couriers take days. TurantX uses real people already flying your route.</p>

          <div className="feature-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className={`feature-card${i === 2 ? " feature-card--featured" : ""}`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-tag">{f.tag}</div>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 3b — TESTIMONIALS ═══════════════ */}
      <section className="lp-section lp-testimonials lp-reveal">
        <div className="lp-container">
          <p className="lp-eyebrow">Real stories</p>
          <h2 className="lp-heading">People who've used it</h2>
          <p className="lp-subheading">Senders and travellers share their first experience.</p>
          <div className="testimonial-grid">
            <div className="testimonial-track">
            {[...content.testimonials, ...content.testimonials].map((t, i) => (
              <div
                key={i}
                className={`testimonial-card${i % content.testimonials.length === 0 ? " testimonial-card--featured" : ""}`}
                style={{ animationDelay: `${i * 0.1}s` }}
                aria-hidden={i >= content.testimonials.length}
              >
                <div className="testimonial-stars">{"★".repeat(t.stars)}</div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-footer">
                  <div className="testimonial-author-row">
                    <div className="testimonial-avatar">{t.name.charAt(0)}</div>
                    <div className="testimonial-author">
                      <span className="testimonial-name">{t.name}</span>
                      <span className="testimonial-route">{t.city}</span>
                    </div>
                  </div>
                  <div className="testimonial-badges">
                    <span className={`testimonial-role role-${t.role.toLowerCase()}`}>{t.role}</span>
                    <span className="testimonial-time">{t.time}</span>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 4 — COVERAGE + STATS ═══════════════ */}
      <section className="lp-section lp-coverage lp-reveal" ref={statsRef}>
        <div className="lp-container">
          <p className="lp-eyebrow">Now live</p>
          <h2 className="lp-heading">Currently flying between</h2>

          <div className="city-arc-wrap">
            <svg viewBox="0 0 800 175" className="city-arc-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <defs>
                <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F97316" stopOpacity="0.3" />
                  <stop offset="45%" stopColor="#F97316" stopOpacity="1" />
                  <stop offset="100%" stopColor="#F97316" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* Background track */}
              <path d="M 40 130 Q 400 30 760 130"
                fill="none" stroke="rgba(249,115,22,0.10)" strokeWidth="2.5" strokeLinecap="round" />

              {/* Animated dashed arc */}
              <path d="M 40 130 Q 400 30 760 130"
                fill="none" stroke="url(#arcGrad)" strokeWidth="2"
                strokeLinecap="round" strokeDasharray="6 8"
                className="arc-dash" />

              {/* City dots + labels */}
              {[
                { cx: 40,  cy: 130, label: "Mumbai",    ly: 152 },
                { cx: 220, cy: 93,  label: "Delhi",     ly: 113 },
                { cx: 400, cy: 80,  label: "Bangalore", ly: 100 },
                { cx: 580, cy: 93,  label: "Pune",      ly: 113 },
                { cx: 760, cy: 130, label: "Kolkata",   ly: 152 },
              ].map(({ cx, cy, label, ly }) => (
                <g key={label}>
                  <circle cx={cx} cy={cy} r="9" fill="rgba(249,115,22,0.12)" />
                  <circle cx={cx} cy={cy} r="5" fill="#F97316" className="arc-city-dot" />
                  <text x={cx} y={ly} textAnchor="middle" className="arc-city-label">{label}</text>
                </g>
              ))}

              {/* Plane traveling along arc */}
              <g>
                <path d="M-7,0 L3,-3 L7,0 L3,3 Z M-9,-1.5 L-13,0 L-9,1.5 Z" fill="#F97316" opacity="0.85" />
                {!prefersReducedMotion && (
                  <animateMotion dur="5s" repeatCount="indefinite" rotate="auto"
                    path="M 40 130 Q 400 30 760 130" />
                )}
              </g>
            </svg>

            {/* Mobile-only live-routes ticker — replaces the SVG arc on mobile */}
            <div className="routes-ticker" aria-label={`Currently flying between ${content.cities.join(", ")}`}>
              <div className="routes-ticker-track">
                {[0, 1].map((loopIdx) => (
                  <div className="routes-ticker-group" key={loopIdx} aria-hidden={loopIdx === 1}>
                    {content.cities.map((city, i, arr) => (
                      <span className="routes-ticker-item" key={`${loopIdx}-${city}`}>
                        <span className="routes-ticker-city">
                          <span className="routes-ticker-dot" />
                          {city}
                        </span>
                        {i < arr.length - 1 && (
                          <span className="routes-ticker-sep" aria-hidden="true">
                            <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                              <path d="M1 5h13M14 5l-3-3M14 5l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        )}
                      </span>
                    ))}
                    {/* connector to next loop — plane */}
                    <span className="routes-ticker-item routes-ticker-item--plane" aria-hidden="true">
                      <span className="routes-ticker-plane">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                        </svg>
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <span className="routes-ticker-caption">— Live routes —</span>
            </div>
          </div>

          <div className="stats-row">
            {content.stats.map((s, i) => (
              <div key={i} className="stat-card">
                <span className="stat-value">
                  {s.prefix}{statCounts[i] ?? s.num}{s.suffix}
                </span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 5 — FAQ ═══════════════ */}
      <section className="lp-section lp-faq lp-reveal">
        <div className="lp-container">
          <p className="lp-eyebrow">Got questions?</p>
          <h2 className="lp-heading">Frequently Asked</h2>

          <div className="faq-list">
            {content.faqs.map((item, i) => (
              <div key={i} className={`faq-item${openFaq === i ? " open" : ""}`}>
                <button
                  className="faq-q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span>{item.q}</span>
                  <span className={`faq-chevron${openFaq === i ? " open" : ""}`} />
                </button>
                <div
                  id={`faq-answer-${i}`}
                  className={`faq-a${openFaq === i ? " open" : ""}`}
                  role="region"
                  aria-hidden={openFaq !== i}
                >
                  <div className="faq-a-inner">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════ SECTION 6 — FINAL CTA ═══════════════ */}
      <section className="lp-section lp-cta-section lp-reveal" ref={finalCtaRef}>
        <div className="lp-cta-bg">
          <div className="cta-orb cta-orb-1" />
          <div className="cta-orb cta-orb-2" />
          <div className="lp-cta-noise" />
        </div>
        <div className="lp-container lp-cta-inner">
          <div className="lp-cta-tag">Ready to ship?</div>
          <h2 className="lp-heading cta-heading">
            <span className="cta-heading-desktop">
              Your documents deserve<br />
              <span className="cta-heading-gradient">better than courier roulette.</span>
            </span>
            <span className="cta-heading-mobile">
              Skip the <span className="cta-heading-gradient">courier roulette.</span>
            </span>
          </h2>
          <p className="lp-subheading">Same-day. Verified. Human-powered. Just ₹99.</p>

          {/* Mobile-only price anchor + proof bar */}
          <div className="cta-price-card">
            <div className="cta-price-row">
              <span className="cta-price-value">₹{content.pricing.senderFee}</span>
              <span className="cta-price-label">
                <span className="cta-price-label-top">flat fee</span>
                <span className="cta-price-label-bot">any document · any route</span>
              </span>
            </div>
            <div className="cta-proof-row">
              <span className="cta-proof-item">
                <span className="cta-proof-num">1–3<span className="cta-proof-unit">hr</span></span>
                <span className="cta-proof-cap">city-to-city</span>
              </span>
              <span className="cta-proof-divider" />
              <span className="cta-proof-item">
                <span className="cta-proof-num">100<span className="cta-proof-unit">%</span></span>
                <span className="cta-proof-cap">hand-reviewed</span>
              </span>
              <span className="cta-proof-divider" />
              <span className="cta-proof-item">
                <span className="cta-proof-num">5<span className="cta-proof-unit">+</span></span>
                <span className="cta-proof-cap">cities live</span>
              </span>
            </div>
          </div>

          <div className="cta-buttons">
            <button className="cta-btn cta-primary" onClick={scrollToHero}>
              <span>Send a Document</span>
              <span className="cta-primary-arrow">→</span>
            </button>
            <button className="cta-btn cta-secondary" onClick={scrollToHow}>
              See how it works
            </button>
          </div>
          <div className="lp-cta-trust">
            <span>✓ No signup needed</span>
            <span className="lp-cta-trust-dot">·</span>
            <span>✓ Pay after match</span>
            <span className="lp-cta-trust-dot">·</span>
            <span>✓ WhatsApp confirmation</span>
          </div>

          {/* Mobile-only subtle traveller link */}
          <button className="cta-traveller-link" onClick={scrollToHero}>
            Flying somewhere? <span>Earn ₹{content.pricing.travellerEarnMin}–{content.pricing.travellerEarnMax} per trip →</span>
          </button>
        </div>
      </section>

      {/* Mobile sticky booking bar — hidden when Final CTA section is visible */}
      <button
        className={`mobile-sticky-cta${hideStickyFab ? " is-hidden" : ""}`}
        onClick={scrollToHero}
        aria-hidden={hideStickyFab}
      >
        <span className="mobile-sticky-label">
          <span className="mobile-sticky-dot" />
          {activeRole === 0 ? "Start as Traveller" : "Send a Document"}
        </span>
        <span className="mobile-sticky-arrow">→</span>
      </button>

    </div>
  );
}

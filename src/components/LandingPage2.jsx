import { useState, useEffect, useRef, useCallback } from "react";
import "./LandingPage2.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Loader from "./Loader";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  loadGoogleMaps,
  calculateDistance,
  extractCity,
  getCityFromComponents,
  isAllowedCity,
} from "../utils/googleMaps";
import { showToast } from "./Toast";

/* ─── SVG icon set ─── */
const IC = {
  route: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  match: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  plane: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.8.2-1.3.8-1.1 1.7l2.7 4.5c.3.5 1 .6 1.5.2L7.5 10l3.5 8.5c.2.5.8.8 1.3.6l4.5-2c.7-.2.8-.9 1-1.9z"/>
    </svg>
  ),
  rupee: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12M6 8h12m-7.5 5 7.5 8M6 13h3c6.667 0 6.667-10 0-10"/>
    </svg>
  ),
  doc: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14 2z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  handoff: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/>
      <path d="M16.5 9.4 7.55 4.24"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/>
      <circle cx="18.5" cy="15.5" r="2.5"/><path d="M20.27 17.27 22 19"/>
    </svg>
  ),
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  zap: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  shield: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  tag: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  arrowRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  ),
};

const HOW_IT_WORKS = {
  traveller: [
    { n: "01", icon: IC.route,  title: "Post your route",  desc: "Enter your flight city, date, and available space. Takes under 2 minutes." },
    { n: "02", icon: IC.match,  title: "Get matched",      desc: "We find a sender with an urgent document on your exact flight route." },
    { n: "03", icon: IC.plane,  title: "Fly & carry",      desc: "Sender hands the document to you. You carry it on your flight—zero extra effort." },
    { n: "04", icon: IC.rupee,  title: "Get paid",         desc: "₹200–800 lands in your UPI within minutes of delivery confirmation." },
  ],
  sender: [
    { n: "01", icon: IC.doc,     title: "Post your request",   desc: "Describe your document, pickup city, destination and deadline." },
    { n: "02", icon: IC.search,  title: "Traveller matched",   desc: "We match you with a PNR-verified traveller flying your route today." },
    { n: "03", icon: IC.handoff, title: "Hand off your doc",   desc: "Meet the traveller before departure. You arrange the handoff point." },
    { n: "04", icon: IC.check,   title: "Delivered",           desc: "Recipient collects at destination. You get WhatsApp confirmation instantly." },
  ],
};

const FEATURES = [
  {
    icon: IC.zap,
    title: "Same-Day Delivery",
    desc: "Documents move at flight speed. No warehouses, no transit hubs—straight from you to them.",
    tag: "Hours, not days",
    accent: "#FF6B2B",
  },
  {
    icon: IC.shield,
    title: "Verified All Round",
    desc: "PNR-verified travellers. ID-verified senders. Every match is manually reviewed before confirmation.",
    tag: "Zero blind trust",
    accent: "#6C52FF",
  },
  {
    icon: IC.tag,
    title: "Just ₹99 to Send",
    desc: "Flat ₹99 per document delivery. Travellers earn ₹200–800 per flight. Instant UPI payment after match.",
    tag: "₹99 flat fee",
    accent: "#10B981",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya K.",
    city: "Delhi → Mumbai",
    time: "4 hrs end-to-end",
    text: "Sent my visa documents at 8am, they were in Mumbai by noon. Got a WhatsApp confirmation the minute they arrived. Genuinely couldn't believe it.",
    role: "Sender",
    stars: 5,
    avatar: "PK",
  },
  {
    name: "Rajan S.",
    city: "Bangalore → Pune",
    time: "₹400 earned",
    text: "Was already flying that route. Got matched, carried a small envelope, earned ₹400. Literally 5 minutes of extra effort. Did it again the following week.",
    role: "Traveller",
    stars: 5,
    avatar: "RS",
  },
  {
    name: "Meera T.",
    city: "Mumbai → Kolkata",
    time: "Same day",
    text: "Legal papers that needed to reach by EOD. Courier said 2 days minimum. TurantX delivered same day. I've used it three times since.",
    role: "Sender",
    stars: 5,
    avatar: "MT",
  },
];

const CITIES = ["Mumbai", "Delhi", "Bangalore", "Pune", "Kolkata"];

const STATS = [
  { label: "Cities live",            prefix: "",  num: 5,   suffix: "",  desc: "Across India" },
  { label: "Matches hand-reviewed",  prefix: "",  num: 100, suffix: "%", desc: "Zero blind trust" },
  { label: "Sender fee",             prefix: "₹", num: 99,  suffix: "",  desc: "Flat, always" },
  { label: "Avg delivery time",      prefix: "",  num: 4,   suffix: "h", desc: "City to city" },
];

const FAQ_DATA = [
  { q: "How is my document kept safe?", a: "Every traveller is PNR-verified and ID-matched before the match is confirmed. You meet the traveller personally before departure — no blind handovers." },
  { q: "What documents can I send?", a: "Contracts, passports, legal papers, medical reports, cheques — anything small enough to carry in hand luggage. No cash, no regulated goods." },
  { q: "How long does delivery take?", a: "Same day, in most cases. Once a traveller is matched, the document moves at flight speed — typically 1–3 hours city to city." },
  { q: "How does payment work?", a: "After match confirmation, you pay ₹99 via WhatsApp payment link or UPI QR code. Travellers receive ₹200–800 directly to their UPI within minutes of delivery." },
  { q: "Which cities are live right now?", a: "Currently Mumbai, Delhi, Bangalore, Pune, and Kolkata. More cities coming soon — drop us a message if you'd like your city added." },
];

export default function LandingPage2() {
  const navigate = useNavigate();
  const savedPhone = localStorage.getItem("PHONE_NUMBER") || "";
  const heroRef = useRef(null);
  const howRef = useRef(null);
  const statsRef = useRef(null);
  const heroTextRef = useRef(null);
  const heroFormRef = useRef(null);
  const heroBgRef = useRef(null);
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const [activeRole, setActiveRole] = useState(0);
  const [mobileShowLogin, setMobileShowLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [howTab, setHowTab] = useState("traveller");
  const [openFaq, setOpenFaq] = useState(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [statCounts, setStatCounts] = useState(STATS.map(() => 0));

  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const debounceTimer = useRef(null);
  const [apiError, setApiError] = useState(false);

  const savedAddrs = (() => {
    try {
      const s = sessionStorage.getItem("addressSelectionData");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
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

  useEffect(() => {
    if (!apiKey) return;
    loadGoogleMaps(apiKey)
      .then((google) => {
        autocompleteService.current = new google.maps.places.AutocompleteService();
        placesService.current = new google.maps.places.PlacesService(document.createElement("div"));
      })
      .catch(() => setApiError(true));
  }, [apiKey]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("openTrackMode") === "true") {
      sessionStorage.removeItem("openTrackMode");
      setMobileShowLogin(true);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("lp2-visible"); }),
      { threshold: 0.06 }
    );
    document.querySelectorAll(".lp2-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!statsVisible) return;
    const duration = 2000;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setStatCounts(STATS.map((s) => Math.round(eased * s.num)));
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [statsVisible]);

  const fetchSuggestions = useCallback((input, setSuggestions, setShow) => {
    if (!input || input.length < 2) { setSuggestions([]); setShow(false); return; }
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      autocompleteService.current?.getPlacePredictions(
        { input, componentRestrictions: { country: "IN" } },
        (predictions, status) => {
          if (status === "OK" && predictions) {
            const filtered = predictions.filter((p) => isAllowedCity(p.description));
            setSuggestions(filtered); setShow(filtered.length > 0);
          } else { setSuggestions([]); setShow(false); }
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
        const coords = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
        const components = place.address_components || [];
        const city = extractCity(prediction.description) || getCityFromComponents(components) || extractCity(address);
        if (type === "from") {
          setFromInput(address); setFromAddress(address);
          setFromCoords(coords); setFromComponents(components); setFromCity(city);
          setFromSuggestions([]); setShowFromDrop(false);
        } else {
          setToInput(address); setToAddress(address);
          setToCoords(coords); setToComponents(components); setToCity(city);
          setToSuggestions([]); setShowToDrop(false);
        }
      }
    );
  };

  useEffect(() => {
    const fromData = fromAddress ? { fullAddress: fromAddress, city: fromCity, latitude: fromCoords?.lat || null, longitude: fromCoords?.lng || null } : null;
    const toData = toAddress ? { fullAddress: toAddress, city: toCity, latitude: toCoords?.lat || null, longitude: toCoords?.lng || null } : null;
    if (!fromData && !toData) { sessionStorage.removeItem("addressSelectionData"); }
    else { sessionStorage.setItem("addressSelectionData", JSON.stringify({ from: fromData, to: toData, distance })); }
  }, [fromAddress, toAddress]); // eslint-disable-line

  useEffect(() => {
    if (!fromAddress || !toAddress || !fromCoords || !toCoords) return;
    if (fromCity && toCity && fromCity === toCity) { setRouteError("Pickup and destination cities must be different."); setDistance(null); return; }
    setRouteError("");
    setDistance(calculateDistance(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng));
  }, [fromCity, toCity, fromAddress, toAddress]); // eslint-disable-line

  const clearFrom = () => { setFromInput(""); setFromAddress(""); setFromCity(null); setFromCoords(null); setFromComponents([]); setFromSuggestions([]); setShowFromDrop(false); setDistance(null); setRouteError(""); };
  const clearTo   = () => { setToInput(""); setToAddress(""); setToCity(null); setToCoords(null); setToComponents([]); setToSuggestions([]); setShowToDrop(false); setDistance(null); setRouteError(""); };

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
    const from = { city: fromCity || getCityFromComponents(fromComponents) || extractCity(fromAddress) || fromAddress, fullAddress: fromAddress, latitude: fromCoords?.lat || null, longitude: fromCoords?.lng || null };
    const to = { city: toCity || getCityFromComponents(toComponents) || extractCity(toAddress) || toAddress, fullAddress: toAddress, latitude: toCoords?.lat || null, longitude: toCoords?.lng || null };
    const resolvedPhone = localStorage.getItem("PHONE_NUMBER") || "";
    if (userType === "SENDER") { navigate("/item-details", { state: { phoneNumber: resolvedPhone, userType, from, to, distance } }); }
    else { navigate("/flight-details", { state: { phoneNumber: resolvedPhone, userType, from, to, distance } }); }
  };

  const handleReturningUser = async () => {
    const startTime = Date.now();
    setLoading(true);
    const { exists, role: existingRole } = await checkUserStatus(savedPhone);
    if (exists && existingRole) { await waitMinLoader(startTime); setLoading(false); navigate("/dashboard", { state: { phoneNumber: savedPhone } }); }
    else { setLoading(false); }
  };

  /* ════════════════ GSAP — Premium entrance animations ════════════════ */
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const heroEl = heroRef.current;
    const ctx = gsap.context(() => {

      /* 1. Hero entrance */
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.from(".lp2-hero-noise", { opacity: 0, duration: 1.2 }, 0)
        .from(".lp2-orb-a",  { scale: 0.2, autoAlpha: 0, duration: 2.4, ease: "power2.out" }, 0)
        .from(".lp2-orb-b",  { scale: 0.2, autoAlpha: 0, duration: 2.8, ease: "power2.out" }, 0.1)
        .from(".lp2-orb-c",  { scale: 0.2, autoAlpha: 0, duration: 2.0, ease: "power2.out" }, 0.05)
        .from(".lp2-nav",    { y: -20, autoAlpha: 0, duration: 0.7 }, 0.15)
        .from(".lp2-eyebrow-chip", { y: 16, autoAlpha: 0, duration: 0.6 }, 0.28)
        .from(".lp2-hero-word", { y: 100, autoAlpha: 0, stagger: 0.06, duration: 0.9, ease: "power4.out" }, 0.38)
        .from(".lp2-hero-sub",  { y: 18, autoAlpha: 0, duration: 0.6 }, 0.65)
        .from(".lp2-trust-item", { y: 12, autoAlpha: 0, stagger: 0.04, duration: 0.45 }, 0.74)
        .from(".lp2-hero-cta-row", { y: 14, autoAlpha: 0, duration: 0.5 }, 0.82)
        .from(".lp2-form-card", { x: 60, autoAlpha: 0, duration: 1.0, ease: "power4.out" }, 0.32);

      /* 2. Mouse micro-parallax */
      if (window.innerWidth > 900 && heroEl) {
        let rAF = null;
        const onMove = (e) => {
          if (rAF) return;
          rAF = requestAnimationFrame(() => {
            rAF = null;
            const { left, top, width, height } = heroEl.getBoundingClientRect();
            const x = (e.clientX - left - width  / 2) / width;
            const y = (e.clientY - top  - height / 2) / height;
            gsap.to(".lp2-orb-a", { x: x * -45, y: y * -28, duration: 2.0, ease: "power2.out", overwrite: "auto" });
            gsap.to(".lp2-orb-b", { x: x *  32, y: y *  20, duration: 2.2, ease: "power2.out", overwrite: "auto" });
            gsap.to(".lp2-orb-c", { x: x * -20, y: y *  14, duration: 1.6, ease: "power2.out", overwrite: "auto" });
            gsap.to(".lp2-hero-left",  { x: x * 8, y: y * 5, duration: 1.5, ease: "power2.out", overwrite: "auto" });
          });
        };
        heroEl.addEventListener("mousemove", onMove, { passive: true });
        heroEl._lp2Move = onMove;
      }

      /* 3. Scroll parallax */
      if (window.innerWidth > 900 && heroTextRef.current && heroFormRef.current) {
        const setTY = gsap.quickSetter(heroTextRef.current, "y", "px");
        const setFY = gsap.quickSetter(heroFormRef.current, "y", "px");
        ScrollTrigger.create({
          trigger: heroEl, start: "top top", end: "+=100%",
          onUpdate: (self) => { const p = self.progress; setTY(-130 * p); setFY(-60 * p); },
        });
      }

      /* 4. Section reveals — staggered card grids */
      gsap.utils.toArray(".lp2-step-card").forEach((el, i) => {
        gsap.from(el, {
          y: 50, autoAlpha: 0, duration: 0.7, ease: "power3.out", delay: i * 0.1,
          scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
        });
      });

      gsap.utils.toArray(".lp2-feature-card").forEach((el, i) => {
        gsap.from(el, {
          y: 60, autoAlpha: 0, duration: 0.8, ease: "power3.out", delay: i * 0.12,
          scrollTrigger: { trigger: el, start: "top 86%", toggleActions: "play none none none" },
        });
      });

      gsap.utils.toArray(".lp2-tcard").forEach((el, i) => {
        gsap.from(el, {
          y: 40, autoAlpha: 0, duration: 0.7, ease: "power3.out", delay: i * 0.1,
          scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
        });
      });

      gsap.utils.toArray(".lp2-stat-item").forEach((el, i) => {
        gsap.from(el, {
          y: 30, autoAlpha: 0, duration: 0.6, ease: "power3.out", delay: i * 0.08,
          scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
        });
      });

      /* 5. Flight path draw animation */
      const pathEl = document.querySelector(".lp2-flight-path-line");
      if (pathEl) {
        const len = pathEl.getTotalLength ? pathEl.getTotalLength() : 800;
        gsap.set(pathEl, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(pathEl, {
          strokeDashoffset: 0, duration: 2.5, ease: "power2.inOut",
          scrollTrigger: { trigger: ".lp2-cities-section", start: "top 70%", toggleActions: "play none none none" },
        });
      }

      /* 6. CTA section orbs */
      gsap.from(".lp2-cta-orb", {
        scale: 0.4, autoAlpha: 0, duration: 1.8, stagger: 0.2, ease: "power2.out",
        scrollTrigger: { trigger: ".lp2-cta-section", start: "top 80%", toggleActions: "play none none none" },
      });

      /* 7. Marquee city strip (GSAP infinite scroll) */
      const marquee = document.querySelector(".lp2-marquee-inner");
      if (marquee) {
        gsap.to(marquee, { x: "-50%", duration: 22, ease: "none", repeat: -1 });
      }

    });

    return () => {
      ctx.revert();
      if (heroEl?._lp2Move) heroEl.removeEventListener("mousemove", heroEl._lp2Move);
    };
  }, []); // eslint-disable-line

  const scrollToHow  = () => howRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToHero = () => heroRef.current?.scrollIntoView({ behavior: "smooth" });

  if (loading) return <Loader />;

  const marqueeItems = [...CITIES, ...CITIES, ...CITIES, ...CITIES];

  return (
    <div className="lp2">

      {/* ══════════════════════════════════════════
          NAV
      ══════════════════════════════════════════ */}
      <nav className="lp2-nav">
        <div className="lp2-nav-inner">
          <div className="lp2-logo">
            <span className="lp2-logo-mark">TX</span>
            <span className="lp2-logo-text">TurantX</span>
          </div>
          <div className="lp2-nav-links">
            <button className="lp2-nav-link" onClick={scrollToHow}>How it works</button>
            <button className="lp2-nav-link" onClick={() => document.querySelector(".lp2-why")?.scrollIntoView({ behavior: "smooth" })}>Why us</button>
          </div>
          <button className="lp2-nav-cta" onClick={scrollToHero}>Get started</button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="lp2-hero" ref={heroRef}>

        {/* Background */}
        <div className="lp2-hero-bg" ref={heroBgRef}>
          <div className="lp2-hero-noise" />
          <div className="lp2-orb-a" />
          <div className="lp2-orb-b" />
          <div className="lp2-orb-c" />
          <div className="lp2-hero-grid" />
          <svg className="lp2-hero-arc" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="rgba(255,107,43,0)" />
                <stop offset="30%"  stopColor="rgba(255,107,43,0.3)" />
                <stop offset="50%"  stopColor="rgba(255,107,43,0.6)" />
                <stop offset="70%"  stopColor="rgba(255,107,43,0.3)" />
                <stop offset="100%" stopColor="rgba(255,107,43,0)" />
              </linearGradient>
            </defs>
            <path d="M0,160 C360,100 720,80 1440,160" stroke="url(#arcGrad)" strokeWidth="1.5" fill="none" opacity="0.5" />
          </svg>
        </div>

        {mobileShowLogin && (
          <div className="lp2-sheet-overlay" onClick={() => setMobileShowLogin(false)} />
        )}

        {/* Hero content */}
        <div className="lp2-hero-inner">

          {/* Left column */}
          <div className="lp2-hero-left" ref={heroTextRef}>
            <div className="lp2-eyebrow-chip">
              <span className="lp2-chip-dot" />
              <span>PNR-verified · Human-powered · ₹99</span>
            </div>

            <h1 className="lp2-hero-h1">
              <span className="lp2-hero-word lp2-hero-word--plain">Your</span>{" "}
              <span className="lp2-hero-word lp2-hero-word--plain">docs</span>
              <br />
              <span className="lp2-hero-word lp2-hero-word--gradient">fly first</span>
              <br />
              <span className="lp2-hero-word lp2-hero-word--plain lp2-hero-word--small">class.</span>
            </h1>

            <p className="lp2-hero-sub">
              Match with verified travellers already on your flight route.
              Same-day delivery, just ₹99. Trusted by senders across India.
            </p>

            <div className="lp2-trust-row">
              {[
                { icon: "✓", label: "ID-Verified Senders" },
                { icon: "✓", label: "PNR-Verified Travellers" },
                { icon: "✓", label: "Manual Review" },
              ].map((b, i) => (
                <div key={i} className="lp2-trust-item">
                  <span className="lp2-trust-check">{b.icon}</span>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>

            <div className="lp2-hero-cta-row">
              <button className="lp2-hero-play" onClick={() => navigate("/demo")}>
                <span className="lp2-play-icon">▶</span>
                Watch how it works
              </button>
              <button className="lp2-hero-scroll" onClick={scrollToHow}>
                Explore below
                <span className="lp2-scroll-arrow">↓</span>
              </button>
            </div>
          </div>

          {/* Right column — Booking form */}
          <div className={`lp2-form-wrap${mobileShowLogin ? " lp2-form-wrap--open" : ""}`} ref={heroFormRef}>

            {savedPhone && (
              <button className="lp2-returning" onClick={handleReturningUser}>
                <span className="lp2-returning-wave">👋</span>
                <div className="lp2-returning-text">
                  <span>Welcome back</span>
                  <span className="lp2-returning-cta">Track your order →</span>
                </div>
              </button>
            )}

            <div className="lp2-form-card">
              <div className="lp2-form-header">
                <p className="lp2-form-title">Book a route</p>
                <p className="lp2-form-sub">Enter cities to get started</p>
              </div>

              {/* Role toggle — PRESERVED from LandingPage 1 */}
              <div className="booking-role-toggle">
                <button
                  className={`booking-role-btn${activeRole === 0 ? " active" : ""}`}
                  onClick={() => setActiveRole(0)}
                >
                  ✈️ I'm Travelling
                </button>
                <button
                  className={`booking-role-btn${activeRole === 1 ? " active" : ""}`}
                  onClick={() => setActiveRole(1)}
                >
                  📦 I'm Sending
                </button>
              </div>

              {apiError && (
                <div className="booking-api-error">
                  ⚠️ Unable to load address search. Please check your connection and refresh.
                </div>
              )}

              {/* Fields — PRESERVED from LandingPage 1 */}
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
                      aria-controls="from-suggestions-2"
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
                      <button className="booking-input-clear" onMouseDown={(e) => { e.preventDefault(); clearFrom(); }} aria-label="Clear from city">×</button>
                    )}
                    {showFromDrop && fromSuggestions.length > 0 && (
                      <ul id="from-suggestions-2" className="booking-dropdown" role="listbox">
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
                      aria-controls="to-suggestions-2"
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
                      <button className="booking-input-clear" onMouseDown={(e) => { e.preventDefault(); clearTo(); }} aria-label="Clear to city">×</button>
                    )}
                    {showToDrop && toSuggestions.length > 0 && (
                      <ul id="to-suggestions-2" className="booking-dropdown" role="listbox">
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

              {routeError && <div className="booking-route-error">⚠️ {routeError}</div>}
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
                {activeRole === 0 ? "Post My Route & Get Matched  →" : "Find a Traveller Now  →"}
              </button>

              {!canContinue && (
                <p className="login-hint" aria-live="polite">
                  {!fromAddress && !toAddress
                    ? "Enter pickup and destination cities to continue"
                    : !fromAddress ? "Enter your pickup city to continue"
                    : !toAddress  ? "Enter your destination city to continue"
                    : routeError || ""}
                </p>
              )}

              <p className="login-note">
                By continuing, you agree to TurantX's&nbsp;
                <a href="/info/terms" className="login-link">Terms</a>
                {" & "}
                <a href="/info/privacy" className="login-link">Privacy Policy</a>
              </p>
            </div>
          </div>

        </div>

        {/* Scroll indicator */}
        <div className="lp2-scroll-hint" onClick={scrollToHow}>
          <div className="lp2-scroll-mouse">
            <div className="lp2-scroll-wheel" />
          </div>
          <span>Scroll</span>
        </div>

      </section>

      {/* ══════════════════════════════════════════
          TRUST STRIP — marquee
      ══════════════════════════════════════════ */}
      <div className="lp2-marquee-section">
        <div className="lp2-marquee-track">
          <div className="lp2-marquee-inner">
            {marqueeItems.map((city, i) => (
              <span key={i} className="lp2-marquee-item">
                <span className="lp2-marquee-dot">✈</span>
                {city}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 2 — HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section className="lp2-section lp2-how lp2-reveal" ref={howRef}>
        <div className="lp2-container">
          <div className="lp2-section-label">Simple 4-step flow</div>
          <h2 className="lp2-section-h2">How TurantX Works</h2>
          <p className="lp2-section-sub">Whether you're flying or sending — the whole thing takes minutes.</p>

          <div className="lp2-how-tabs">
            <button className={`lp2-tab${howTab === "traveller" ? " lp2-tab--active" : ""}`} onClick={() => setHowTab("traveller")}>
              <span className="lp2-tab-icon">✈️</span> I'm a Traveller
            </button>
            <button className={`lp2-tab${howTab === "sender" ? " lp2-tab--active" : ""}`} onClick={() => setHowTab("sender")}>
              <span className="lp2-tab-icon">📦</span> I'm a Sender
            </button>
          </div>

          <div className="lp2-steps-grid">
            {HOW_IT_WORKS[howTab].map((step, i) => (
              <div key={`${howTab}-${i}`} className="lp2-step-card">
                <div className="lp2-step-number">{step.n}</div>
                <div className="lp2-step-icon-wrap">
                  {step.icon}
                </div>
                <h3 className="lp2-step-title">{step.title}</h3>
                <p className="lp2-step-desc">{step.desc}</p>
                {i < 3 && <div className="lp2-step-connector" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 3 — WHY TURANTX (Features)
      ══════════════════════════════════════════ */}
      <section className="lp2-section lp2-why lp2-reveal">
        <div className="lp2-container">
          <div className="lp2-section-label">Built different</div>
          <h2 className="lp2-section-h2">Why TurantX?</h2>
          <p className="lp2-section-sub">Traditional couriers take days and cost more. We use real people already in the air.</p>

          <div className="lp2-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="lp2-feature-card" style={{ "--accent": f.accent }}>
                <div className="lp2-feature-top">
                  <div className="lp2-feature-icon-wrap">
                    {f.icon}
                  </div>
                  <span className="lp2-feature-tag">{f.tag}</span>
                </div>
                <h3 className="lp2-feature-title">{f.title}</h3>
                <p className="lp2-feature-desc">{f.desc}</p>
                <div className="lp2-feature-border" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 4 — TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section className="lp2-section lp2-testimonials lp2-reveal">
        <div className="lp2-container">
          <div className="lp2-section-label">Real stories</div>
          <h2 className="lp2-section-h2">People who've used it</h2>
          <p className="lp2-section-sub">First experiences from senders and travellers across India.</p>

          <div className="lp2-tcards-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={`lp2-tcard${i === 1 ? " lp2-tcard--featured" : ""}`}>
                <div className="lp2-tcard-top">
                  <div className="lp2-tcard-stars">{"★".repeat(t.stars)}</div>
                  <span className={`lp2-tcard-role lp2-tcard-role--${t.role.toLowerCase()}`}>{t.role}</span>
                </div>
                <p className="lp2-tcard-text">"{t.text}"</p>
                <div className="lp2-tcard-footer">
                  <div className="lp2-tcard-avatar">{t.avatar}</div>
                  <div>
                    <div className="lp2-tcard-name">{t.name}</div>
                    <div className="lp2-tcard-meta">{t.city} · {t.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 5 — CITIES & STATS
      ══════════════════════════════════════════ */}
      <section className="lp2-section lp2-cities-section lp2-reveal" ref={statsRef}>
        <div className="lp2-container">
          <div className="lp2-section-label">Now live</div>
          <h2 className="lp2-section-h2">Flying between these cities</h2>

          {/* Animated flight route SVG */}
          <div className="lp2-flight-map">
            <svg className="lp2-flight-svg" viewBox="0 0 900 160" aria-hidden="true">
              <defs>
                <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#FF6B2B" stopOpacity="0.2" />
                  <stop offset="50%"  stopColor="#FF6B2B" stopOpacity="1" />
                  <stop offset="100%" stopColor="#6C52FF" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <path
                className="lp2-flight-path-line"
                d="M60,120 C200,40 400,20 500,80 C600,140 720,30 840,100"
                stroke="url(#pathGrad)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              {[
                { cx: 60,  cy: 120, label: "MUM" },
                { cx: 220, cy: 65,  label: "DEL" },
                { cx: 420, cy: 38,  label: "BLR" },
                { cx: 620, cy: 105, label: "PUN" },
                { cx: 840, cy: 100, label: "KOL" },
              ].map((node, i) => (
                <g key={i}>
                  <circle cx={node.cx} cy={node.cy} r="6" fill="#FF6B2B" opacity="0.9" />
                  <circle cx={node.cx} cy={node.cy} r="12" fill="#FF6B2B" opacity="0.15" />
                  <text x={node.cx} y={node.cy - 18} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">{node.label}</text>
                </g>
              ))}
            </svg>
            <div className="lp2-city-labels">
              {CITIES.map((city, i) => (
                <div key={city} className="lp2-city-pill">{city}</div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="lp2-stats-grid">
            {STATS.map((s, i) => (
              <div key={i} className="lp2-stat-item">
                <div className="lp2-stat-value">
                  {s.prefix}<span className="lp2-stat-num">{statCounts[i]}</span>{s.suffix}
                </div>
                <div className="lp2-stat-label">{s.label}</div>
                <div className="lp2-stat-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 6 — FAQ
      ══════════════════════════════════════════ */}
      <section className="lp2-section lp2-faq lp2-reveal">
        <div className="lp2-container lp2-faq-inner">
          <div className="lp2-faq-left">
            <div className="lp2-section-label">Got questions?</div>
            <h2 className="lp2-section-h2 lp2-faq-h2">Everything<br/>you need<br/>to know.</h2>
            <p className="lp2-faq-side-sub">Can't find your answer? Drop us a message and we'll get back within the hour.</p>
            <button className="lp2-faq-contact" onClick={() => window.open("https://wa.me/917428268825", "_blank")}>
              Chat on WhatsApp →
            </button>
          </div>

          <div className="lp2-faq-right">
            {FAQ_DATA.map((item, i) => (
              <div key={i} className={`lp2-faq-item${openFaq === i ? " lp2-faq-item--open" : ""}`}>
                <button
                  className="lp2-faq-q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{item.q}</span>
                  <span className={`lp2-faq-chevron${openFaq === i ? " lp2-faq-chevron--open" : ""}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </span>
                </button>
                <div className={`lp2-faq-a${openFaq === i ? " lp2-faq-a--open" : ""}`} role="region" aria-hidden={openFaq !== i}>
                  <div className="lp2-faq-a-inner">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 7 — FINAL CTA
      ══════════════════════════════════════════ */}
      <section className="lp2-section lp2-cta-section lp2-reveal">
        <div className="lp2-cta-bg">
          <div className="lp2-cta-orb lp2-cta-orb-a" />
          <div className="lp2-cta-orb lp2-cta-orb-b" />
          <div className="lp2-cta-noise" />
        </div>
        <div className="lp2-container lp2-cta-inner">
          <div className="lp2-cta-tag">Ready to ship?</div>
          <h2 className="lp2-cta-h2">
            Your documents deserve<br />
            <span className="lp2-cta-gradient">better than courier roulette.</span>
          </h2>
          <p className="lp2-cta-sub">Same-day. Verified. Human-powered. Just ₹99.</p>
          <div className="lp2-cta-btns">
            <button className="lp2-cta-primary" onClick={scrollToHero}>
              <span>Send a Document</span>
              <span className="lp2-cta-primary-arrow">→</span>
            </button>
            <button className="lp2-cta-secondary" onClick={scrollToHow}>
              See how it works
            </button>
          </div>
          <div className="lp2-cta-trust">
            <span>✓ No signup needed</span>
            <span className="lp2-cta-trust-dot">·</span>
            <span>✓ Pay after match</span>
            <span className="lp2-cta-trust-dot">·</span>
            <span>✓ WhatsApp confirmation</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="lp2-footer">
        <div className="lp2-container lp2-footer-inner">
          <div className="lp2-footer-brand">
            <div className="lp2-logo">
              <span className="lp2-logo-mark">TX</span>
              <span className="lp2-logo-text">TurantX</span>
            </div>
            <p className="lp2-footer-tagline">India's crowd-shipping network. Built on real travellers.</p>
          </div>
          <div className="lp2-footer-links">
            <a href="/info/terms" className="lp2-footer-link">Terms</a>
            <a href="/info/privacy" className="lp2-footer-link">Privacy</a>
            <a href="https://wa.me/917428268825" target="_blank" rel="noreferrer" className="lp2-footer-link">Contact</a>
          </div>
          <p className="lp2-footer-copy">© 2025 TurantX. All rights reserved.</p>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <button className="lp2-mobile-cta" onClick={() => { scrollToHero(); setMobileShowLogin(true); }}>
        <span className="lp2-mobile-cta-dot" />
        {activeRole === 0 ? "Start as Traveller" : "Send a Document"}
        <span className="lp2-mobile-cta-arrow">→</span>
      </button>

    </div>
  );
}

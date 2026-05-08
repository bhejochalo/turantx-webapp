import { ref, getDownloadURL, uploadString } from "firebase/storage";
import { storage } from "../firebase";

const STORAGE_PATH = "content/landing.json";
const CACHE_KEY = "tx_content_cache_v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > CACHE_TTL_MS) return null;
    return isValidShape(data) ? data : null;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() }));
  } catch { /* localStorage full or disabled — ignore */ }
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

export const DEFAULT_CONTENT = {
  hero: {
    tagline: "Fast · Trusted · Human-Powered",
    headlinePart1: "Your documents,",
    headlinePart2: "next flight out.",
    subtextDesktop:
      "We match senders with PNR-verified travellers flying your exact route — same day, just ₹99.",
    subtextMobile:
      "Same-day delivery by real travellers on your route. Flat ₹99.",
  },
  pricing: {
    senderFee: 99,
    travellerEarnMin: 200,
    travellerEarnMax: 800,
  },
  cities: ["Mumbai", "Delhi", "Bangalore", "Pune", "Kolkata"],
  stats: [
    { label: "Cities live", prefix: "", num: 5, suffix: "" },
    { label: "Matches hand-reviewed", prefix: "", num: 100, suffix: "%" },
    { label: "Sender fee", prefix: "₹", num: 99, suffix: "" },
  ],
  banner: {
    active: false,
    text: "🎉 New: launching in Hyderabad next week — DM us to get notified",
    link: "",
    style: "info",
  },
  testimonials: [
    {
      name: "Priya K.",
      city: "Delhi → Mumbai",
      time: "4 hrs end-to-end",
      text: "Sent my visa documents at 8am, they were in Mumbai by noon. Got a WhatsApp confirmation the minute they arrived. Genuinely couldn't believe it.",
      role: "Sender",
      stars: 5,
    },
    {
      name: "Rajan S.",
      city: "Bangalore → Pune",
      time: "₹400 earned",
      text: "Was already flying that route. Got matched, carried a small envelope, earned ₹400. Literally 5 minutes of extra effort. Did it again the following week.",
      role: "Traveller",
      stars: 5,
    },
    {
      name: "Meera T.",
      city: "Mumbai → Kolkata",
      time: "Same day",
      text: "Legal papers that needed to reach by EOD. Courier said 2 days minimum. TurantX delivered same day. I've used it three times since.",
      role: "Sender",
      stars: 5,
    },
  ],
  faqs: [
    {
      q: "How is my document kept safe?",
      a: "Every traveller is PNR-verified and ID-matched before the match is confirmed. You meet the traveller personally before departure — no blind handovers.",
    },
    {
      q: "What documents can I send?",
      a: "Contracts, passports, legal papers, medical reports, cheques — anything small enough to carry in hand luggage. No cash, no regulated goods.",
    },
    {
      q: "How long does delivery take?",
      a: "Same day, in most cases. Once a traveller is matched, the document moves at flight speed — typically 1–3 hours city to city.",
    },
    {
      q: "How does payment work?",
      a: "After match confirmation, you pay ₹99 via WhatsApp payment link or UPI QR code. Travellers receive ₹200–800 directly to their UPI within minutes of delivery.",
    },
    {
      q: "Which cities are live right now?",
      a: "Currently Mumbai, Delhi, Bangalore, Pune, and Kolkata. More cities coming soon — drop us a message if you'd like your city added.",
    },
  ],
  pages: {
    about: {
      tagline: "Delivering trust, one document at a time",
      lead: "TurantX connects people who need urgent documents delivered with verified travellers already flying the same route — same day, every day.",
      values: [
        { icon: "⚡", title: "Same-Day Delivery", desc: "Documents reach their destination the same day — not in 3–5 business days." },
        { icon: "🔐", title: "Verified Network", desc: "Every traveller is PNR-verified and ID-checked. Every sender is reviewed before matching." },
        { icon: "🤝", title: "Human-Powered", desc: "Real people, real routes. Each match is manually reviewed — no black-box algorithms." },
      ],
      storyHeading: "Built out of a real frustration",
      storyParagraphs: [
        "We started TurantX because we kept hitting the same wall — urgent documents stuck in transit for days while couriers quoted 48-hour windows. Meanwhile, thousands of people fly the exact same routes every day with space to spare.",
        "The idea was simple: connect the two. No warehouses, no sorting hubs, no overnight delays. Just a verified traveller carrying your document on their existing flight — and earning for it.",
        "We're in pilot phase right now, operating in select cities. Every match is reviewed by our team. We're moving carefully because trust, once broken, is hard to rebuild.",
      ],
      missionText: "Make urgent delivery affordable, fast, and human — without the overhead of traditional logistics.",
    },
    "how-it-works": {
      title: "How TurantX Works (Pilot Phase)",
      body: "1) Sender posts a document delivery request\nShare pickup and destination cities for urgent document delivery.\n\n2) Verified traveler matches the route and earns\nA traveler already flying the same route accepts the request and earns by carrying your documents.\n\n3) Direct handover with shared details\nDuring the pilot, the sender hands over the documents directly to the traveler. Pickup and delivery contact details are shared securely over WhatsApp.\n\n4) Receiver collects documents at destination\nThe receiver collects the documents from the traveler in the destination city.\n\n5) No match? No charges during the pilot\nIf no suitable traveler is found, the request is cancelled at no cost.",
    },
    "why-turantx": {
      title: "Why TurantX",
      body: "✔ Verified travelers\n✔ Manual flight checks\n✔ No courier delays\n✔ Cost-effective & fast",
    },
    help: {
      title: "Help & Support",
      body: "For any issue related to booking, payments, or account, reach out to us via Help & Support or WhatsApp.\n\nSupport hours:\n10 AM – 11 PM IST",
    },
    contact: {
      title: "Contact Us",
      body: "📧 Email: support@turantx.com\n📞 Phone: +91 98765-45520\n📍 India",
    },
    safety: {
      title: "Safety & Trust",
      body: "✔ PAN & ID verified travelers\n✔ Manual review of flights\n✔ Secure data handling\n✔ Fraud prevention systems",
    },
    terms: {
      title: "Terms & Conditions",
      body: "Last updated: 24-Jan-2026\n\nWelcome to TurantX Solutions Pvt Ltd (\"TurantX\", \"we\", \"our\", \"us\").\nBy accessing or using the TurantX website, app, or services, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services.\n\n1. About TurantX\nTurantX is a peer-to-peer logistics platform that connects senders with verified flight travelers to facilitate urgent document delivery.\nDuring the pilot phase, TurantX operates on a limited-feature basis and currently supports document delivery only.\n\n2. Pilot Phase Disclaimer\nTurantX is currently operating in a pilot phase.\nFeatures, processes, pricing, and availability may change without prior notice.\nCertain services such as doorstep pickup or doorstep delivery are not available during the pilot.\n\n3. Eligibility\nTo use TurantX:\nYou must be at least 18 years old.\nYou must provide accurate and complete information.\nTravelers must complete identity verification as required by TurantX.\n\n4. Nature of Items Allowed\nOnly documents are permitted during the pilot phase.\nProhibited items include (but are not limited to): cash, illegal substances, electronics, valuables, perishables, hazardous materials, or any item restricted by law or airline regulations.\nTurantX reserves the right to cancel requests involving prohibited items.\n\n5. Role of TurantX\nTurantX acts as a technology platform only.\nWe do not physically transport, handle, store, or inspect documents.\nTurantX does not guarantee delivery timelines and is not a courier or cargo company.\n\n6. Sender Responsibilities\nSenders agree to:\nProvide accurate pickup and destination details.\nEnsure the documents are legal, non-restricted, and properly packaged.\nHand over documents directly to the matched traveler during the pilot.\nCoordinate pickup and delivery using shared contact details (e.g., WhatsApp).\n\n7. Traveler Responsibilities\nTravelers agree to:\nCarry only documents approved through the TurantX platform.\nHandle documents responsibly and deliver them as agreed.\nComply with airline rules, airport security regulations, and applicable laws.\nReject any package that appears suspicious or unsafe.\n\n8. Payments & Charges\nDuring the pilot phase, no payment is required from senders.\nFuture pricing, fees, or rewards may be introduced with prior notice.\nTravelers may receive rewards or earnings as communicated separately.\n\n9. No Match Policy\nIf no suitable traveler is found within 24 hours, the request will be cancelled.\nAs no payment is collected during the pilot, no refund applies.\n\n10. Liability Limitation\nTurantX is not responsible for loss, delay, damage, or misuse of documents.\nUsers acknowledge that delivery is facilitated through independent travelers.\nTo the maximum extent permitted by law, TurantX's liability is limited to the extent of fees paid (if any).\n\n11. Safety & Verification\nTravelers undergo PAN and ID verification.\nFlights and routes may be manually reviewed.\nDespite these checks, users acknowledge that peer-to-peer delivery carries inherent risks.\n\n12. Account Suspension\nTurantX reserves the right to suspend or terminate accounts if:\nFalse information is provided.\nTerms are violated.\nSuspicious or unsafe activity is detected.\n\n13. Privacy\nUse of TurantX is also governed by our Privacy Policy.\nBy using the platform, you consent to the collection and use of information as described therein.\n\n14. Changes to Terms\nTurantX may update these Terms & Conditions from time to time.\nContinued use of the platform constitutes acceptance of the updated terms.\n\n15. Governing Law\nThese Terms shall be governed by and interpreted in accordance with the laws of India.\nAny disputes shall be subject to the jurisdiction of the courts of India.\n\n16. Contact Us\nFor any questions regarding these Terms, please contact:\n📧 support@turantx.com",
    },
    privacy: {
      title: "Privacy Policy",
      body: "We respect your privacy. User data is encrypted and never shared without your consent.",
    },
  },
};

function isValidShape(c) {
  return (
    c &&
    typeof c === "object" &&
    c.hero && typeof c.hero === "object" &&
    Array.isArray(c.testimonials) &&
    Array.isArray(c.faqs)
  );
}

function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }

function mergePagesDefaults(remote) {
  const def = DEFAULT_CONTENT.pages;
  if (!isObj(remote)) return def;
  const result = { ...def };

  // About — structured fields
  if (isObj(remote.about)) {
    const da = def.about;
    const ra = remote.about;
    result.about = {
      tagline: typeof ra.tagline === "string" ? ra.tagline : da.tagline,
      lead: typeof ra.lead === "string" ? ra.lead : da.lead,
      values: Array.isArray(ra.values) && ra.values.length === 3
        ? ra.values.map((v, i) => ({ ...da.values[i], ...(isObj(v) ? v : {}) }))
        : da.values,
      storyHeading: typeof ra.storyHeading === "string" ? ra.storyHeading : da.storyHeading,
      storyParagraphs: Array.isArray(ra.storyParagraphs) && ra.storyParagraphs.length === 3
        ? ra.storyParagraphs.map((p, i) => typeof p === "string" ? p : da.storyParagraphs[i])
        : da.storyParagraphs,
      missionText: typeof ra.missionText === "string" ? ra.missionText : da.missionText,
    };
  }

  // Prose pages — title + body
  for (const key of ["how-it-works", "why-turantx", "help", "contact", "safety", "terms", "privacy"]) {
    if (isObj(remote[key])) {
      result[key] = {
        title: typeof remote[key].title === "string" ? remote[key].title : def[key].title,
        body: typeof remote[key].body === "string" ? remote[key].body : def[key].body,
      };
    }
  }

  return result;
}

function mergeWithDefaults(remote) {
  if (!isValidShape(remote)) return DEFAULT_CONTENT;
  return {
    hero: { ...DEFAULT_CONTENT.hero, ...remote.hero },
    testimonials: remote.testimonials.length ? remote.testimonials : DEFAULT_CONTENT.testimonials,
    faqs: remote.faqs.length ? remote.faqs : DEFAULT_CONTENT.faqs,
    pricing: isObj(remote.pricing)
      ? { ...DEFAULT_CONTENT.pricing, ...remote.pricing }
      : DEFAULT_CONTENT.pricing,
    cities: Array.isArray(remote.cities) && remote.cities.length
      ? remote.cities.filter((c) => typeof c === "string" && c.trim()).map((c) => c.trim())
      : DEFAULT_CONTENT.cities,
    stats: Array.isArray(remote.stats) && remote.stats.length === 3
      ? remote.stats.map((s, i) => ({ ...DEFAULT_CONTENT.stats[i], ...(isObj(s) ? s : {}) }))
      : DEFAULT_CONTENT.stats,
    banner: isObj(remote.banner)
      ? { ...DEFAULT_CONTENT.banner, ...remote.banner }
      : DEFAULT_CONTENT.banner,
    pages: mergePagesDefaults(remote.pages),
  };
}

export async function loadContent({ skipCache = false, withMeta = false } = {}) {
  if (!skipCache) {
    const cached = readCache();
    if (cached) return withMeta ? { data: cached, source: "cache" } : cached;
  }
  const TIMEOUT_MS = 6000;
  const fetchWithTimeout = async () => {
    const url = await getDownloadURL(ref(storage, STORAGE_PATH));
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    console.log(
      "[contentService] fetched",
      Array.isArray(raw?.testimonials) ? raw.testimonials.length : "?",
      "testimonials,",
      Array.isArray(raw?.faqs) ? raw.faqs.length : "?",
      "faqs"
    );
    return mergeWithDefaults(raw);
  };
  try {
    const data = await Promise.race([
      fetchWithTimeout(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
    ]);
    writeCache(data);
    return withMeta ? { data, source: "storage" } : data;
  } catch (err) {
    console.error("[contentService.loadContent] failed:", err?.code || err?.message || err);
    const cached = readCache();
    if (cached) {
      console.warn("[contentService.loadContent] using stale localStorage cache as fallback");
      return withMeta ? { data: cached, source: "cache-stale", error: err } : cached;
    }
    console.warn("[contentService.loadContent] no cache available — using DEFAULT_CONTENT");
    return withMeta ? { data: DEFAULT_CONTENT, source: "default", error: err } : DEFAULT_CONTENT;
  }
}

export async function saveContent(content) {
  const TIMEOUT_MS = 12000;
  const safe = mergeWithDefaults(content);
  const json = JSON.stringify(safe, null, 2);
  const upload = uploadString(ref(storage, STORAGE_PATH), json, "raw", {
    contentType: "application/json",
    cacheControl: "public, max-age=300, must-revalidate",
  });
  await Promise.race([
    upload,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Upload timed out after 12s — Firebase Storage rules may not be set, or Storage isn't enabled in your Firebase project. Check Firebase Console → Storage.")),
        TIMEOUT_MS
      )
    ),
  ]);
  clearCache();
  writeCache(safe);
  return safe;
}

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collectionGroup, collection, getDocs, updateDoc, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import logo from "../../assets/turantx-logo.png";
import ContentManager from "./ContentManager";
import "./AdminDashboard.css";

const STATUS_OPTIONS = ["NEW_ORDER", "SEARCHING", "MATCHED", "IN_PROGRESS", "COMPLETED"];

// Auto-update status when these WhatsApp actions are sent
const ACTION_STATUS_MAP = {
  S_DROP: "IN_PROGRESS",
  S_PICKED: "COMPLETED",
  T_IN_TRANSIT: "IN_PROGRESS",
};

const SENDER_ACTIONS = [
  { key: "S_SEARCHING",     label: "1. Searching",           text: "Hi! Welcome to TurantX 🎉\n\nWe have received your delivery request and are currently searching for a suitable traveler match for you.\n\nWe'll notify you as soon as we find a match!\n\nTeam TurantX" },
  { key: "S_MATCH_FOUND",   label: "2. Match Found",          text: "Great news! 🎊\n\nWe have found a traveler match for your delivery request.\n\nTraveler Details:\n✈ Airline: [AIRLINE]\n📅 Travel Date: [DATE]\n🛫 Route: [FROM] → [TO]\n\nWe'll keep you updated!\n\nTeam TurantX" },
  { key: "S_DROP",          label: "3. Drop to Traveler",     text: "Hi!\n\nPlease drop your parcel to the traveler at the agreed location before the scheduled time.\n\nPlease ensure the item is properly packaged.\n\nTeam TurantX" },
  { key: "S_DROPPED",       label: "4. Dropped Confirmation", text: "Hi!\n\nWe have received confirmation that your parcel has been handed over to the traveler. 📦✅\n\nYour parcel is now in safe hands and will be in transit soon!\n\nTeam TurantX" },
  { key: "S_IN_TRANSIT",    label: "5. In Transit",           text: "Your parcel is now IN TRANSIT! ✈\n\nThe traveler is currently flying to [TO_CITY]. Your parcel is in safe hands.\n\nWe'll notify you when it's ready for pickup!\n\nTeam TurantX" },
  { key: "S_READY_PICK",    label: "6. Ready to Pick",        text: "Great news! 📦\n\nYour parcel has arrived at the destination and is ready for pickup.\n\nPlease coordinate with us for the pickup details.\n\nTeam TurantX" },
  { key: "S_PICKED",        label: "7. Picked / Completed",   text: "Congratulations! 🎉\n\nYour parcel has been successfully picked up and delivered!\n\nThank you for choosing TurantX.\n\nTeam TurantX" },
  { key: "S_REVIEW",        label: "8. Review",               text: "Hi!\n\nThank you for using TurantX! 🙏\n\nWe hope your experience was great. We'd love to hear your feedback to help us improve.\n\nTeam TurantX" },
];

const TRAVELER_ACTIONS = [
  { key: "T_SEARCHING",     label: "1. Searching",              text: "Hi! Welcome to TurantX ✈\n\nWe have registered your travel details and are currently searching for suitable senders matching your route.\n\nWe'll notify you as soon as we find a match!\n\nTeam TurantX" },
  { key: "T_MATCH_FOUND",   label: "2. Match Found",            text: "Great news! 🎊\n\nWe have found a sender match for your travel route.\n\nSender Details:\n📦 Item: [ITEM]\n📍 Route: [FROM] → [TO]\n⚖ Weight: [WEIGHT]\n\nWe'll keep you updated!\n\nTeam TurantX" },
  { key: "T_ITEM_DELIVERED",label: "3. Item Delivered to You",  text: "Hi!\n\nThe sender has handed over the parcel to you. 📦\n\nPlease ensure the item is properly packed and carry it safely during your journey. Thank you!\n\nTeam TurantX" },
  { key: "T_IN_TRANSIT",    label: "4. In Transit",             text: "Safe travels! ✈\n\nYou are now IN TRANSIT. Please keep the parcel safe with you.\n\nThe sender has been notified.\n\nTeam TurantX" },
  { key: "T_READY_COLLECT", label: "5. Ready for Collection",   text: "Hi!\n\nPlease drop the parcel at the agreed pickup location so the recipient can collect it.\n\nThank you for your help!\n\nTeam TurantX" },
  { key: "T_REVIEW",        label: "6. Review",                 text: "Hi!\n\nThank you for being a TurantX traveler! 🙏\n\nYour contribution helped someone's parcel reach its destination safely. We'd love your feedback!\n\nTeam TurantX" },
];

const COMMON_ACTIONS = [
  { key: "C_MATCH_NOT_FOUND", label: "Match Not Found",     text: "Hi!\n\nUnfortunately, we were unable to find a suitable match for your request at this time.\n\nWe will continue searching and notify you as soon as a match is found. Sorry for the inconvenience!\n\nTeam TurantX" },
  { key: "C_QUERY",           label: "Query / Support",     text: "Hi!\n\nThank you for reaching out to TurantX support.\n\nWe have received your query and our team will get back to you shortly.\n\nTeam TurantX" },
];

const TRAVELER_ONLY_ACTIONS = [
  { key: "T_PNR_INCORRECT", label: "PNR Details Incorrect", text: "Hi!\n\nWe noticed that the PNR details you provided appear to be incorrect or invalid.\n\nCould you please verify and update your PNR number at the earliest?\n\nTeam TurantX" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("sender");
  const [senderRequests, setSenderRequests] = useState([]);
  const [travelerRequests, setTravelerRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [travelerPreview, setTravelerPreview] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterRole, setFilterRole] = useState("ALL");
  const [sortDate, setSortDate] = useState("none");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [editFields, setEditFields] = useState({});
  const [userEditFields, setUserEditFields] = useState({});
  const [modalMatchingTravelers, setModalMatchingTravelers] = useState([]);
  const [pnrRevealed, setPnrRevealed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminAlerts, setAdminAlerts] = useState({ newSenders: 0, newTravelers: 0, lastOrderAt: null });
  const [copyFeedback, setCopyFeedback] = useState(null); // phone string that was just copied

  useEffect(() => {
    if (!sessionStorage.getItem("ADMIN_AUTH")) {
      navigate("/admin");
      return;
    }
    loadAllRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Real-time notification listener (1 doc = near-zero cost) ──
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "meta", "adminAlerts"), (snap) => {
      if (snap.exists()) {
        setAdminAlerts(snap.data());
      }
    }, (err) => console.error("Alert listener error:", err));
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllRequests = async () => {
    setLoading(true);
    try {
      const [senderSnap, travelerSnap, usersSnap] = await Promise.all([
        getDocs(collectionGroup(db, "SenderRequests")),
        getDocs(collectionGroup(db, "TravelerRequests")),
        getDocs(collection(db, "users")),
      ]);

      const parseSnap = (snap) =>
        snap.docs.map((d) => {
          const pathParts = d.ref.path.split("/");
          return { docRef: d.ref, requestId: d.id, phoneNumber: pathParts[1], ...d.data() };
        }).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

      setSenderRequests(parseSnap(senderSnap));
      setTravelerRequests(parseSnap(travelerSnap));
      setAllUsers(
        usersSnap.docs
          .map((d) => ({ docRef: d.ref, userId: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      );
    } catch (err) {
      console.error("Admin load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openUser = (user) => {
    setSelectedUser(user);
    setUserEditFields({
      role: user.role || "",
      requestType: user.requestType || "",
      authCompleted: user.authCompleted ?? false,
      adminNotes: user.adminNotes || "",
    });
    setSaveMsg("");
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setUserEditFields({});
    setSaveMsg("");
  };

  const saveUserChanges = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await updateDoc(selectedUser.docRef, {
        role: userEditFields.role,
        requestType: userEditFields.requestType,
        authCompleted: userEditFields.authCompleted,
        adminNotes: userEditFields.adminNotes,
        updatedAt: new Date().toISOString(),
      });
      setSaveMsg("Saved successfully!");
      setAllUsers((prev) =>
        prev.map((u) =>
          u.userId === selectedUser.userId ? { ...u, ...userEditFields } : u
        )
      );
      setSelectedUser((prev) => ({ ...prev, ...userEditFields }));
    } catch (err) {
      setSaveMsg("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const openRequest = (req) => {
    setSelectedRequest(req);
    setEditFields({
      status: req.status || (req.LastMileStatus === "Completed" ? "COMPLETED" : req.requestStatus === "MATCH_FOUND" ? "MATCHED" : req.requestStatus || "NEW_ORDER"),
      adminNotes: req.adminNotes || "",
      flightDetailsVerified: req.flightDetailsVerified || false,
      flightDuration:        req.opsFlightInfo?.flightDuration || "",
      flightType:            req.opsFlightInfo?.flightType || "",
      flightNumber:          req.opsFlightInfo?.flightNumber || "",
      flightStartTime:       req.opsFlightInfo?.flightStartTime || "",
      flightEndTime:         req.opsFlightInfo?.flightEndTime || "",
    });
    setSaveMsg("");
    setModalTab("details");
    setAltNumInput(req.alternateWhatsappNumber || "");
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setEditFields({});
    setSaveMsg("");
    setModalTab("details");
    setWaModal(null);
    setPnrRevealed(false);
  };

  const saveChanges = async () => {
    if (!selectedRequest) return;
    if (editFields.flightDetailsVerified && selectedRequest.flightDetails) {
      const { flightDuration, flightType, flightNumber, flightStartTime, flightEndTime } = editFields;
      if (!flightDuration || !flightType || !flightNumber || !flightStartTime || !flightEndTime) {
        setSaveMsg("⚠️ Fill all Ops Info fields before marking as Verified.");
        return;
      }
    }
    setSaving(true);
    setSaveMsg("");
    try {
      const baseUpdate = {
        status: editFields.status,
        adminNotes: editFields.adminNotes,
        updatedAt: new Date().toISOString(),
      };
      if (selectedRequest.flightDetails) {
        baseUpdate.flightDetailsVerified = editFields.flightDetailsVerified;
        baseUpdate.opsFlightInfo = {
          flightDuration:  editFields.flightDuration  || "",
          flightType:      editFields.flightType      || "",
          flightNumber:    editFields.flightNumber    || "",
          flightStartTime: editFields.flightStartTime || "",
          flightEndTime:   editFields.flightEndTime   || "",
        };
      }
      await updateDoc(selectedRequest.docRef, baseUpdate);
      setSaveMsg("Saved successfully!");
      // Update local state
      const opsSnapshot = {
        flightDuration:  editFields.flightDuration  || "",
        flightType:      editFields.flightType      || "",
        flightNumber:    editFields.flightNumber    || "",
        flightStartTime: editFields.flightStartTime || "",
        flightEndTime:   editFields.flightEndTime   || "",
      };
      const updater = (list) =>
        list.map((r) =>
          r.requestId === selectedRequest.requestId && r.phoneNumber === selectedRequest.phoneNumber
            ? { ...r, ...editFields, opsFlightInfo: opsSnapshot }
            : r
        );
      setSenderRequests((prev) => updater(prev));
      setTravelerRequests((prev) => updater(prev));
      setSelectedRequest((prev) => ({ ...prev, ...editFields, opsFlightInfo: opsSnapshot }));
    } catch (err) {
      setSaveMsg("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const [tick, setTick] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timerRef.current);
  }, []);

  const today = new Date().toISOString().split("T")[0];

  // Indexed lookups — avoids O(n) array scans on every render
  const travelerById = useMemo(
    () => new Map(travelerRequests.map((t) => [t.requestId, t])),
    [travelerRequests]
  );
  const senderById = useMemo(
    () => new Map(senderRequests.map((s) => [s.requestId, s])),
    [senderRequests]
  );

  // Shared helper — used in Match Traveler list + Today count badge
  const isFutureFlight = (fd) => {
    if (!fd?.travelDate) return true;
    const dep = fd.departureTime ? new Date(`${fd.travelDate}T${fd.departureTime}`) : new Date(fd.travelDate);
    return dep > new Date();
  };

  const todaySenders = useMemo(() => senderRequests
    .filter((s) => {
      if (s.itemDetails?.sendingDate === today) return true;
      if (s.confirmedTraveler) {
        const ct = travelerById.get(s.confirmedTraveler.requestKey);
        if (ct?.flightDetails?.travelDate === today) return true;
      }
      // Keep active matched deliveries visible every day until completed —
      // traveler may have flown yesterday, delivery follow-up needed today
      if (
        s.confirmedTraveler &&
        (s.status === "IN_PROGRESS" || s.status === "MATCHED") &&
        s.status !== "COMPLETED" &&
        s.LastMileStatus !== "Completed"
      ) return true;
      return false;
    })
    .map((s) => {
      const isDateToday = s.itemDetails?.sendingDate === today;
      let lateDays = null;
      let lateMatch = false;
      if (!isDateToday && s.confirmedTraveler) {
        lateMatch = true;
        lateDays = s.itemDetails?.sendingDate
          ? Math.round((new Date(today) - new Date(s.itemDetails.sendingDate)) / 86400000)
          : null;
      } else if (isDateToday && s.confirmedTraveler) {
        const ct = travelerById.get(s.confirmedTraveler.requestKey);
        if (ct?.flightDetails?.travelDate && ct.flightDetails.travelDate > today) {
          lateDays = Math.round((new Date(ct.flightDetails.travelDate) - new Date(today)) / 86400000);
        }
      }
      return { ...s, _lateMatch: lateMatch, _lateDays: lateDays };
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [senderRequests, travelerById, today]);

  const todayTravelers = useMemo(
    () => travelerRequests.filter((t) => t.flightDetails?.travelDate === today),
    [travelerRequests, today]
  );

  const getRemainingActions = (req) => {
    const isTraveler = !!req.flightDetails;
    const seqActions = isTraveler ? TRAVELER_ACTIONS : SENDER_ACTIONS;
    const sent = req.sentWhatsappActions || {};
    const sentCount = seqActions.filter((a) => sent[a.key]?.sent).length;
    return { sent: sentCount, total: seqActions.length, remaining: seqActions.length - sentCount };
  };

  const getSenderExpiry = (sendingDate) => {
    if (!sendingDate) return null;
    const diff = Math.round((new Date(sendingDate) - new Date(today)) / 86400000);
    if (diff < 0)  return { label: "Expired",   color: "#888" };
    if (diff === 0) return { label: "Today!",    color: "#e53935" };
    if (diff === 1) return { label: "Tomorrow",  color: "#f0a500" };
    return { label: `${diff}d left`, color: diff <= 3 ? "#f0a500" : "#2196f3" };
  };

  const getFlightDaysLeft = (travelDate, departureTime) => {
    if (!travelDate) return null;
    const diff = Math.round((new Date(travelDate) - new Date(today)) / 86400000);
    if (diff < 0) return { label: "Flight passed", color: "#888" };
    if (diff === 0) {
      let timeStr = "";
      if (departureTime) {
        const dep = new Date(`${travelDate}T${departureTime}`);
        const diffMs = dep - new Date();
        if (diffMs > 0) {
          const h = Math.floor(diffMs / 3600000);
          const m = Math.floor((diffMs % 3600000) / 60000);
          timeStr = h > 0 ? ` · in ${h}h ${m}m` : ` · in ${m}m`;
        } else {
          timeStr = " · departed";
        }
      }
      return { label: `Flying today${timeStr}`, color: "#e53935" };
    }
    if (diff === 1) return { label: "Flying tomorrow", color: "#f0a500" };
    return { label: `Flying in ${diff} days`, color: diff <= 3 ? "#f0a500" : "#2196f3" };
  };

  const getTimeLeft = (lastDropTime) => {
    if (!lastDropTime) return null;
    const [h, m] = lastDropTime.split(":").map(Number);
    const drop = new Date();
    drop.setHours(h, m, 0, 0);
    const diff = drop - new Date();
    if (diff <= 0) return { label: "Time passed", color: "#888" };
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const label = hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`;
    const color = hrs >= 3 ? "#0f9d58" : hrs >= 1 ? "#f0a500" : "#e53935";
    return { label, color };
  };

  // ── Distance Matrix cache ──────────────────────────────────────────
  const distanceCacheRef = useRef({}); // in-memory: survives re-renders, resets on page refresh
  const [distanceData, setDistanceData] = useState({}); // { travelerId: { fromDistM, toDistM } }

  const sanitizeKey = (k) => k.replace(/[^a-zA-Z0-9,_-]/g, "_");

  const getLocationKey = (loc) => {
    if (loc?.latitude && loc?.longitude)
      return `${parseFloat(loc.latitude).toFixed(4)},${parseFloat(loc.longitude).toFixed(4)}`;
    return `${loc?.area || ""}|${loc?.city || ""}`.toLowerCase().replace(/\s+/g, "");
  };

  const getLocationOrigin = (loc) => {
    if (loc?.latitude && loc?.longitude)
      return { lat: parseFloat(loc.latitude), lng: parseFloat(loc.longitude) };
    return `${loc?.area || ""}, ${loc?.city || ""}, ${loc?.state || ""}`;
  };

  const getApproxTime = (distM) => {
    const km = distM / 1000;
    const speed = km < 10 ? 25 : km < 50 ? 40 : 60;
    const mins = Math.round((km / speed) * 60);
    if (mins < 60) return `~${mins} min`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
  };

  const callDistanceMatrix = (origin, destination) =>
    new Promise((resolve, reject) => {
      if (!window.google?.maps?.DistanceMatrixService) return reject(new Error("Maps not loaded"));
      new window.google.maps.DistanceMatrixService().getDistanceMatrix(
        { origins: [origin], destinations: [destination], travelMode: window.google.maps.TravelMode.DRIVING },
        (res, status) => {
          const el = res?.rows?.[0]?.elements?.[0];
          if (status === "OK" && el?.status === "OK") resolve(el.distance.value);
          else reject(new Error(status));
        }
      );
    });

  // Triggered when sender modal opens — 0 reads if React ref hit, 1 read/write per pair on miss
  useEffect(() => {
    setManualSearchPhone("");
    setManualSearchResults(null);
    if (!selectedRequest || selectedRequest.flightDetails) {
      setDistanceData({});
      return;
    }
    if (selectedRequest.confirmedTraveler) {
      setModalMatchingTravelers([]);
      const ct = travelerById.get(selectedRequest.confirmedTraveler.requestKey);
      if (ct) loadDistancesForMatches(selectedRequest, [ct]);
      return;
    }
    const matches = getMatchingTravelers(selectedRequest);
    setModalMatchingTravelers(matches.filter((t) => isFutureFlight(t.flightDetails)));
    if (!matches.length) return;
    loadDistancesForMatches(selectedRequest, matches);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRequest?.requestId, selectedRequest?.confirmedTraveler]);

  const loadDistancesForMatches = async (sender, travelers) => {
    const pairs = travelers.map((t) => ({
      id: t.requestId,
      fromKey: sanitizeKey(`${getLocationKey(sender.from)}_${getLocationKey(t.from)}`),
      toKey:   sanitizeKey(`${getLocationKey(sender.to)}_${getLocationKey(t.to)}`),
      fromOrigin: getLocationOrigin(sender.from),
      fromDest:   getLocationOrigin(t.from),
      toOrigin:   getLocationOrigin(sender.to),
      toDest:     getLocationOrigin(t.to),
    }));

    // Collect unique keys not yet in React ref
    const uniqueMissed = [...new Set(
      pairs.flatMap((p) => [
        distanceCacheRef.current[p.fromKey] === undefined ? p.fromKey : null,
        distanceCacheRef.current[p.toKey]   === undefined ? p.toKey   : null,
      ].filter(Boolean))
    )];

    // Firestore batch read — 1 read per unique miss
    if (uniqueMissed.length > 0) {
      const snaps = await Promise.all(uniqueMissed.map((k) => getDoc(doc(db, "distanceCache", k))));
      snaps.forEach((snap, i) => {
        if (snap.exists()) distanceCacheRef.current[uniqueMissed[i]] = snap.data().distanceM;
      });
    }

    // API calls only for still-missing keys
    const apiNeeded = uniqueMissed.filter((k) => distanceCacheRef.current[k] === undefined);
    if (apiNeeded.length > 0) {
      const keyToOriginDest = {};
      pairs.forEach((p) => {
        keyToOriginDest[p.fromKey] = { o: p.fromOrigin, d: p.fromDest };
        keyToOriginDest[p.toKey]   = { o: p.toOrigin,   d: p.toDest   };
      });
      await Promise.all(apiNeeded.map(async (k) => {
        try {
          const distM = await callDistanceMatrix(keyToOriginDest[k].o, keyToOriginDest[k].d);
          distanceCacheRef.current[k] = distM;
          await setDoc(doc(db, "distanceCache", k), { distanceM: distM, calculatedAt: new Date().toISOString() });
        } catch { distanceCacheRef.current[k] = null; }
      }));
    }

    // Build result from cache
    const result = {};
    pairs.forEach((p) => {
      result[p.id] = {
        fromDistM: distanceCacheRef.current[p.fromKey] ?? null,
        toDistM:   distanceCacheRef.current[p.toKey]   ?? null,
      };
    });
    setDistanceData(result);
  };
  // ── End Distance Matrix ────────────────────────────────────────────

  const [matchSaving, setMatchSaving] = useState(false);
  const [manualSearchPhone, setManualSearchPhone] = useState("");
  const [manualSearchResults, setManualSearchResults] = useState(null); // null = not searched, [] = no results

  // Haversine distance in km
  const haversine = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return null;
    const R = 6371, toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
  };

  // Normalize city — handles corrupted entries where full address was stored as city
  const resolveCityFromCoords = (lat, lng) => {
    if (!lat || !lng) return null;
    const la = parseFloat(lat), lo = parseFloat(lng);
    if (la >= 12.7 && la <= 13.2 && lo >= 77.3 && lo <= 77.8) return "bangalore";
    if (la >= 18.4 && la <= 18.8 && lo >= 73.6 && lo <= 74.1) return "pune";
    if (la >= 18.8 && la <= 19.3 && lo >= 72.7 && lo <= 73.1) return "mumbai";
    if (la >= 28.4 && la <= 28.9 && lo >= 76.8 && lo <= 77.4) return "delhi";
    if (la >= 22.4 && la <= 22.7 && lo >= 88.2 && lo <= 88.5) return "kolkata";
    return null;
  };

  const resolveCity = (loc) => {
    // 1. Try extracting known city from city/fullAddress/address strings
    const candidates = [loc?.city, loc?.fullAddress, loc?.address].filter(Boolean);
    for (const s of candidates) {
      const l = s.toLowerCase();
      if (l.includes("bengaluru") || l.includes("bangalore")) return "bangalore";
      if (l.includes("mumbai")) return "mumbai";
      if (l.includes("pune")) return "pune";
      if (l.includes("kolkata")) return "kolkata";
      if (l.includes("new delhi") || l.includes("delhi")) return "delhi";
    }
    // 2. Fall back to lat/lng bounding box (handles pincode-only entries like "Karnataka 560300, India")
    const fromCoords = resolveCityFromCoords(loc?.latitude, loc?.longitude);
    if (fromCoords) return fromCoords;
    return loc?.city?.toLowerCase().trim() || "";
  };

  // Client-side filter — 0 reads
  const getMatchingTravelers = (sender) => {
    const fromCity = resolveCity(sender.from);
    const toCity   = resolveCity(sender.to);
    const sendingDate = sender.itemDetails?.sendingDate || null;
    if (!fromCity || !toCity) return [];
    return travelerRequests
      .filter((t) => {
        if (t.isConfirmed) return false;
        if (t.flightDetails?.travelDate && new Date(t.flightDetails.travelDate) < new Date(today)) return false;
        return (
          resolveCity(t.from) === fromCity &&
          resolveCity(t.to) === toCity
        );
      })
      .map((t) => {
        const fromDist = haversine(sender.from?.latitude, sender.from?.longitude, t.from?.latitude, t.from?.longitude);
        const toDist   = haversine(sender.to?.latitude, sender.to?.longitude, t.to?.latitude, t.to?.longitude);
        const totalDist = fromDist !== null && toDist !== null ? +(fromDist + toDist).toFixed(1) : null;

        let suitability = null;
        let daysLate = null;
        if (sendingDate && t.flightDetails?.travelDate) {
          daysLate = Math.round((new Date(t.flightDetails.travelDate) - new Date(sendingDate)) / 86400000);
          if (daysLate <= 0) suitability = { label: "Suitable", color: "#0f9d58", order: 0 };
          else if (daysLate <= 4) suitability = { label: `Late by ${daysLate} day${daysLate > 1 ? "s" : ""}`, color: "#f0a500", order: 1 };
          else suitability = { label: `Too late (${daysLate}d)`, color: "#e53935", order: 2 };
        }
        return { ...t, fromDist, toDist, totalDist, suitability, daysLate };
      })
      .sort((a, b) => {
        // Primary: suitability order (Suitable → Late → Too late)
        const aOrder = a.suitability?.order ?? 1;
        const bOrder = b.suitability?.order ?? 1;
        if (aOrder !== bOrder) return aOrder - bOrder;
        // Secondary: days late ascending
        if (a.daysLate !== null && b.daysLate !== null) return a.daysLate - b.daysLate;
        // Tertiary: distance
        if (a.totalDist !== null && b.totalDist !== null) return a.totalDist - b.totalDist;
        if (a.totalDist !== null) return -1;
        if (b.totalDist !== null) return 1;
        return 0;
      });
  };

  const renderDistRow = (requestId, fallbackFrom = null, fallbackTo = null) => {
    const dd = distanceData[requestId];
    const fromDistM = dd?.fromDistM;
    const toDistM   = dd?.toDistM;
    const fromVal = fromDistM != null ? `${(fromDistM/1000).toFixed(1)} km · ${getApproxTime(fromDistM)}` : fallbackFrom != null ? `${fallbackFrom} km (est)` : null;
    const toVal   = toDistM   != null ? `${(toDistM/1000).toFixed(1)} km · ${getApproxTime(toDistM)}`   : fallbackTo   != null ? `${fallbackTo} km (est)`   : null;
    if (!fromVal && !toVal && dd) return null;
    return (<>
      {fromVal && <span className="adm-match-dist">📍 From: {fromVal}</span>}
      {toVal   && <span className="adm-match-dist">📍 To: {toVal}</span>}
      {!dd && fallbackFrom == null && fallbackTo == null && <span className="adm-match-dist-loading">Calculating...</span>}
    </>);
  };

  // Lightweight version — city match only, no haversine. Used for Today tab count badge.
  const getMatchCountForSender = (sender) => {
    const fromCity = resolveCity(sender.from);
    const toCity   = resolveCity(sender.to);
    if (!fromCity || !toCity) return 0;
    return travelerRequests.filter((t) =>
      !t.isConfirmed &&
      isFutureFlight(t.flightDetails) &&
      resolveCity(t.from) === fromCity &&
      resolveCity(t.to) === toCity
    ).length;
  };

  const updateLocalSender = (requestId, phoneNumber, data) => {
    setSenderRequests((prev) => prev.map((r) => r.requestId === requestId && r.phoneNumber === phoneNumber ? { ...r, ...data } : r));
    setSelectedRequest((prev) => prev ? { ...prev, ...data } : prev);
  };

  const updateLocalTraveler = (requestId, phoneNumber, data) => {
    setTravelerRequests((prev) => prev.map((r) => r.requestId === requestId && r.phoneNumber === phoneNumber ? { ...r, ...data } : r));
  };

  const tagTraveler = async (traveler) => {
    if (!selectedRequest || matchSaving) return;
    const sender = selectedRequest;
    const alreadyTagged = (sender.matchedTravelers || []).some((m) => m.requestKey === traveler.requestId);
    if (alreadyTagged) return;
    setMatchSaving(true);
    try {
      const newEntry = { phone: traveler.phoneNumber, requestKey: traveler.requestId, status: "TAGGED" };
      const updatedMatched = [...(sender.matchedTravelers || []), newEntry];
      await updateDoc(sender.docRef, { matchedTravelers: updatedMatched, updatedAt: new Date().toISOString() });
      const updatedTagged = [...(traveler.taggedToSenders || []), { senderPhone: sender.phoneNumber, senderRequestKey: sender.requestId }];
      await updateDoc(traveler.docRef, { taggedToSenders: updatedTagged, updatedAt: new Date().toISOString() });
      updateLocalSender(sender.requestId, sender.phoneNumber, { matchedTravelers: updatedMatched });
      updateLocalTraveler(traveler.requestId, traveler.phoneNumber, { taggedToSenders: updatedTagged });
    } catch (err) { console.error("Tag error:", err); }
    finally { setMatchSaving(false); }
  };

  const confirmTraveler = async (traveler) => {
    if (!selectedRequest || matchSaving) return;
    if (traveler.isConfirmed) {
      alert("This traveler has already been confirmed by another sender.");
      return;
    }
    const sender = selectedRequest;
    setMatchSaving(true);
    try {
      const confirmedEntry = { phone: traveler.phoneNumber, requestKey: traveler.requestId, flightDetails: traveler.flightDetails || null };
      // 1. Update sender (sync OTPs from traveler — no extra read, traveler already in memory)
      await updateDoc(sender.docRef, {
        confirmedTraveler: confirmedEntry,
        matchedTravelers: [{ ...confirmedEntry, status: "CONFIRMED" }],
        status: "MATCHED",
        firstMileOTP: traveler.FirstMileOTP || null,
        lastMileOTP: traveler.LastMileOTP || null,
        updatedAt: new Date().toISOString(),
      });
      // 2. Update confirmed traveler
      await updateDoc(traveler.docRef, {
        confirmedForSender: { senderPhone: sender.phoneNumber, senderRequestKey: sender.requestId },
        isConfirmed: true, taggedToSenders: [],
        status: "MATCHED",
        updatedAt: new Date().toISOString(),
      });
      // 3. Remove this sender from other tagged travelers
      const others = (sender.matchedTravelers || []).filter((m) => m.requestKey !== traveler.requestId);
      for (const m of others) {
        const otherT = travelerRequests.find((t) => t.requestId === m.requestKey);
        if (otherT) {
          const updated = (otherT.taggedToSenders || []).filter((s) => s.senderRequestKey !== sender.requestId);
          await updateDoc(otherT.docRef, { taggedToSenders: updated, updatedAt: new Date().toISOString() });
          updateLocalTraveler(otherT.requestId, otherT.phoneNumber, { taggedToSenders: updated });
        }
      }
      const senderUpdate = { confirmedTraveler: confirmedEntry, matchedTravelers: [{ ...confirmedEntry, status: "CONFIRMED" }], status: "MATCHED" };
      updateLocalSender(sender.requestId, sender.phoneNumber, senderUpdate);
      updateLocalTraveler(traveler.requestId, traveler.phoneNumber, { confirmedForSender: { senderPhone: sender.phoneNumber, senderRequestKey: sender.requestId }, isConfirmed: true, taggedToSenders: [], status: "MATCHED" });
    } catch (err) { console.error("Confirm error:", err); }
    finally { setMatchSaving(false); }
  };

  const sendConfirmLinks = async () => {
    if (!selectedRequest?.confirmedTraveler || matchSaving) return;
    const sender = selectedRequest;
    const traveler = travelerById.get(sender.confirmedTraveler.requestKey);
    if (!traveler) { alert("Traveler details not loaded. Please refresh."); return; }

    setMatchSaving(true);
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const baseUrl = window.location.origin;

      // Generate sender token
      const senderToken = crypto.randomUUID();
      await setDoc(doc(db, "confirmTokens", senderToken), {
        token: senderToken,
        userType: "SENDER",
        phoneNumber: sender.phoneNumber,
        requestId: sender.requestId,
        expiresAt,
        used: false,
        createdAt: new Date().toISOString(),
      });

      // Generate traveler token
      const travelerToken = crypto.randomUUID();
      await setDoc(doc(db, "confirmTokens", travelerToken), {
        token: travelerToken,
        userType: "TRAVELER",
        phoneNumber: traveler.phoneNumber,
        requestId: traveler.requestId,
        expiresAt,
        used: false,
        createdAt: new Date().toISOString(),
      });

      const senderLink = `${baseUrl}/confirm/${senderToken}`;
      const travelerLink = `${baseUrl}/confirm/${travelerToken}`;

      // Mark links as sent on both requests
      await updateDoc(sender.docRef, { confirmLinkSentAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      await updateDoc(traveler.docRef, { confirmLinkSentAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

      alert(
        `Links generated!\n\n📦 Sender (${sender.phoneNumber}):\n${senderLink}\n\n✈ Traveler (${traveler.phoneNumber}):\n${travelerLink}\n\nSend these via WhatsApp.`
      );
    } catch (err) {
      console.error("Send links error:", err);
      alert("Failed to generate links. Please try again.");
    } finally {
      setMatchSaving(false);
    }
  };

  const removeTag = async (traveler) => {
    if (!selectedRequest || matchSaving) return;
    const sender = selectedRequest;
    setMatchSaving(true);
    try {
      const updatedMatched = (sender.matchedTravelers || []).filter((m) => m.requestKey !== traveler.requestId);
      await updateDoc(sender.docRef, { matchedTravelers: updatedMatched, updatedAt: new Date().toISOString() });
      const updatedTagged = (traveler.taggedToSenders || []).filter((s) => s.senderRequestKey !== sender.requestId);
      await updateDoc(traveler.docRef, { taggedToSenders: updatedTagged, updatedAt: new Date().toISOString() });
      updateLocalSender(sender.requestId, sender.phoneNumber, { matchedTravelers: updatedMatched });
      updateLocalTraveler(traveler.requestId, traveler.phoneNumber, { taggedToSenders: updatedTagged });
    } catch (err) { console.error("Remove tag error:", err); }
    finally { setMatchSaving(false); }
  };

  const removeConfirm = async () => {
    if (!selectedRequest || matchSaving) return;
    const sender = selectedRequest;
    const confirmedT = travelerById.get(sender.confirmedTraveler?.requestKey);
    const confirmedPhone = sender.confirmedTraveler?.phone;
    const confirmedKey   = sender.confirmedTraveler?.requestKey;
    setMatchSaving(true);
    try {
      await updateDoc(sender.docRef, { confirmedTraveler: null, matchedTravelers: [], status: "SEARCHING", updatedAt: new Date().toISOString() });
      if (confirmedT) {
        await updateDoc(confirmedT.docRef, { confirmedForSender: null, isConfirmed: false, status: "SEARCHING", updatedAt: new Date().toISOString() });
        updateLocalTraveler(confirmedT.requestId, confirmedT.phoneNumber, { confirmedForSender: null, isConfirmed: false, status: "SEARCHING" });
      } else if (confirmedPhone && confirmedKey) {
        // Traveler not in local memory — construct docRef and update Firestore directly
        const travelerRef = doc(db, "users", confirmedPhone, "TravelerRequests", confirmedKey);
        await updateDoc(travelerRef, { confirmedForSender: null, isConfirmed: false, status: "SEARCHING", updatedAt: new Date().toISOString() });
      }
      updateLocalSender(sender.requestId, sender.phoneNumber, { confirmedTraveler: null, matchedTravelers: [], status: "SEARCHING" });
    } catch (err) { console.error("Remove confirm error:", err); }
    finally { setMatchSaving(false); }
  };

  const [modalTab, setModalTab] = useState("details");
  const [waModal, setWaModal]   = useState(null); // { actionKey, text, phone }
  const [waSending, setWaSending] = useState(false);
  const [altNumInput, setAltNumInput] = useState("");

  const getDefaultText = (actionKey, req) => {
    const isTraveler = !!req.flightDetails;
    const all = [...(isTraveler ? TRAVELER_ACTIONS : SENDER_ACTIONS), ...COMMON_ACTIONS, ...TRAVELER_ONLY_ACTIONS];
    const action = all.find((a) => a.key === actionKey);
    if (!action) return "";
    let text = action.text;
    if (actionKey === "S_MATCH_FOUND" && req.confirmedTraveler) {
      const ct = travelerById.get(req.confirmedTraveler.requestKey);
      if (ct?.flightDetails) {
        text = text
          .replace("[AIRLINE]", ct.flightDetails.airline || "")
          .replace("[DATE]", ct.flightDetails.travelDate || "")
          .replace("[FROM]", ct.from?.city || "")
          .replace("[TO]", ct.to?.city || "");
      }
    }
    if (actionKey === "S_IN_TRANSIT") text = text.replace("[TO_CITY]", req.to?.city || "destination");
    if (actionKey === "T_MATCH_FOUND" && req.confirmedForSender) {
      const cs = senderById.get(req.confirmedForSender.senderRequestKey);
      if (cs?.itemDetails) {
        text = text
          .replace("[ITEM]", cs.itemDetails.itemName || "")
          .replace("[FROM]", cs.from?.city || "")
          .replace("[TO]", cs.to?.city || "")
          .replace("[WEIGHT]", cs.itemDetails.totalWeight || "");
      }
    }
    return text;
  };

  const openWaModal = (actionKey, req) => {
    const phone = req.alternateWhatsappNumber || req.phoneNumber;
    const isAlternate = !!req.alternateWhatsappNumber;
    setWaModal({ actionKey, text: getDefaultText(actionKey, req), phone, isAlternate, originalPhone: req.phoneNumber });
  };

  const sendWhatsAppAction = async () => {
    if (!waModal || !selectedRequest) return;
    setWaSending(true);
    try {
      const clean = waModal.phone.replace(/\D/g, "");
      const waPhone =
        clean.length === 10 ? `91${clean}` :
        clean.length === 11 && clean.startsWith("0") ? `91${clean.slice(1)}` :
        clean;
      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(waModal.text)}`, "_blank");
      const updated = { ...(selectedRequest.sentWhatsappActions || {}), [waModal.actionKey]: { sent: true, sentAt: new Date().toISOString() } };
      const autoStatus = ACTION_STATUS_MAP[waModal.actionKey];
      const docUpdate = { sentWhatsappActions: updated, updatedAt: new Date().toISOString() };
      if (autoStatus) docUpdate.status = autoStatus;
      await updateDoc(selectedRequest.docRef, docUpdate);
      const localUpdate = { sentWhatsappActions: updated, ...(autoStatus ? { status: autoStatus } : {}) };
      const updater = (list) => list.map((r) => r.requestId === selectedRequest.requestId && r.phoneNumber === selectedRequest.phoneNumber ? { ...r, ...localUpdate } : r);
      setSenderRequests((p) => updater(p));
      setTravelerRequests((p) => updater(p));
      setSelectedRequest((p) => ({ ...p, ...localUpdate }));
      setWaModal(null);
    } catch (err) { console.error("WA send error:", err); }
    finally { setWaSending(false); }
  };

  const [refreshMsg, setRefreshMsg] = useState("");

  const checkAndRefresh = async () => {
    setRefreshMsg("Refreshing...");
    try {
      await loadAllRequests();
      // Reset notification counters
      try { await setDoc(doc(db, "meta", "adminAlerts"), { newSenders: 0, newTravelers: 0, lastOrderAt: null }, { merge: true }); } catch (_) {}
      setRefreshMsg("Updated!");
      setTimeout(() => setRefreshMsg(""), 2000);
    } catch (err) {
      setRefreshMsg("Error — try again");
      setTimeout(() => setRefreshMsg(""), 3000);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("ADMIN_AUTH");
    navigate("/admin");
  };

  const activeList = tab === "sender" ? senderRequests : travelerRequests;

  // ── Search helper — matches phone, name, requestId ──
  const sq = searchQuery.trim().toLowerCase();
  const matchesSearch = (req) => {
    if (!sq) return true;
    const fields = [
      req.phoneNumber,
      req.requestId,
      req.flightDetails?.firstName,
      req.flightDetails?.lastName,
      req.itemDetails?.senderName,
      req.from?.city,
      req.to?.city,
      req.flightDetails?.airline,
      req.flightDetails?.pnr,
    ];
    return fields.some((f) => f && f.toLowerCase().includes(sq));
  };
  const matchesUserSearch = (user) => {
    if (!sq) return true;
    return [user.phoneNumber, user.userId, user.role, user.adminNotes]
      .some((f) => f && f.toLowerCase().includes(sq));
  };

  const filteredList = (() => {
    let list = activeList.filter(matchesSearch);
    if (filterStatus !== "ALL") {
      list = list.filter((r) => (r.status || "NEW_ORDER") === filterStatus);
    }
    if (sortDate !== "none") {
      list = [...list].sort((a, b) => {
        const da = tab === "sender" ? (a.itemDetails?.sendingDate || "") : (a.flightDetails?.travelDate || "");
        const dateB = tab === "sender" ? (b.itemDetails?.sendingDate || "") : (b.flightDetails?.travelDate || "");
        return sortDate === "asc" ? da.localeCompare(dateB) : dateB.localeCompare(da);
      });
    }
    return list;
  })();

  const filteredUsers = (() => {
    let list = allUsers.filter(matchesUserSearch);
    if (filterRole !== "ALL") {
      list = filterRole === "none"
        ? list.filter((u) => !u.role)
        : list.filter((u) => u.role === filterRole);
    }
    return list;
  })();

  const roleColor = (role) => {
    if (role === "Traveler") return "#2196f3";
    if (role === "Sender") return "#ff914d";
    return "#888";
  };

  const isExpired = (req) => {
    if (!req.flightDetails?.travelDate) return false;
    if (req.status === "MATCHED" || req.status === "IN_PROGRESS" || req.status === "COMPLETED") return false;
    return new Date(req.flightDetails.travelDate) < new Date(today);
  };

  const statusColor = (status) => {
    if (!status || status === "NEW_ORDER") return "#888";
    if (status === "SEARCHING") return "#f0a500";
    if (status === "MATCHED") return "#2196f3";
    if (status === "IN_PROGRESS") return "#9c27b0";
    if (status === "COMPLETED") return "#0f9d58";
    return "#888";
  };

  const fmtDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-");
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  };

  const fmtDateShort = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  };

  const fmtTime = (timeStr) => {
    if (!timeStr) return null;
    const parts = timeStr.split(":");
    if (parts.length !== 2) return timeStr;
    const h = Number(parts[0]);
    const min = Number(parts[1]);
    if (isNaN(h) || isNaN(min) || h > 23 || min > 59) return timeStr;
    const ampm = h >= 12 ? "PM" : "AM";
    const hr12 = h % 12 || 12;
    return `${hr12}:${String(min).padStart(2, "0")} ${ampm}`;
  };

  // ── Copy to clipboard ──
  const copyPhone = (phone) => {
    navigator.clipboard.writeText(phone).then(() => {
      setCopyFeedback(phone);
      setTimeout(() => setCopyFeedback(null), 1500);
    }).catch(() => {});
  };

  // ── Phone action buttons (call, WhatsApp, copy) ──
  const PhoneActions = ({ phone }) => {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, "");
    const waPhone = clean.length === 10 ? `91${clean}` : clean.length === 11 && clean.startsWith("0") ? `91${clean.slice(1)}` : clean;
    return (
      <span className="adm-phone-actions">
        <a href={`tel:+91${clean}`} title="Call" className="adm-phone-action">📞</a>
        <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer" title="Direct WhatsApp" className="adm-phone-action">💬</a>
        <button className="adm-phone-copy" onClick={(e) => { e.stopPropagation(); copyPhone(phone); }} title="Copy number">
          {copyFeedback === phone ? "✓" : "📋"}
        </button>
      </span>
    );
  };

  const renderField = useCallback((label, value) => {
    if (!value && value !== 0) return null;
    return (
      <div className="adm-detail-row">
        <span className="adm-detail-label">{label}</span>
        <span className="adm-detail-value">{String(value)}</span>
      </div>
    );
  }, []);

  return (
    <div className="adm-page">
      {/* HEADER */}
      <div className="adm-header">
        <div className="adm-header-left">
          <img src={logo} alt="TurantX" className="adm-logo" />
          <div>
            <h1>Admin Dashboard</h1>
            <p>TurantX Operations Panel</p>
          </div>
        </div>
        <div className="adm-header-right">
          <button className="adm-refresh-btn" onClick={checkAndRefresh}>
            {refreshMsg || "Refresh"}
          </button>
          <button className="adm-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="adm-stats">
        <div className="adm-stat-card">
          <span className="adm-stat-num">{allUsers.length}</span>
          <span className="adm-stat-label">Total Users</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-num">{senderRequests.length}</span>
          <span className="adm-stat-label">Sender Requests</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-num">{travelerRequests.length}</span>
          <span className="adm-stat-label">Traveler Requests</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-num" style={{ color: "#0f9d58" }}>
            {[...senderRequests, ...travelerRequests].filter((r) => r.status === "COMPLETED" || r.LastMileStatus === "Completed").length}
          </span>
          <span className="adm-stat-label">Completed</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-num" style={{ color: "#f0a500" }}>
            {[...senderRequests, ...travelerRequests].filter((r) => !r.status || r.status === "NEW_ORDER" || r.status === "SEARCHING").length}
          </span>
          <span className="adm-stat-label">Searching</span>
        </div>
      </div>

      {/* NOTIFICATION BAR */}
      {(adminAlerts.newSenders > 0 || adminAlerts.newTravelers > 0) && (
        <div className="adm-notification-bar">
          <span className="adm-notification-text">
            🔔
            {adminAlerts.newSenders > 0 && ` ${adminAlerts.newSenders} new sender${adminAlerts.newSenders > 1 ? "s" : ""}`}
            {adminAlerts.newSenders > 0 && adminAlerts.newTravelers > 0 && ","}
            {adminAlerts.newTravelers > 0 && ` ${adminAlerts.newTravelers} new traveler${adminAlerts.newTravelers > 1 ? "s" : ""}`}
            {" "}since last refresh
          </span>
          <button className="adm-notification-refresh" onClick={checkAndRefresh}>
            Refresh Now →
          </button>
        </div>
      )}

      {/* TABS + FILTER */}
      <div className="adm-controls">
        <div className="adm-tabs">
          <button className={`adm-tab ${tab === "today" ? "active" : ""}`} onClick={() => { setTab("today"); setFilterStatus("ALL"); setSortDate("none"); }}
            style={{ position: "relative" }}>
            Today
            {(todaySenders.length + todayTravelers.length) > 0 && (
              <span className="adm-today-badge">{todaySenders.length + todayTravelers.length}</span>
            )}
          </button>
          <button className={`adm-tab ${tab === "users" ? "active" : ""}`} onClick={() => { setTab("users"); setFilterStatus("ALL"); setSortDate("none"); }}>
            All Users ({allUsers.length})
          </button>
          <button className={`adm-tab ${tab === "sender" ? "active" : ""}`} onClick={() => { setTab("sender"); setFilterStatus("ALL"); setSortDate("none"); }}>
            Sender ({senderRequests.length})
          </button>
          <button className={`adm-tab ${tab === "traveler" ? "active" : ""}`} onClick={() => { setTab("traveler"); setFilterStatus("ALL"); setSortDate("none"); }}>
            Traveler ({travelerRequests.length})
          </button>
          <button className={`adm-tab ${tab === "content" ? "active" : ""}`} onClick={() => { setTab("content"); setFilterStatus("ALL"); setSortDate("none"); }}>
            Content
          </button>
        </div>
        {tab !== "content" && (
          <div className="adm-search-wrap">
            <input
              className="adm-search-input"
              type="text"
              placeholder="🔍 Search by phone, name, city, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="adm-search-clear" onClick={() => setSearchQuery("")}>✕</button>
            )}
          </div>
        )}

        {tab === "content" ? null : tab === "users" ? (
          <select className="adm-filter-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="ALL">All Roles</option>
            <option value="Sender">Sender</option>
            <option value="Traveler">Traveler</option>
            <option value="none">No Request Yet</option>
          </select>
        ) : tab === "today" ? null : (
          <>
            <select className="adm-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </>
        )}
      </div>

      {/* TABLE */}
      <div className="adm-table-wrap">
        {tab === "content" ? (
          <ContentManager />
        ) : loading ? (
          <div className="adm-loading">Loading...</div>
        ) : tab === "today" ? (
          todaySenders.length === 0 && todayTravelers.length === 0 ? (
            <div className="adm-empty">Nothing scheduled for today.</div>
          ) : (() => {
            void tick;
            // compute matched pairs (sender confirmed with a traveler flying today)
            const matchedPairs = todaySenders
              .filter((s) => s.confirmedTraveler)
              .map((s) => {
                // Traveler may fly today OR on a future date (late match) — check both pools
                const t = travelerById.get(s.confirmedTraveler.requestKey);
                return t ? { sender: s, traveler: t } : null;
              })
              .filter(Boolean);
            const matchedSenderIds = new Set(matchedPairs.map((p) => p.sender.requestId));
            const matchedTravelerIds = new Set(matchedPairs.map((p) => p.traveler.requestId));
            const unmatchedSenders = todaySenders.filter((s) => !matchedSenderIds.has(s.requestId));
            const unmatchedTravelers = todayTravelers.filter((t) => !matchedTravelerIds.has(t.requestId));

            const SenderCard = ({ req }) => {
              const isMatched = !!req.confirmedTraveler;
              const isCompleted = req.status === "COMPLETED" || req.LastMileStatus === "Completed";
              const isExpired = !isMatched && req.itemDetails?.sendingDate && new Date(req.itemDetails.sendingDate) < new Date(today);
              const confirmedFlight = travelerById.get(req.confirmedTraveler?.requestKey)?.flightDetails
                || req.confirmedTraveler?.flightDetails
                || null;
              const handoverDeadline = (() => {
                if (!confirmedFlight?.travelDate) return null;
                const d = confirmedFlight.travelDate;
                const t = confirmedFlight.departureTime;
                return t ? new Date(`${d}T${t}`) : new Date(d);
              })();
              const handoverMissed = isMatched && req.status === "MATCHED" && handoverDeadline && handoverDeadline < new Date();
              const tl = isMatched
                ? (() => {
                    if (!handoverDeadline) return null;
                    const diff = handoverDeadline - new Date();
                    if (diff <= 0) return null;
                    const totalHrs = Math.floor(diff / 3600000);
                    const days = Math.floor(totalHrs / 24);
                    const hrs = totalHrs % 24;
                    const mins = Math.floor((diff % 3600000) / 60000);
                    const label = days > 0 ? `${days}d ${hrs}h left` : hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`;
                    const color = days > 0 ? "#2196f3" : hrs >= 3 ? "#0f9d58" : hrs >= 1 ? "#f0a500" : "#e53935";
                    return { label, color };
                  })()
                : getTimeLeft(req.itemDetails?.lastDropTime);
              const ra = getRemainingActions(req);
              return (
                <div className={`adm-today-card${isCompleted ? " adm-card-completed" : ""}${isExpired ? " adm-card-expired" : ""}`} style={{ borderLeft: `4px solid ${isCompleted ? "#0f9d58" : isMatched ? "#0f9d58" : handoverMissed ? "#e53935" : (tl?.color || "#ccc")}` }}>
                  <div className="adm-today-card-top">
                    <span className="adm-today-phone adm-name-truncate">📦 {req.itemDetails?.senderName ? `${req.itemDetails.senderName} · ` : ""}{req.phoneNumber} <PhoneActions phone={req.phoneNumber} /></span>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {tl && !handoverMissed && (
                        <span className="adm-today-timer" style={{ color: tl.color, background: tl.color + "18" }}>
                          {isMatched ? `Handover in ${tl.label}` : `${tl.label} to expire`}
                        </span>
                      )}
                      <span className={`adm-today-actions-badge${ra.remaining === 0 ? " adm-actions-done" : ""}`} data-done={ra.remaining === 0}>
                        {ra.remaining === 0 ? "✓" : `${ra.sent}/${ra.total} · ${ra.remaining} left`}
                      </span>
                    </div>
                  </div>
                  <div className="adm-today-route">
                    {req.from?.city || "—"} → {req.to?.city || "—"}
                    {req.itemDetails?.sendingDate && <span className="adm-today-date"> · {fmtDateShort(req.itemDetails.sendingDate)}</span>}
                    {!isMatched && req.itemDetails?.lastDropTime && <span className="adm-today-droptime"> · by {fmtTime(req.itemDetails.lastDropTime)}</span>}
                  </div>
                  <div className="adm-today-meta">
                    <span>{req.itemDetails?.itemName || "—"}</span>
                    {isMatched && req.status === "MATCHED"
                      ? (handoverMissed
                          ? <span className="adm-today-handover-missed">⚠ Handover Missed — Rematch</span>
                          : <span className="adm-today-handover-badge">⚡ Priority handover!</span>
                        )
                      : (() => {
                          const available = getMatchCountForSender(req);
                          return available > 0
                            ? <span className="adm-today-traveler-count">✈ {available} traveler{available > 1 ? "s" : ""} available</span>
                            : <span className="adm-today-traveler-none">No travelers</span>;
                        })()
                    }
                  </div>
                  <div className="adm-today-card-footer">
                    <span className="adm-status-pill" style={{ background: statusColor(req.status) + "22", color: statusColor(req.status), border: `1px solid ${statusColor(req.status)}44` }}>
                      {req.status || "NEW_ORDER"}
                    </span>
                    <button className="adm-view-btn" onClick={() => { openRequest(req); setModalTab("details"); }}>Details →</button>
                  </div>
                </div>
              );
            };

            const TravelerCard = ({ req }) => {
              const ra = getRemainingActions(req);
              const isCompleted = req.status === "COMPLETED";
              const tDate = req.flightDetails?.travelDate;
              const daysUntilFlight = tDate
                ? Math.round((new Date(tDate) - new Date(today)) / 86400000)
                : null;
              const isFlightPassed = daysUntilFlight !== null && daysUntilFlight < 0;
              const flightTimeLabel = (() => {
                if (daysUntilFlight !== 0) return null;
                const depTime = req.flightDetails?.departureTime;
                if (!depTime) return null;
                const dep = new Date(`${tDate}T${depTime}`);
                const diffMs = dep - new Date();
                if (diffMs <= 0) return "departed";
                const h = Math.floor(diffMs / 3600000);
                const m = Math.floor((diffMs % 3600000) / 60000);
                return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
              })();
              const flightLabel = daysUntilFlight === null ? null
                : daysUntilFlight === 0 ? `Flying today${flightTimeLabel ? ` · ${flightTimeLabel}` : ""}`
                : daysUntilFlight === 1 ? "Flying tomorrow"
                : daysUntilFlight < 0 ? "Flight passed"
                : `Flying in ${daysUntilFlight}d`;
              const flightColor = daysUntilFlight === 0 ? "#e53935" : daysUntilFlight < 0 ? "#888" : "#f0a500";
              const isVerified = !!req.flightDetailsVerified;
              return (
                <div className={`adm-today-card${isCompleted ? " adm-card-completed" : ""}${isFlightPassed && !isCompleted ? " adm-card-expired" : ""}`} style={{ borderLeft: `4px solid ${isCompleted ? "#0f9d58" : isFlightPassed ? "#888" : "#2196f3"}` }}>
                  <div className="adm-today-card-top">
                    <span className="adm-today-phone adm-name-truncate">✈ {req.flightDetails?.firstName ? `${req.flightDetails.firstName} ${req.flightDetails.lastName || ""}`.trim() + " · " : ""}{req.phoneNumber} <PhoneActions phone={req.phoneNumber} /></span>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                      {isVerified && <span className="adm-verified-badge">✅ Verified</span>}
                      {!isVerified && <span className="adm-unverified-badge">⏳ Unverified</span>}
                      {flightLabel && (
                        <span className="adm-today-timer" style={{ color: flightColor, background: flightColor + "18" }}>{flightLabel}</span>
                      )}
                      <span className={`adm-today-actions-badge${ra.remaining === 0 ? " adm-actions-done" : ""}`} data-done={ra.remaining === 0}>
                        {ra.remaining === 0 ? "✓" : `${ra.sent}/${ra.total} · ${ra.remaining} left`}
                      </span>
                    </div>
                  </div>
                  <div className="adm-today-route">{req.from?.city || "—"} → {req.to?.city || "—"}</div>
                  <div className="adm-today-meta">
                    <span>✈ {req.flightDetails?.airline || "—"}</span>
                    <span>🕒 {fmtTime(req.flightDetails?.departureTime) || "—"}</span>
                    {req.flightDetails?.carryType && <span>📄 {req.flightDetails.carryType}</span>}
                  </div>
                  {req.flightDetails?.checkParcel && (
                    <div className="adm-today-check-parcel">⚠ Wants to check parcel before carrying</div>
                  )}
                  <div className="adm-today-card-footer">
                    <span className="adm-status-pill" style={{ background: statusColor(req.status) + "22", color: statusColor(req.status), border: `1px solid ${statusColor(req.status)}44` }}>
                      {req.status || "NEW_ORDER"}
                    </span>
                    <button className="adm-view-btn" onClick={() => { openRequest(req); setModalTab("details"); }}>Details →</button>
                  </div>
                </div>
              );
            };

            // Pipeline summary counts
            const pCounts = { searching: 0, matched: 0, inProgress: 0, completed: 0 };
            todaySenders.forEach((s) => {
              if (s.status === "COMPLETED" || s.LastMileStatus === "Completed") pCounts.completed++;
              else if (s.status === "IN_PROGRESS") pCounts.inProgress++;
              else if (s.status === "MATCHED") pCounts.matched++;
              else pCounts.searching++;
            });

            return (
              <div className="adm-today-sections">

                {/* PIPELINE SUMMARY */}
                <div className="adm-pipeline-bar">
                  <div className="adm-pipeline-item" style={{ borderColor: "#f0a500" }}>
                    <span className="adm-pipeline-num">{pCounts.searching}</span>
                    <span className="adm-pipeline-label">Searching</span>
                  </div>
                  <div className="adm-pipeline-arrow">→</div>
                  <div className="adm-pipeline-item" style={{ borderColor: "#2196f3" }}>
                    <span className="adm-pipeline-num">{pCounts.matched}</span>
                    <span className="adm-pipeline-label">Matched</span>
                  </div>
                  <div className="adm-pipeline-arrow">→</div>
                  <div className="adm-pipeline-item" style={{ borderColor: "#9c27b0" }}>
                    <span className="adm-pipeline-num">{pCounts.inProgress}</span>
                    <span className="adm-pipeline-label">In Transit</span>
                  </div>
                  <div className="adm-pipeline-arrow">→</div>
                  <div className="adm-pipeline-item" style={{ borderColor: "#0f9d58" }}>
                    <span className="adm-pipeline-num">{pCounts.completed}</span>
                    <span className="adm-pipeline-label">Completed</span>
                  </div>
                </div>

                {/* ── MATCHED PAIRS ── */}
                {matchedPairs.length > 0 && (
                  <>
                    <div className="adm-today-section-header">
                      <span>🔗 Matched Pairs</span>
                      <span className="adm-today-section-count">{matchedPairs.length}</span>
                    </div>
                    <div className="adm-pair-list">
                      {matchedPairs.map((pair) => {
                        const sDate = pair.sender.itemDetails?.sendingDate;
                        const tDate = pair.traveler.flightDetails?.travelDate;
                        const sDropTime = pair.sender.itemDetails?.lastDropTime;
                        const tDeptTime = pair.traveler.flightDetails?.departureTime;

                        let lateLabel = null;
                        if (sDate && tDate && sDropTime && tDeptTime) {
                          const base = new Date(`${sDate}T${sDropTime}`);
                          const actual = new Date(`${tDate}T${tDeptTime}`);
                          const diffMs = actual - base;
                          if (diffMs > 0) {
                            const totalMins = Math.floor(diffMs / 60000);
                            const days = Math.floor(totalMins / 1440);
                            const hrs = Math.floor((totalMins % 1440) / 60);
                            const mins = totalMins % 60;
                            const parts = [];
                            if (days > 0) parts.push(`${days}d`);
                            if (hrs > 0) parts.push(`${hrs}h`);
                            if (mins > 0 && days === 0) parts.push(`${mins}m`);
                            lateLabel = `⚠ Late +${parts.join(" ")}`;
                          }
                        }

                        return (
                          <div key={pair.sender.requestId + pair.traveler.requestId} className="adm-pair-row">
                            <SenderCard req={pair.sender} />
                            <div className="adm-pair-arrow">
                              <div className="adm-pair-arrow-line" />
                              <span className="adm-pair-arrow-label">MATCHED</span>
                              {lateLabel && (
                                <span className="adm-pair-late-badge">{lateLabel}</span>
                              )}
                              <div className="adm-pair-arrow-head">▶</div>
                            </div>
                            <TravelerCard req={pair.traveler} />
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* ── UNMATCHED SENDERS ── */}
                {unmatchedSenders.length > 0 && (
                  <>
                    <div className="adm-today-section-header" style={{ marginTop: matchedPairs.length > 0 ? 28 : 0 }}>
                      <span>📦 Senders — Searching</span>
                      <span className="adm-today-section-count" style={{ background: "#f0a500" }}>{unmatchedSenders.length}</span>
                    </div>
                    <div className="adm-today-grid">
                      {unmatchedSenders.map((req) => <SenderCard key={req.requestId} req={req} />)}
                    </div>
                  </>
                )}

                {/* ── UNMATCHED TRAVELERS ── */}
                {unmatchedTravelers.length > 0 && (
                  <>
                    <div className="adm-today-section-header" style={{ marginTop: 28 }}>
                      <span>✈ Travelers — No Sender Yet</span>
                      <span className="adm-today-section-count" style={{ background: "#9c27b0" }}>{unmatchedTravelers.length}</span>
                    </div>
                    <div className="adm-today-grid">
                      {unmatchedTravelers.map((req) => <TravelerCard key={req.requestId} req={req} />)}
                    </div>
                  </>
                )}

              </div>
            );
          })()
        ) : tab === "users" ? (
          filteredUsers.length === 0 ? (
            <div className="adm-empty">No users found.</div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Request Type</th>
                  <th>Auth Completed</th>
                  <th>Signed Up</th>
                  <th>Last Login</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => (
                  <tr key={u.userId}>
                    <td>{i + 1}</td>
                    <td className="adm-phone">{u.phoneNumber || u.userId} <PhoneActions phone={u.phoneNumber || u.userId} /></td>
                    <td>
                      {u.role ? (
                        <span className="adm-status-pill" style={{ background: roleColor(u.role) + "22", color: roleColor(u.role), border: `1px solid ${roleColor(u.role)}44` }}>
                          {u.role}
                        </span>
                      ) : <span className="adm-req-status">No request yet</span>}
                    </td>
                    <td><span className="adm-req-status">{u.requestType || "—"}</span></td>
                    <td style={{ color: u.authCompleted ? "#0f9d58" : "#e53935", fontWeight: 600 }}>
                      {u.authCompleted ? "Yes" : "No"}
                    </td>
                    <td className="adm-date">{u.createdAt ? u.createdAt.slice(0, 10) : "—"}</td>
                    <td className="adm-date">{u.lastLoginAt ? u.lastLoginAt.slice(0, 10) : "—"}</td>
                    <td>
                      <button className="adm-view-btn" onClick={() => openUser(u)}>View / Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : filteredList.length === 0 ? (
          <div className="adm-empty">No requests found.</div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Phone</th>
                <th>Name</th>
                <th>From → To</th>
                {tab === "traveler" && <th>Airline</th>}
                <th>Status</th>
                {tab === "traveler" && <th>Verified</th>}
                {tab === "traveler" && (
                  <th style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }} onClick={() => setSortDate(s => s === "asc" ? "desc" : s === "desc" ? "none" : "asc")}>
                    Travel Date {sortDate === "asc" ? "↑" : sortDate === "desc" ? "↓" : "↕"}
                  </th>
                )}
                {tab === "traveler" && <th>Flight Type</th>}
                {tab === "traveler" && <th>Flying In</th>}
                {tab === "sender" && (
                  <th style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }} onClick={() => setSortDate(s => s === "asc" ? "desc" : s === "desc" ? "none" : "asc")}>
                    Sending Date {sortDate === "asc" ? "↑" : sortDate === "desc" ? "↓" : "↕"}
                  </th>
                )}
                {tab === "sender" && <th>Potential</th>}
                {tab === "sender" && <th>Expires In</th>}
                <th>Match</th>
                <th>WA</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((req, i) => {
                const ra = getRemainingActions(req);
                return (
                <tr key={req.requestId + req.phoneNumber}>
                  <td>{i + 1}</td>
                  <td className="adm-phone">{req.phoneNumber} <PhoneActions phone={req.phoneNumber} /></td>
                  <td className="adm-name-cell">
                    {tab === "sender"
                      ? (req.itemDetails?.senderName || "—")
                      : (req.flightDetails?.firstName
                          ? `${req.flightDetails.firstName} ${req.flightDetails.lastName || ""}`.trim()
                          : "—")}
                  </td>
                  <td className="adm-route-cell">{req.from?.city || "—"} → {req.to?.city || "—"}</td>
                  {tab === "traveler" && (
                    <td className="adm-airline-cell">{req.flightDetails?.airline || "—"}</td>
                  )}
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span className="adm-status-pill" style={{ background: statusColor(req.status) + "22", color: statusColor(req.status), border: `1px solid ${statusColor(req.status)}44` }}>
                        {req.status || "NEW_ORDER"}
                      </span>
                      {tab === "traveler" && isExpired(req) && (
                        <span className="adm-expired-badge">Expired</span>
                      )}
                    </div>
                  </td>
                  {tab === "traveler" && (
                    <td>
                      <span className="adm-verified-pill" data-v={!!req.flightDetailsVerified}>
                        {req.flightDetailsVerified ? "✓ Verified" : "Pending"}
                      </span>
                    </td>
                  )}
                  {tab === "traveler" && (
                    <td className="adm-date">
                      <strong>{fmtDate(req.flightDetails?.travelDate) || "—"}</strong>
                    </td>
                  )}
                  {tab === "traveler" && (
                    <td>
                      {req.opsFlightInfo?.flightType
                        ? <span className={`adm-cell-tag ${req.opsFlightInfo.flightType === "Non-Stop" ? "adm-tag-green" : "adm-tag-yellow"}`}>{req.opsFlightInfo.flightType}</span>
                        : <span className="adm-cell-muted">—</span>}
                    </td>
                  )}
                  {tab === "traveler" && (() => {
                    const fd = getFlightDaysLeft(req.flightDetails?.travelDate, req.flightDetails?.departureTime);
                    return (
                      <td>
                        {fd
                          ? <span className="adm-cell-tag" style={{ color: fd.color }}>{fd.label}</span>
                          : <span className="adm-cell-muted">—</span>}
                      </td>
                    );
                  })()}
                  {tab === "sender" && (
                    <td className="adm-date">
                      <strong>{fmtDate(req.itemDetails?.sendingDate) || "—"}</strong>
                    </td>
                  )}
                  {tab === "sender" && (() => {
                    const count = getMatchCountForSender(req);
                    return (
                      <td>
                        {count > 0
                          ? <span className="adm-cell-pill adm-tag-green">✦ {count} available</span>
                          : <span className="adm-cell-muted">—</span>
                        }
                      </td>
                    );
                  })()}
                  {tab === "sender" && (() => {
                    const exp = getSenderExpiry(req.itemDetails?.sendingDate);
                    return (
                      <td>
                        {exp
                          ? <span className="adm-cell-tag" style={{ color: exp.color }}>{exp.label}</span>
                          : <span className="adm-cell-muted">—</span>
                        }
                      </td>
                    );
                  })()}
                  <td>
                    {tab === "sender" && (
                      req.confirmedTraveler ? (
                        <span className="adm-match-badge confirmed adm-match-link" onClick={() => {
                          const t = travelerById.get(req.confirmedTraveler.requestKey);
                          if (t) { setTab("traveler"); openRequest(t); }
                        }}>Confirmed ✓ →</span>
                      ) : req.matchedTravelers?.length > 0 ? (
                        <span className="adm-match-badge tagged adm-match-link" onClick={() => {
                          const t = travelerById.get(req.matchedTravelers[0].requestKey);
                          if (t) { setTab("traveler"); openRequest(t); }
                        }}>{req.matchedTravelers.length} Tagged →</span>
                      ) : <span className="adm-match-badge none">—</span>
                    )}
                    {tab === "traveler" && (
                      req.isConfirmed && req.confirmedForSender ? (
                        <span className="adm-match-badge confirmed adm-match-link" onClick={() => {
                          const s = senderById.get(req.confirmedForSender.senderRequestKey);
                          if (s) { setTab("sender"); openRequest(s); }
                        }}>🔒 Confirmed →</span>
                      ) : req.taggedToSenders?.length > 0 ? (
                        <span className="adm-match-badge tagged adm-match-link" onClick={() => {
                          const s = senderById.get(req.taggedToSenders[0].senderRequestKey);
                          if (s) { setTab("sender"); openRequest(s); }
                        }}>Tagged: {req.taggedToSenders.length} →</span>
                      ) : <span className="adm-match-badge none">—</span>
                    )}
                  </td>
                  <td>
                    <span className={`adm-wa-progress${ra.remaining === 0 ? " adm-wa-done" : ""}`}>
                      {ra.remaining === 0 ? "✓ Done" : `${ra.sent}/${ra.total}`}
                    </span>
                  </td>
                  <td>
                    <button className="adm-view-btn" onClick={() => openRequest(req)}>View / Edit</button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedRequest && (
        <div className="adm-modal-overlay" onClick={closeModal}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>{selectedRequest.flightDetails ? "✈ Traveler" : "📦 Sender"} Request — {selectedRequest.phoneNumber} <PhoneActions phone={selectedRequest.phoneNumber} /></h3>
              <button className="adm-modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="adm-modal-inner-tabs">
              <button className={`adm-inner-tab ${modalTab === "details" ? "active" : ""}`} onClick={() => setModalTab("details")}>Details</button>
              <button className={`adm-inner-tab ${modalTab === "actions" ? "active" : ""}`} onClick={() => setModalTab("actions")}>
                📱 WhatsApp Actions
                {Object.keys(selectedRequest.sentWhatsappActions || {}).length > 0 && (
                  <span className="adm-inner-tab-count">{Object.keys(selectedRequest.sentWhatsappActions).length}</span>
                )}
              </button>
              <button className={`adm-inner-tab ${modalTab === "timeline" ? "active" : ""}`} onClick={() => setModalTab("timeline")}>
                📋 Timeline
              </button>
            </div>

            <div className="adm-modal-body">
              {modalTab === "details" && (<>
              {/* EDIT SECTION */}
              <div className="adm-edit-section">
                <h4>Update Status</h4>
                <div className="adm-edit-row">
                  <label>Status</label>
                  <select
                    value={editFields.status}
                    onChange={(e) => setEditFields((p) => ({ ...p, status: e.target.value }))}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="adm-edit-row">
                  <label>Admin Notes</label>
                  <textarea
                    value={editFields.adminNotes}
                    onChange={(e) => setEditFields((p) => ({ ...p, adminNotes: e.target.value }))}
                    placeholder="Internal notes..."
                    rows={3}
                  />
                </div>
              </div>

              <hr className="adm-modal-divider" />

              {/* FULL DETAILS */}
              <div className="adm-details-section">
                <h4>Request Info</h4>
                {renderField("Phone", selectedRequest.phoneNumber)}
                {renderField("Request ID", selectedRequest.requestId)}
                {renderField("Created At", selectedRequest.createdAt?.slice(0, 19).replace("T", " "))}

                {selectedRequest.from && (
                  <div className="adm-address-block">
                    <p className="adm-address-title">From Address</p>
                    {renderField("House/Flat", selectedRequest.from.houseNumber)}
                    {renderField("Street", selectedRequest.from.street)}
                    {renderField("Area", selectedRequest.from.area)}
                    {renderField("City", selectedRequest.from.city)}
                    {renderField("State", selectedRequest.from.state)}
                    {renderField("Pincode", selectedRequest.from.postalCode)}
                    {selectedRequest.from.latitude && selectedRequest.from.longitude && (
                      <a href={`https://maps.google.com/?q=${selectedRequest.from.latitude},${selectedRequest.from.longitude}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#1a73e8", display: "inline-block", margin: "4px 0 4px" }}>📍 Open From in Maps</a>
                    )}
                  </div>
                )}

                {selectedRequest.to && (
                  <div className="adm-address-block">
                    <p className="adm-address-title">To Address</p>
                    {renderField("House/Flat", selectedRequest.to.houseNumber)}
                    {renderField("Street", selectedRequest.to.street)}
                    {renderField("Area", selectedRequest.to.area)}
                    {renderField("City", selectedRequest.to.city)}
                    {renderField("State", selectedRequest.to.state)}
                    {renderField("Pincode", selectedRequest.to.postalCode)}
                    {selectedRequest.to.latitude && selectedRequest.to.longitude && (
                      <a href={`https://maps.google.com/?q=${selectedRequest.to.latitude},${selectedRequest.to.longitude}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#1a73e8", display: "inline-block", margin: "4px 0 4px" }}>📍 Open To in Maps</a>
                    )}
                  </div>
                )}

                {renderField("Distance", selectedRequest.distance ? selectedRequest.distance + " km" : null)}

                {selectedRequest.itemDetails && (
                  <div className="adm-address-block">
                    <p className="adm-address-title">Item Details</p>
                    {renderField("Item Name", selectedRequest.itemDetails.itemName)}
                    {renderField("Sender Name", selectedRequest.itemDetails.senderName)}
                    {renderField("Total Weight", selectedRequest.itemDetails.totalWeight)}
                    {renderField("Weight (kg)", selectedRequest.itemDetails.weightKg)}
                    {renderField("Weight (g)", selectedRequest.itemDetails.weightGram)}
                    {fmtDate(selectedRequest.itemDetails.sendingDate) && (
                      <div className="adm-detail-row">
                        <span className="adm-detail-label">Sending Date</span>
                        <span className="adm-detail-value"><strong>{fmtDate(selectedRequest.itemDetails.sendingDate)}</strong></span>
                      </div>
                    )}
                    {renderField("Last Pickup Time", selectedRequest.itemDetails.lastPickupTime)}
                    {renderField("Last Drop Time", selectedRequest.itemDetails.lastDropTime)}
                    {renderField("Delivery Option", selectedRequest.itemDetails.deliveryOption)}
                    {renderField("Instructions", selectedRequest.itemDetails.instructions)}
                    {renderField("Item Value", selectedRequest.itemDetails.itemValue)}
                  </div>
                )}

                {/* OTPs — shown on sender after match confirmation */}
                {selectedRequest.confirmedTraveler && (selectedRequest.firstMileOTP || selectedRequest.lastMileOTP) && (
                  <div className="adm-address-block">
                    <p className="adm-address-title">🔐 Delivery OTPs</p>
                    {selectedRequest.firstMileOTP && (
                      <div className="adm-detail-row">
                        <span className="adm-detail-label">First Mile OTP</span>
                        <span className="adm-detail-value adm-otp-value">{selectedRequest.firstMileOTP}</span>
                      </div>
                    )}
                    {selectedRequest.lastMileOTP && (
                      <div className="adm-detail-row">
                        <span className="adm-detail-label">Last Mile OTP</span>
                        <span className="adm-detail-value adm-otp-value">{selectedRequest.lastMileOTP}</span>
                      </div>
                    )}
                  </div>
                )}

                {selectedRequest.flightDetails && (
                  <div className="adm-address-block">
                    <div className="adm-address-title-row">
                      <p className="adm-address-title">Flight Details</p>
                      <label className="adm-verified-check">
                        <input
                          type="checkbox"
                          checked={editFields.flightDetailsVerified || false}
                          onChange={(e) => setEditFields((p) => ({ ...p, flightDetailsVerified: e.target.checked }))}
                        />
                        <span className={editFields.flightDetailsVerified ? "adm-verified-label verified" : "adm-verified-label"}>
                          {editFields.flightDetailsVerified ? "Verified" : "Mark as Verified"}
                        </span>
                      </label>
                    </div>
                    {renderField("Name", `${selectedRequest.flightDetails.firstName} ${selectedRequest.flightDetails.lastName}`)}
                    {renderField("Airline", selectedRequest.flightDetails.airline === "Other" ? selectedRequest.flightDetails.customAirline : selectedRequest.flightDetails.airline)}
                    {fmtDate(selectedRequest.flightDetails.travelDate) && (
                      <div className="adm-detail-row">
                        <span className="adm-detail-label">Travel Date</span>
                        <span className="adm-detail-value"><strong>{fmtDate(selectedRequest.flightDetails.travelDate)}</strong></span>
                      </div>
                    )}
                    {fmtTime(selectedRequest.flightDetails.departureTime) && (
                      <div className="adm-detail-row">
                        <span className="adm-detail-label">Departure</span>
                        <span className="adm-detail-value"><strong>{fmtTime(selectedRequest.flightDetails.departureTime)}</strong></span>
                      </div>
                    )}
                    {selectedRequest.flightDetails.pnr && (
                      <div className="adm-detail-row">
                        <span className="adm-detail-label">PNR</span>
                        <span className="adm-detail-value adm-pnr-reveal">
                          {pnrRevealed
                            ? <strong>{selectedRequest.flightDetails.pnr}</strong>
                            : <span className="adm-pnr-mask">{selectedRequest.flightDetails.pnr.slice(0, 2)}{"•".repeat(Math.max(0, selectedRequest.flightDetails.pnr.length - 2))}</span>
                          }
                          <button className="adm-pnr-toggle" onClick={() => setPnrRevealed(r => !r)}>
                            {pnrRevealed ? "🙈 Hide" : "👁 Reveal"}
                          </button>
                        </span>
                      </div>
                    )}
                    {renderField("Baggage Space", selectedRequest.flightDetails.baggageSpace ? selectedRequest.flightDetails.baggageSpace + " kg" : null)}
                    {renderField("Space Available In", selectedRequest.flightDetails.spaceAvailableWhen)}
                    {renderField("Carry Type", selectedRequest.flightDetails.carryType)}
                    {renderField("Remarks", selectedRequest.flightDetails.remarks)}
                    {selectedRequest.flightDetails.checkParcel && (
                      <div className="adm-detail-row">
                        <span className="adm-detail-label">Check Parcel</span>
                        <span className="adm-detail-value adm-check-parcel-flag">⚠ Wants to check parcel before carrying</span>
                      </div>
                    )}

                    <div className="adm-ops-fields">
                      <p className="adm-ops-fields-title">✏️ Ops Info</p>
                      <div className="adm-edit-row">
                        <label>Flight Duration</label>
                        <input className="adm-edit-input" placeholder="e.g. 2h 30m" value={editFields.flightDuration} onChange={(e) => setEditFields(p => ({ ...p, flightDuration: e.target.value }))} />
                      </div>
                      <div className="adm-edit-row">
                        <label>Flight Type</label>
                        <select className="adm-edit-input" value={editFields.flightType} onChange={(e) => setEditFields(p => ({ ...p, flightType: e.target.value }))}>
                          <option value="">— Select —</option>
                          <option value="Non-Stop">Non-Stop</option>
                          <option value="Indirect">Indirect (With Layover)</option>
                        </select>
                      </div>
                      <div className="adm-edit-row">
                        <label>Flight Number</label>
                        <input className="adm-edit-input" placeholder="e.g. AI 202" value={editFields.flightNumber} onChange={(e) => setEditFields(p => ({ ...p, flightNumber: e.target.value.toUpperCase() }))} />
                      </div>
                      <div className="adm-edit-row">
                        <label>Flight Start Time</label>
                        <input className="adm-edit-input" type="text" placeholder="e.g. 14:30" maxLength={5} value={editFields.flightStartTime} onChange={(e) => setEditFields(p => ({ ...p, flightStartTime: e.target.value }))} />
                      </div>
                      <div className="adm-edit-row">
                        <label>Flight End Time</label>
                        <input className="adm-edit-input" type="text" placeholder="e.g. 16:45" maxLength={5} value={editFields.flightEndTime} onChange={(e) => setEditFields(p => ({ ...p, flightEndTime: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.panDetails && (
                  <div className="adm-address-block">
                    <p className="adm-address-title">PAN Details</p>
                    {renderField("PAN Number", selectedRequest.panDetails.panNumber)}
                    {renderField("Name on PAN", selectedRequest.panDetails.nameOnPan)}
                  </div>
                )}

                {selectedRequest.adminNotes && renderField("Admin Notes", selectedRequest.adminNotes)}

                {/* MATCH TRAVELER SECTION — only for sender */}
                {!selectedRequest.flightDetails && (() => {
                  const isCompleted = selectedRequest.status === "COMPLETED" ||
                    (selectedRequest.LastMileStatus || "").toLowerCase() === "completed";

                  // When delivery is done — show a clean read-only summary, no actions
                  if (isCompleted) {
                    const ct = selectedRequest.confirmedTraveler
                      ? travelerById.get(selectedRequest.confirmedTraveler.requestKey)
                      : null;
                    return (
                      <div className="adm-match-section adm-match-completed" style={{ pointerEvents: "none" }}>
                        <div className="adm-match-title">
                          <span>Match Traveler</span>
                          <span className="adm-match-done-label">✓ Delivery Completed</span>
                        </div>
                        {selectedRequest.confirmedTraveler && (
                          <div className="adm-match-confirmed-card">
                            <div className="adm-match-confirmed-badge">Delivered ✓</div>
                            <div className="adm-match-traveler-info">
                              <span className="adm-match-phone">{selectedRequest.confirmedTraveler.phone}</span>
                              {ct && (
                                <>
                                  <span className="adm-match-route">{ct.from?.city} → {ct.to?.city}</span>
                                  {ct.flightDetails && (
                                    <span className="adm-match-flight">
                                      {ct.flightDetails.airline} · {fmtDate(ct.flightDetails.travelDate) || ct.flightDetails.travelDate} · {fmtTime(ct.flightDetails.departureTime) || ct.flightDetails.departureTime}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                  <div className="adm-match-section">
                    <div className="adm-match-title">
                      <span>Match Traveler</span>
                      {matchSaving && <span className="adm-match-saving">Saving...</span>}
                    </div>

                    {/* Already confirmed */}
                    {selectedRequest.confirmedTraveler ? (() => {
                      const ct = travelerById.get(selectedRequest.confirmedTraveler.requestKey);
                      return (
                        <div className="adm-match-confirmed-card">
                          <div className="adm-match-confirmed-badge">Confirmed ✓</div>
                          <div className="adm-match-traveler-info">
                            <span className="adm-match-phone">{selectedRequest.confirmedTraveler.phone}</span>
                            {ct && (
                              <>
                                <span className="adm-match-route">{ct.from?.city} → {ct.to?.city}</span>
                                {ct.flightDetails && (
                                  <span className="adm-match-flight">
                                    {ct.flightDetails.airline} · {fmtDate(ct.flightDetails.travelDate) || ct.flightDetails.travelDate} · {fmtTime(ct.flightDetails.departureTime) || ct.flightDetails.departureTime}
                                    {(() => {
                                      const fd = getFlightDaysLeft(ct.flightDetails.travelDate, ct.flightDetails.departureTime);
                                      return fd ? (
                                        <span className="adm-flight-days" style={{ color: fd.color, background: fd.color + "18" }}>
                                          {fd.label}
                                        </span>
                                      ) : null;
                                    })()}
                                  </span>
                                )}
                                <div className="adm-match-dist-row" style={{ marginTop: 4 }}>
                                  {renderDistRow(ct?.requestId)}
                                </div>
                              </>
                            )}
                          </div>
                          <button className="adm-match-links-btn" onClick={sendConfirmLinks} disabled={matchSaving}>
                            Send Links
                          </button>
                          <button className="adm-match-remove-btn" onClick={removeConfirm} disabled={matchSaving}>
                            Remove Confirm
                          </button>
                        </div>
                      );
                    })() : (() => {
                      const matches = modalMatchingTravelers;
                      if (matches.length === 0) return (
                        <div className="adm-match-empty">No matching travelers found for {selectedRequest.from?.city} → {selectedRequest.to?.city}</div>
                      );
                      return matches.map((t) => {
                        const isTagged = (selectedRequest.matchedTravelers || []).some((m) => m.requestKey === t.requestId);
                        return (
                          <div key={t.requestId} className={`adm-match-card ${isTagged ? "tagged" : ""} ${t.isConfirmed ? "locked" : ""}`}>
                            <div className="adm-match-card-left">
                              <span className="adm-match-phone">{t.phoneNumber}</span>
                              <span className="adm-match-route">{t.from?.city} → {t.to?.city}</span>
                              {t.flightDetails && (
                                <span className="adm-match-flight">
                                  {t.flightDetails.airline}
                                  <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: t.flightDetailsVerified ? "#0f9d58" : "#e53935" }}>
                                    {t.flightDetailsVerified ? "✓ Verified" : "✗ Not Verified"}
                                  </span>
                                  {(() => {
                                    const fd = getFlightDaysLeft(t.flightDetails.travelDate, t.flightDetails.departureTime);
                                    return fd ? (
                                      <span className="adm-flight-days" style={{ color: fd.color, background: fd.color + "18" }}>
                                        {fd.label}
                                      </span>
                                    ) : null;
                                  })()}
                                </span>
                              )}
                              <div className="adm-match-dist-row">
                                {t.suitability && (
                                  <span className="adm-suitability-badge" style={{ color: t.suitability.color, background: t.suitability.color + "18", border: `1px solid ${t.suitability.color}44` }}>
                                    {t.suitability.label}
                                  </span>
                                )}
                                {renderDistRow(t.requestId, t.fromDist, t.toDist)}
                                {t.taggedToSenders?.length > 0 && (
                                  <span className="adm-match-other-tag">Also tagged: {t.taggedToSenders.length} sender(s)</span>
                                )}
                              </div>
                            </div>
                            <div className="adm-match-card-actions">
                              {t.isConfirmed ? (
                                <span className="adm-match-locked">🔒 Locked</span>
                              ) : isTagged ? (
                                <>
                                  <button className="adm-match-confirm-btn" onClick={() => confirmTraveler(t)} disabled={matchSaving}>Confirm</button>
                                  <button className="adm-match-untag-btn" onClick={() => removeTag(t)} disabled={matchSaving}>Remove</button>
                                </>
                              ) : (
                                <button className="adm-match-tag-btn" onClick={() => tagTraveler(t)} disabled={matchSaving}>Tag</button>
                              )}
                              <button className="adm-match-details-btn" onClick={() => setTravelerPreview(t)}>Details</button>
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {/* Manual search by phone number */}
                    {!selectedRequest.confirmedTraveler && (
                      <div style={{ marginTop: 12, borderTop: "1px solid #eee", paddingTop: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Manual Search
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
                            placeholder="Enter traveler phone number"
                            value={manualSearchPhone}
                            onChange={(e) => {
                              setManualSearchPhone(e.target.value);
                              setManualSearchResults(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const q = manualSearchPhone.trim().replace(/\s+/g, "");
                                if (!q) { setManualSearchResults([]); return; }
                                const sendingDate = selectedRequest.itemDetails?.sendingDate || null;
                                const enriched = travelerRequests
                                  .filter((t) => (t.phoneNumber || "").replace(/\s+/g, "").includes(q))
                                  .map((t) => {
                                    const fromDist = haversine(selectedRequest.from?.latitude, selectedRequest.from?.longitude, t.from?.latitude, t.from?.longitude);
                                    const toDist   = haversine(selectedRequest.to?.latitude, selectedRequest.to?.longitude, t.to?.latitude, t.to?.longitude);
                                    let suitability = null;
                                    if (sendingDate && t.flightDetails?.travelDate) {
                                      const daysLate = Math.round((new Date(t.flightDetails.travelDate) - new Date(sendingDate)) / 86400000);
                                      if (daysLate <= 0) suitability = { label: "Suitable", color: "#0f9d58" };
                                      else if (daysLate <= 4) suitability = { label: `Late by ${daysLate} day${daysLate > 1 ? "s" : ""}`, color: "#f0a500" };
                                      else suitability = { label: `Too late (${daysLate}d)`, color: "#e53935" };
                                    }
                                    return { ...t, fromDist, toDist, suitability };
                                  });
                                setManualSearchResults(enriched);
                                if (enriched.length > 0) loadDistancesForMatches(selectedRequest, enriched);
                              }
                            }}
                          />
                          <button
                            style={{ padding: "7px 14px", borderRadius: 8, background: "#1a73e8", color: "#fff", border: "none", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                            onClick={() => {
                              const q = manualSearchPhone.trim().replace(/\s+/g, "");
                              if (!q) { setManualSearchResults([]); return; }
                              const sendingDate = selectedRequest.itemDetails?.sendingDate || null;
                              const enriched = travelerRequests
                                .filter((t) => (t.phoneNumber || "").replace(/\s+/g, "").includes(q))
                                .map((t) => {
                                  const fromDist = haversine(selectedRequest.from?.latitude, selectedRequest.from?.longitude, t.from?.latitude, t.from?.longitude);
                                  const toDist   = haversine(selectedRequest.to?.latitude, selectedRequest.to?.longitude, t.to?.latitude, t.to?.longitude);
                                  let suitability = null;
                                  if (sendingDate && t.flightDetails?.travelDate) {
                                    const daysLate = Math.round((new Date(t.flightDetails.travelDate) - new Date(sendingDate)) / 86400000);
                                    if (daysLate <= 0) suitability = { label: "Suitable", color: "#0f9d58" };
                                    else if (daysLate <= 4) suitability = { label: `Late by ${daysLate} day${daysLate > 1 ? "s" : ""}`, color: "#f0a500" };
                                    else suitability = { label: `Too late (${daysLate}d)`, color: "#e53935" };
                                  }
                                  return { ...t, fromDist, toDist, suitability };
                                });
                              setManualSearchResults(enriched);
                              if (enriched.length > 0) loadDistancesForMatches(selectedRequest, enriched);
                            }}
                          >
                            Search
                          </button>
                        </div>

                        {manualSearchResults !== null && manualSearchResults.length === 0 && (
                          <div style={{ fontSize: 13, color: "#999", marginTop: 8, padding: "8px 10px", background: "#f9f9f9", borderRadius: 8 }}>
                            No traveler found for "{manualSearchPhone}"
                          </div>
                        )}

                        {manualSearchResults !== null && manualSearchResults.map((t) => {
                          const isTagged = (selectedRequest.matchedTravelers || []).some((m) => m.requestKey === t.requestId);
                          return (
                            <div key={t.requestId} className={`adm-match-card ${isTagged ? "tagged" : ""} ${t.isConfirmed ? "locked" : ""}`} style={{ marginTop: 8 }}>
                              <div className="adm-match-card-left">
                                <span className="adm-match-phone">{t.phoneNumber}</span>
                                <span style={{ fontSize: 11, color: "#888", fontStyle: "italic" }}>Manual match</span>
                                <span className="adm-match-route">{t.from?.city} → {t.to?.city}</span>
                                {t.flightDetails && (
                                  <span className="adm-match-flight">
                                    {t.flightDetails.airline}
                                    <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: t.flightDetailsVerified ? "#0f9d58" : "#e53935" }}>
                                      {t.flightDetailsVerified ? "✓ Verified" : "✗ Not Verified"}
                                    </span>
                                    {(() => {
                                      const fd = getFlightDaysLeft(t.flightDetails.travelDate, t.flightDetails.departureTime);
                                      return fd ? (
                                        <span className="adm-flight-days" style={{ color: fd.color, background: fd.color + "18" }}>
                                          {fd.label}
                                        </span>
                                      ) : null;
                                    })()}
                                  </span>
                                )}
                                <div className="adm-match-dist-row">
                                  {t.suitability && (
                                    <span className="adm-suitability-badge" style={{ color: t.suitability.color, background: t.suitability.color + "18", border: `1px solid ${t.suitability.color}44` }}>
                                      {t.suitability.label}
                                    </span>
                                  )}
                                  {renderDistRow(t.requestId, t.fromDist, t.toDist)}
                                </div>
                              </div>
                              <div className="adm-match-card-actions">
                                {t.isConfirmed ? (
                                  <span className="adm-match-locked">🔒 Locked</span>
                                ) : isTagged ? (
                                  <>
                                    <button className="adm-match-confirm-btn" onClick={() => confirmTraveler(t)} disabled={matchSaving}>Confirm</button>
                                    <button className="adm-match-untag-btn" onClick={() => removeTag(t)} disabled={matchSaving}>Remove</button>
                                  </>
                                ) : (
                                  <button className="adm-match-tag-btn" onClick={() => tagTraveler(t)} disabled={matchSaving}>Tag</button>
                                )}
                                <button className="adm-match-details-btn" onClick={() => setTravelerPreview(t)}>Details</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  );
                })()}
              </div>
              </>)}

              {/* WHATSAPP ACTIONS TAB */}
              {modalTab === "actions" && (() => {
                const isTraveler = !!selectedRequest.flightDetails;
                const seqActions = isTraveler ? TRAVELER_ACTIONS : SENDER_ACTIONS;
                const sent = selectedRequest.sentWhatsappActions || {};
                const isSent = (key) => !!sent[key]?.sent;
                const waBlocked = !!selectedRequest.whatsappNotActive && !selectedRequest.alternateWhatsappNumber;
                const isEnabled = (idx) => {
                  if (waBlocked) return false;
                  if (idx === 0) return true;
                  if (!isTraveler && idx >= 1 && !selectedRequest.confirmedTraveler) return false;
                  if (isTraveler && idx >= 1 && !selectedRequest.isConfirmed) return false;
                  return isSent(seqActions[idx - 1].key);
                };
                const extraActions = isTraveler ? [...TRAVELER_ONLY_ACTIONS, ...COMMON_ACTIONS] : COMMON_ACTIONS;
                return (
                  <div className="adm-wa-tab">
                    {!isTraveler && !selectedRequest.confirmedTraveler && (
                      <div style={{ background: "#fff8e1", border: "1px solid #f0a500", borderRadius: 6, padding: "8px 12px", marginBottom: 10, fontSize: 13, color: "#7a5c00" }}>
                        Actions 2–6 are locked until a Traveler is confirmed for this sender. Please assign a traveler from the <strong>Match</strong> tab first.
                      </div>
                    )}
                    {isTraveler && !selectedRequest.isConfirmed && (
                      <div style={{ background: "#fff8e1", border: "1px solid #f0a500", borderRadius: 6, padding: "8px 12px", marginBottom: 10, fontSize: 13, color: "#7a5c00" }}>
                        Actions 2–5 are locked until this Traveler is confirmed by a Sender. Please confirm from the <strong>Match</strong> tab first.
                      </div>
                    )}
                    <label className="adm-wa-blocked-check">
                      <input
                        type="checkbox"
                        checked={waBlocked}
                        onChange={async (e) => {
                          const val = e.target.checked;
                          if (val) {
                            const ok = window.confirm("Mark this number as not active on WhatsApp?\n\nThis will reset all sent actions so you can start fresh on the alternate number.");
                            if (!ok) return;
                            await updateDoc(selectedRequest.docRef, { whatsappNotActive: true, sentWhatsappActions: {}, updatedAt: new Date().toISOString() });
                            const updater = (list) => list.map((r) => r.requestId === selectedRequest.requestId && r.phoneNumber === selectedRequest.phoneNumber ? { ...r, whatsappNotActive: true, sentWhatsappActions: {} } : r);
                            setSenderRequests((p) => updater(p));
                            setTravelerRequests((p) => updater(p));
                            setSelectedRequest((p) => ({ ...p, whatsappNotActive: true, sentWhatsappActions: {} }));
                          } else {
                            const ok = window.confirm("Mark this number as active on WhatsApp?");
                            if (!ok) return;
                            await updateDoc(selectedRequest.docRef, { whatsappNotActive: false, updatedAt: new Date().toISOString() });
                            const updater = (list) => list.map((r) => r.requestId === selectedRequest.requestId && r.phoneNumber === selectedRequest.phoneNumber ? { ...r, whatsappNotActive: false } : r);
                            setSenderRequests((p) => updater(p));
                            setTravelerRequests((p) => updater(p));
                            setSelectedRequest((p) => ({ ...p, whatsappNotActive: false }));
                          }
                        }}
                      />
                      <span>Number not active on WhatsApp</span>
                    </label>
                    {waBlocked && (
                      <div className="adm-wa-alt-section">
                        <div className="adm-wa-blocked-msg">⚠ All actions disabled — number not on WhatsApp</div>
                        <div className="adm-wa-alt-row">
                          <input
                            className="adm-wa-alt-input"
                            type="tel"
                            placeholder="Alternate WhatsApp number (10 digits)"
                            value={altNumInput}
                            maxLength={10}
                            onChange={(e) => setAltNumInput(e.target.value.replace(/\D/g, ""))}
                          />
                          <button
                            className="adm-wa-alt-save-btn"
                            onClick={async () => {
                              const val = altNumInput.trim();
                              await updateDoc(selectedRequest.docRef, { alternateWhatsappNumber: val || null, updatedAt: new Date().toISOString() });
                              const updater = (list) => list.map((r) => r.requestId === selectedRequest.requestId && r.phoneNumber === selectedRequest.phoneNumber ? { ...r, alternateWhatsappNumber: val || null } : r);
                              setSenderRequests((p) => updater(p));
                              setTravelerRequests((p) => updater(p));
                              setSelectedRequest((p) => ({ ...p, alternateWhatsappNumber: val || null }));
                            }}
                          >
                            Save
                          </button>
                          {selectedRequest.alternateWhatsappNumber && (
                            <span className="adm-wa-alt-active">✓ Using alternate number</span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="adm-wa-section-title">Sequential Actions</div>
                    <div className="adm-wa-list">
                      {seqActions.map((action, idx) => {
                        const done = isSent(action.key);
                        const enabled = isEnabled(idx);
                        return (
                          <div key={action.key} className={`adm-wa-action ${done ? "done" : ""} ${!enabled && !done ? "locked" : ""}`}>
                            <div className="adm-wa-action-info">
                              <span className="adm-wa-action-label">{action.label}</span>
                              {done && <span className="adm-wa-sent-time">✓ Sent {sent[action.key].sentAt?.slice(0,10)}</span>}
                            </div>
                            {!done && (
                              <button
                                className="adm-wa-send-btn"
                                disabled={!enabled}
                                onClick={() => openWaModal(action.key, selectedRequest)}
                              >
                                {enabled ? "Send →" : "🔒"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="adm-wa-section-title" style={{ marginTop: 20 }}>Common Actions</div>
                    <div className="adm-wa-list">
                      {extraActions.map((action) => {
                        const done = isSent(action.key);
                        return (
                          <div key={action.key} className={`adm-wa-action ${done ? "done" : ""}`}>
                            <div className="adm-wa-action-info">
                              <span className="adm-wa-action-label">{action.label}</span>
                              {done && <span className="adm-wa-sent-time">✓ Sent {sent[action.key].sentAt?.slice(0,10)}</span>}
                            </div>
                            <button
                              className="adm-wa-send-btn"
                              disabled={waBlocked}
                              onClick={() => openWaModal(action.key, selectedRequest)}
                            >
                              Send →
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* TIMELINE TAB */}
              {modalTab === "timeline" && (() => {
                const events = [];
                // Created
                if (selectedRequest.createdAt) events.push({ time: selectedRequest.createdAt, label: "Request Created", icon: "🆕" });
                // Match events
                if (selectedRequest.confirmedTraveler) {
                  // We don't have exact match timestamp, but updatedAt after match is close
                  events.push({ time: null, label: `Matched with traveler ${selectedRequest.confirmedTraveler.phone}`, icon: "🤝" });
                }
                if (selectedRequest.confirmedForSender) {
                  events.push({ time: null, label: `Confirmed for sender ${selectedRequest.confirmedForSender.senderPhone}`, icon: "🤝" });
                }
                // WhatsApp actions
                const sent = selectedRequest.sentWhatsappActions || {};
                const isTraveler = !!selectedRequest.flightDetails;
                const allActions = [...(isTraveler ? TRAVELER_ACTIONS : SENDER_ACTIONS), ...COMMON_ACTIONS, ...TRAVELER_ONLY_ACTIONS];
                Object.entries(sent).forEach(([key, val]) => {
                  if (val?.sent) {
                    const action = allActions.find((a) => a.key === key);
                    events.push({ time: val.sentAt, label: `WhatsApp: ${action?.label || key}`, icon: "📱" });
                  }
                });
                // Status changes (from updatedAt — best we have)
                if (selectedRequest.updatedAt && selectedRequest.updatedAt !== selectedRequest.createdAt) {
                  events.push({ time: selectedRequest.updatedAt, label: `Last Updated (Status: ${selectedRequest.status || "NEW_ORDER"})`, icon: "✏️" });
                }
                // Flight verified
                if (selectedRequest.flightDetailsVerified) {
                  events.push({ time: null, label: "Flight Details Verified", icon: "✅" });
                }
                // Sort by time (nulls at end)
                events.sort((a, b) => {
                  if (!a.time && !b.time) return 0;
                  if (!a.time) return 1;
                  if (!b.time) return -1;
                  return a.time.localeCompare(b.time);
                });
                return (
                  <div className="adm-timeline">
                    {events.length === 0 ? (
                      <div className="adm-empty">No activity recorded yet.</div>
                    ) : events.map((ev, i) => (
                      <div key={i} className="adm-timeline-item">
                        <div className="adm-timeline-dot">{ev.icon}</div>
                        <div className="adm-timeline-content">
                          <span className="adm-timeline-label">{ev.label}</span>
                          {ev.time && <span className="adm-timeline-time">{ev.time.slice(0, 10)} · {fmtTime(ev.time.slice(11, 16)) || ev.time.slice(11, 16)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* SAVE — always at bottom */}
              <div className="adm-save-row" style={{ padding: "16px 0 4px" }}>
                <button className="adm-save-btn" onClick={saveChanges} disabled={saving}>
                  {saving ? "Saving..." : "💾 Save Changes"}
                </button>
                {saveMsg && (
                  <span className={`adm-save-msg ${saveMsg.startsWith("Error") || saveMsg.startsWith("⚠️") ? "error" : "success"}`}>
                    {saveMsg}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRAVELER PREVIEW MODAL */}
      {travelerPreview && (
        <div className="adm-modal-overlay" style={{ zIndex: 1050 }} onClick={() => setTravelerPreview(null)}>
          <div className="adm-tpreview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>✈ Traveler — {travelerPreview.phoneNumber}</h3>
              <button className="adm-modal-close" onClick={() => setTravelerPreview(null)}>✕</button>
            </div>
            <div className="adm-tpreview-body">
              {renderField("Phone", travelerPreview.phoneNumber)}
              {renderField("Status", travelerPreview.status || travelerPreview.LastMileStatus || "—")}
              {renderField("Route", travelerPreview.from?.city && travelerPreview.to?.city ? `${travelerPreview.from.city} → ${travelerPreview.to.city}` : null)}
              {travelerPreview.flightDetails && (<>
                <div className="adm-tpreview-section">Flight Details</div>
                {renderField("Name", `${travelerPreview.flightDetails.firstName || ""} ${travelerPreview.flightDetails.lastName || ""}`.trim())}
                {renderField("Airline", travelerPreview.flightDetails.airline === "Other" ? travelerPreview.flightDetails.customAirline : travelerPreview.flightDetails.airline)}
                {fmtDate(travelerPreview.flightDetails.travelDate) && (
                  <div className="adm-detail-row">
                    <span className="adm-detail-label">Travel Date</span>
                    <span className="adm-detail-value"><strong>{fmtDate(travelerPreview.flightDetails.travelDate)}</strong></span>
                  </div>
                )}
                {fmtTime(travelerPreview.flightDetails.departureTime) && (
                  <div className="adm-detail-row">
                    <span className="adm-detail-label">Departure</span>
                    <span className="adm-detail-value"><strong>{fmtTime(travelerPreview.flightDetails.departureTime)}</strong></span>
                  </div>
                )}
                {renderField("Baggage Space", travelerPreview.flightDetails.baggageSpace ? travelerPreview.flightDetails.baggageSpace + " kg" : null)}
                {renderField("Space Available In", travelerPreview.flightDetails.spaceAvailableWhen)}
                {renderField("Carry Type", travelerPreview.flightDetails.carryType)}
                {renderField("Remarks", travelerPreview.flightDetails.remarks)}
                {travelerPreview.flightDetails.checkParcel && (
                  <div className="adm-detail-row">
                    <span className="adm-detail-label">Check Parcel</span>
                    <span className="adm-detail-value adm-check-parcel-flag">⚠ Wants to check parcel before carrying</span>
                  </div>
                )}
                {renderField("Flight Verified", travelerPreview.flightDetailsVerified ? "✅ Yes" : "❌ No")}
                {travelerPreview.opsFlightInfo && (<>
                  <div className="adm-tpreview-section">Ops Info</div>
                  {travelerPreview.opsFlightInfo.flightDuration && (
                    <div className="adm-detail-row"><span className="adm-detail-label">Duration</span><span className="adm-detail-value"><strong>{travelerPreview.opsFlightInfo.flightDuration}</strong></span></div>
                  )}
                  {travelerPreview.opsFlightInfo.flightType && (
                    <div className="adm-detail-row"><span className="adm-detail-label">Flight Type</span><span className="adm-detail-value"><strong>{travelerPreview.opsFlightInfo.flightType}</strong></span></div>
                  )}
                  {travelerPreview.opsFlightInfo.flightNumber && (
                    <div className="adm-detail-row"><span className="adm-detail-label">Flight Number</span><span className="adm-detail-value"><strong>{travelerPreview.opsFlightInfo.flightNumber}</strong></span></div>
                  )}
                  {travelerPreview.opsFlightInfo.flightStartTime && (
                    <div className="adm-detail-row"><span className="adm-detail-label">Start Time</span><span className="adm-detail-value"><strong>{fmtTime(travelerPreview.opsFlightInfo.flightStartTime)}</strong></span></div>
                  )}
                  {travelerPreview.opsFlightInfo.flightEndTime && (
                    <div className="adm-detail-row"><span className="adm-detail-label">End Time</span><span className="adm-detail-value"><strong>{fmtTime(travelerPreview.opsFlightInfo.flightEndTime)}</strong></span></div>
                  )}
                </>)}
              </>)}
              {travelerPreview.from && (<>
                <div className="adm-tpreview-section">From Address</div>
                {(() => {
                  const f = travelerPreview.from;
                  const parts = [f.houseNumber, f.street, f.area, f.city, f.state, f.postalCode].filter(Boolean);
                  return parts.length > 0
                    ? <div style={{ fontSize: 13, color: "#444", marginBottom: 4 }}>{parts.join(", ")}</div>
                    : <div style={{ fontSize: 13, color: "#aaa", marginBottom: 4 }}>Address details not available</div>;
                })()}
                {travelerPreview.from.latitude && travelerPreview.from.longitude && (
                  <a href={`https://maps.google.com/?q=${travelerPreview.from.latitude},${travelerPreview.from.longitude}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#1a73e8", display: "inline-block", margin: "4px 0 8px" }}>📍 Open From in Maps</a>
                )}
              </>)}
              {travelerPreview.to && (<>
                <div className="adm-tpreview-section">To Address</div>
                {(() => {
                  const t = travelerPreview.to;
                  const parts = [t.houseNumber, t.street, t.area, t.city, t.state, t.postalCode].filter(Boolean);
                  return parts.length > 0
                    ? <div style={{ fontSize: 13, color: "#444", marginBottom: 4 }}>{parts.join(", ")}</div>
                    : <div style={{ fontSize: 13, color: "#aaa", marginBottom: 4 }}>Address details not available</div>;
                })()}
                {travelerPreview.to.latitude && travelerPreview.to.longitude && (
                  <a href={`https://maps.google.com/?q=${travelerPreview.to.latitude},${travelerPreview.to.longitude}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#1a73e8", display: "inline-block", margin: "4px 0 8px" }}>📍 Open To in Maps</a>
                )}
              </>)}
              {travelerPreview.panDetails && (<>
                <div className="adm-tpreview-section">PAN Details</div>
                {renderField("PAN", travelerPreview.panDetails.panNumber)}
                {renderField("Name on PAN", travelerPreview.panDetails.nameOnPan)}
              </>)}
              {travelerPreview.adminNotes && renderField("Admin Notes", travelerPreview.adminNotes)}
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP MESSAGE MODAL */}
      {waModal && (
        <div className="adm-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setWaModal(null)}>
          <div className="adm-wa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>📱 Send WhatsApp Message</h3>
              <button className="adm-modal-close" onClick={() => setWaModal(null)}>✕</button>
            </div>
            <div style={{ padding: "20px 24px 24px" }}>
              <p className="adm-wa-phone-label">
                To: <strong>+91 {waModal.phone}</strong>
                {waModal.isAlternate && (
                  <span className="adm-wa-alt-badge"> (Alternate — original: {waModal.originalPhone})</span>
                )}
              </p>
              <textarea
                className="adm-wa-textarea"
                value={waModal.text}
                onChange={(e) => setWaModal((p) => ({ ...p, text: e.target.value }))}
                rows={10}
              />
              <div className="adm-save-row" style={{ marginTop: 16 }}>
                <button className="adm-wa-open-btn" onClick={sendWhatsAppAction} disabled={waSending}>
                  {waSending ? "Opening..." : "Open WhatsApp & Mark Sent →"}
                </button>
                <button className="adm-wa-cancel-btn" onClick={() => setWaModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER EDIT MODAL */}
      {selectedUser && (
        <div className="adm-modal-overlay" onClick={closeUserModal}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>User — {selectedUser.phoneNumber || selectedUser.userId} <PhoneActions phone={selectedUser.phoneNumber || selectedUser.userId} /></h3>
              <button className="adm-modal-close" onClick={closeUserModal}>✕</button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-edit-section">
                <h4>Edit User</h4>
                <div className="adm-edit-row">
                  <label>Role</label>
                  <select value={userEditFields.role} onChange={(e) => setUserEditFields((p) => ({ ...p, role: e.target.value }))}>
                    <option value="">— No Role —</option>
                    <option value="Sender">Sender</option>
                    <option value="Traveler">Traveler</option>
                  </select>
                </div>
                <div className="adm-edit-row">
                  <label>Request Type</label>
                  <select value={userEditFields.requestType} onChange={(e) => setUserEditFields((p) => ({ ...p, requestType: e.target.value }))}>
                    <option value="">— None —</option>
                    <option value="SenderRequest">SenderRequest</option>
                    <option value="TravelerRequest">TravelerRequest</option>
                  </select>
                </div>
                <div className="adm-edit-row">
                  <label>Auth Completed</label>
                  <select value={userEditFields.authCompleted ? "true" : "false"} onChange={(e) => setUserEditFields((p) => ({ ...p, authCompleted: e.target.value === "true" }))}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="adm-edit-row">
                  <label>Admin Notes</label>
                  <textarea
                    value={userEditFields.adminNotes}
                    onChange={(e) => setUserEditFields((p) => ({ ...p, adminNotes: e.target.value }))}
                    placeholder="Internal notes..."
                    rows={3}
                  />
                </div>
                <div className="adm-save-row">
                  <button className="adm-save-btn" onClick={saveUserChanges} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  {saveMsg && (
                    <span className={`adm-save-msg ${saveMsg.startsWith("Error") ? "error" : "success"}`}>
                      {saveMsg}
                    </span>
                  )}
                </div>
              </div>
              <hr className="adm-modal-divider" />
              <div className="adm-details-section">
                <h4>User Info</h4>
                {renderField("Phone", selectedUser.phoneNumber || selectedUser.userId)}
                {renderField("Signed Up", selectedUser.createdAt?.slice(0, 19).replace("T", " "))}
                {renderField("Last Login", selectedUser.lastLoginAt?.slice(0, 19).replace("T", " "))}
                {renderField("Latest Request Key", selectedUser.latestRequestKey)}
                {selectedUser.adminNotes && renderField("Admin Notes", selectedUser.adminNotes)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

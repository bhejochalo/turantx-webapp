import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lottie from "lottie-react";
import lottieEarning from "../assets/lottie-earning.json";
import lottieVerified from "../assets/lottie-verified.json";
import lottieTiredWoman from "../assets/lottie-tired-woman.json";
import lottieHandshake from "../assets/lottie-handshake.json";
import lottieCelebration from "../assets/lottie-celebration.json";
import logo from "../assets/turantx-logo.png";
import "./DemoPage.css";

gsap.registerPlugin(ScrollTrigger);


const SCENES = [
  "Discovery", "Registration", "Problem", "Matching",
  "How It Works", "Handover", "Journey", "Delivery", "Payment", "Ending"
];

export default function DemoPage() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const barRef = useRef(null);
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);

    // GSAP ScrollTrigger needs the document to be taller than the viewport.
    // The global index.css sets html/body/#root to height:100%, which caps the
    // scroll container at viewport height and breaks pin calculations.
    const rootEl = document.getElementById("root");
    const saved = {
      html: document.documentElement.style.height,
      body: document.body.style.height,
      root: rootEl ? rootEl.style.height : "",
    };
    document.documentElement.style.height = "auto";
    document.body.style.height = "auto";
    if (rootEl) rootEl.style.height = "auto";

    // Lottie animations can shift layout after first paint — re-measure then.
    const t = setTimeout(() => ScrollTrigger.refresh(), 600);

    return () => {
      document.documentElement.style.height = saved.html;
      document.body.style.height = saved.body;
      if (rootEl) rootEl.style.height = saved.root;
      clearTimeout(t);
    };
  }, []);

  const scrollToScene = (idx) => {
    const el = document.querySelector(`.s${idx + 1}`);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {

      /* ── Progress bar ─────────────────────── */
      gsap.set(barRef.current, { scaleX: 0, transformOrigin: "left center" });
      gsap.to(barRef.current, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { start: "top top", end: "bottom bottom", scrub: 0.4 },
      });

      /* ── Dot nav ──────────────────────────── */
      SCENES.forEach((_, i) => {
        ScrollTrigger.create({
          trigger: `.s${i + 1}`,
          start: "top 55%",
          end: "bottom 45%",
          onEnter: () => setActiveDot(i),
          onEnterBack: () => setActiveDot(i),
        });
      });

      /* ═══════════════════════════════════════
         SCENE 1 — Discovery
      ═══════════════════════════════════════ */
      gsap.timeline({
        scrollTrigger: {
          trigger: ".s1", start: "top top", end: "+=700",
          pin: true, scrub: 1.3, anticipatePin: 1,
        },
      })
        .from(".s1-badge",    { y: -24, opacity: 0, duration: 0.25 })
        .from(".s1-heading",  { y: 64, opacity: 0, duration: 0.45 }, 0.08)
        .from(".s1-sub",      { y: 40, opacity: 0, duration: 0.35 }, 0.22)
        .from(".s1-hint",     { y: 20, opacity: 0, duration: 0.25 }, 0.38)
        .from(".s1-traveler", { x: -80, opacity: 0, duration: 0.45 }, 0.04)
        .from(".s1-phone",    { y: 90, opacity: 0, duration: 0.45 }, 0.14)
        .from(".s1-notif",    { y: -52, opacity: 0, scale: 0.82, duration: 0.38 }, 0.34);

      /* ═══════════════════════════════════════
         SCENE 2 — Registration
      ═══════════════════════════════════════ */
      gsap.timeline({
        scrollTrigger: {
          trigger: ".s2", start: "top top", end: "+=950",
          pin: true, scrub: 1.3, anticipatePin: 1,
        },
      })
        .from(".s2-heading",  { y: 56, opacity: 0, duration: 0.3 })
        .from(".s2-sub",      { y: 32, opacity: 0, duration: 0.28 }, 0.15)
        .from(".s2-traveler", { x: 80, opacity: 0, duration: 0.35 }, 0.06)
        .from(".s2-phone",    { y: 100, opacity: 0, duration: 0.42 }, 0.1)
        .from(".s2-f1",       { scaleX: 0, opacity: 0, duration: 0.22, transformOrigin: "left center" }, 0.36)
        .from(".s2-f2",       { scaleX: 0, opacity: 0, duration: 0.22, transformOrigin: "left center" }, 0.52)
        .from(".s2-f3",       { scaleX: 0, opacity: 0, duration: 0.22, transformOrigin: "left center" }, 0.66)
        .from(".s2-check",    { scale: 0, opacity: 0, duration: 0.22, ease: "back.out(2.5)" }, 0.80)
        .from(".s2-footer",   { opacity: 0, y: 14, duration: 0.18 }, 0.92);

      /* ═══════════════════════════════════════
         SCENE 3 — Problem
      ═══════════════════════════════════════ */
      gsap.timeline({
        scrollTrigger: {
          trigger: ".s3", start: "top top", end: "+=650",
          pin: true, scrub: 1.3, anticipatePin: 1,
        },
      })
        .from(".s3-heading",  { y: 56, opacity: 0, duration: 0.3 })
        .from(".s3-sub",      { y: 32, opacity: 0, duration: 0.25 }, 0.15)
        .from(".s3-sender",   { x: -80, opacity: 0, duration: 0.4 }, 0.08)
        .from(".s3-p1",       { x: 70, opacity: 0, duration: 0.28 }, 0.32)
        .from(".s3-p2",       { x: 70, opacity: 0, duration: 0.28 }, 0.47)
        .from(".s3-p3",       { x: 70, opacity: 0, duration: 0.28 }, 0.62)
        .from(".s3-tag",      { opacity: 0, y: 10, duration: 0.18 }, 0.70)
        .from(".s3-arrow",    { opacity: 0, y: 18, duration: 0.22 }, 0.75)
        .from(".s3-solution", { y: 22, opacity: 0, scale: 0.88, duration: 0.28 }, 0.84);

      /* ═══════════════════════════════════════
         SCENE 4 — Matching
      ═══════════════════════════════════════ */
      gsap.timeline({
        scrollTrigger: {
          trigger: ".s4", start: "top top", end: "+=1000",
          pin: true, scrub: 1.3, anticipatePin: 1,
        },
      })
        .from(".s4-heading",     { y: 56, opacity: 0, duration: 0.28 })
        .from(".s4-sub",         { y: 28, opacity: 0, duration: 0.25 }, 0.15)
        .from(".s4-map",         { opacity: 0, scale: 0.88, duration: 0.4 }, 0.1)
        .from(".s4-dot-blr",     { scale: 0, opacity: 0, duration: 0.2, transformOrigin: "100px 168px" }, 0.35)
        .to(".s4-route",         { strokeDashoffset: 0, duration: 0.38, ease: "none" }, 0.42)
        .from(".s4-dot-bom",     { scale: 0, opacity: 0, duration: 0.2, transformOrigin: "260px 80px" }, 0.76)
        .from(".s4-match-card",  { y: 44, opacity: 0, scale: 0.88, duration: 0.32 }, 0.84)
        .from(".s4-match-badge", { scale: 0, opacity: 0, duration: 0.22, ease: "back.out(2)" }, 0.92);

      /* ═══════════════════════════════════════
         SCENE 5 — How It Works
      ═══════════════════════════════════════ */
      gsap.timeline({
        scrollTrigger: {
          trigger: ".s5", start: "top top", end: "+=800",
          pin: true, scrub: 1.3, anticipatePin: 1,
        },
      })
        .from(".s5-badge",   { y: -20, opacity: 0, duration: 0.25 })
        .from(".s5-heading", { y: 48, opacity: 0, duration: 0.35 }, 0.12)
        .from(".s5-card1",   { x: -60, opacity: 0, duration: 0.3 }, 0.28)
        .from(".s5-card2",   { x: 60, opacity: 0, duration: 0.3 }, 0.42)
        .from(".s5-card3",   { x: -60, opacity: 0, duration: 0.3 }, 0.56)
        .from(".s5-card4",   { x: 60, opacity: 0, duration: 0.3 }, 0.70);

      /* ═══════════════════════════════════════
         SCENE 6 — Handover
      ═══════════════════════════════════════ */
      gsap.timeline({
        scrollTrigger: {
          trigger: ".s6", start: "top top", end: "+=800",
          pin: true, scrub: 1.3, anticipatePin: 1,
        },
      })
        .from(".s6-heading",  { y: 56, opacity: 0, duration: 0.3 })
        .from(".s6-sub",      { y: 28, opacity: 0, duration: 0.25 }, 0.15)
        .from(".s6-otp-box",  { y: 32, opacity: 0, duration: 0.28 }, 0.32)
        .from(".s6-d1",       { opacity: 0, y: 12, duration: 0.16 }, 0.62)
        .from(".s6-d2",       { opacity: 0, y: 12, duration: 0.16 }, 0.70)
        .from(".s6-d3",       { opacity: 0, y: 12, duration: 0.16 }, 0.78)
        .from(".s6-d4",       { opacity: 0, y: 12, duration: 0.16 }, 0.86)
        .from(".s6-verified", { scale: 0, opacity: 0, duration: 0.22, ease: "back.out(2.5)" }, 0.93)
        .from(".s6-location", { opacity: 0, y: 10, duration: 0.16 }, 0.97);

      /* ═══════════════════════════════════════
         SCENE 7 — Journey
      ═══════════════════════════════════════ */
      gsap.timeline({
        scrollTrigger: {
          trigger: ".s7", start: "top top", end: "+=1200",
          pin: true, scrub: 1.8, anticipatePin: 1,
        },
      })
        .from(".s7-stars",    { opacity: 0, duration: 0.3 })
        .from(".s7-heading",  { y: 48, opacity: 0, duration: 0.38 }, 0.05)
        .from(".s7-sub",      { y: 28, opacity: 0, duration: 0.28 }, 0.2)
        .from(".s7-cloud1",   { x: 220, opacity: 0, duration: 0.5 }, 0.1)
        .from(".s7-cloud2",   { x: -220, opacity: 0, duration: 0.5 }, 0.2)
        .fromTo(".s7-plane",
          { x: "-18vw", y: 30, opacity: 0 },
          { x: "108vw", y: -50, opacity: 1, duration: 1.0, ease: "power1.inOut" },
          0.18
        )
        .from(".s7-alt",      { opacity: 0, y: 18, duration: 0.22 }, 0.45)
        .from(".s7-progress", { opacity: 0, scaleX: 0, duration: 0.35, transformOrigin: "left center", ease: "none" }, 0.55)
        .from(".s7-city",     { opacity: 0, y: 14, duration: 0.18, stagger: 0.1 }, 0.55);

      /* ═══════════════════════════════════════
         SCENE 8 — Delivery
      ═══════════════════════════════════════ */
      gsap.timeline({
        scrollTrigger: {
          trigger: ".s8", start: "top top", end: "+=700",
          pin: true, scrub: 1.3, anticipatePin: 1,
        },
      })
        .from(".s8-heading",  { y: 56, opacity: 0, duration: 0.32 })
        .from(".s8-sub",      { y: 32, opacity: 0, duration: 0.28 }, 0.16)
        .from(".s8-time",     { opacity: 0, y: 16, duration: 0.22 }, 0.3)
        .from(".s8-code-box", { y: 32, opacity: 0, duration: 0.28 }, 0.44)
        .from(".s8-stamp",    { scale: 0, rotate: -18, opacity: 0, duration: 0.3, ease: "back.out(2.5)" }, 0.62)
        .from(".s8-rating",   { opacity: 0, y: 12, duration: 0.2 }, 0.78);

      /* ═══════════════════════════════════════
         SCENE 9 — Payment
      ═══════════════════════════════════════ */
      gsap.timeline({
        scrollTrigger: {
          trigger: ".s9", start: "top top", end: "+=900",
          pin: true, scrub: 1.3, anticipatePin: 1,
        },
      })
        .from(".s9-heading",  { y: 56, opacity: 0, duration: 0.32 })
        .from(".s9-sub",      { y: 28, opacity: 0, duration: 0.25 }, 0.14)
        .from(".s9-upi",      { y: 80, opacity: 0, duration: 0.42 }, 0.22)
        .from(".s9-amount",   { opacity: 0, scale: 0.78, duration: 0.28 }, 0.42)
        .from(".s9-pay-btn",  { scale: 0.78, opacity: 0, duration: 0.22 }, 0.56)
        .from(".s9-rupee",    { opacity: 0, y: 28, stagger: 0.06, duration: 0.16 }, 0.66)
        .from(".s9-success",  { scale: 0, opacity: 0, duration: 0.26, ease: "back.out(2.5)" }, 0.8);

      /* ═══════════════════════════════════════
         SCENE 10 — Ending
      ═══════════════════════════════════════ */
      gsap.timeline({
        scrollTrigger: {
          trigger: ".s10", start: "top top", end: "+=750",
          pin: true, scrub: 1.3, anticipatePin: 1,
        },
      })
        .from(".s10-stars-wrap", { opacity: 0, duration: 0.4 })
        .from(".s10-badge",      { y: -20, opacity: 0, duration: 0.22 }, 0.1)
        .from(".s10-logo",       { y: 44, opacity: 0, scale: 0.78, duration: 0.42 }, 0.2)
        .from(".s10-tagline",    { opacity: 0, letterSpacing: "0.5em", duration: 0.35 }, 0.38)
        .from(".s10-stat",       { y: 28, opacity: 0, duration: 0.28, stagger: 0.1 }, 0.52)
        .from(".s10-cta",        { y: 32, opacity: 0, duration: 0.28 }, 0.72)
        .from(".s10-footnote",   { opacity: 0, y: 12, duration: 0.2 }, 0.86);

    }, rootRef);

    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="dp-root">

      {/* ── Fixed UI ── */}
      <div className="dp-progress">
        <div ref={barRef} className="dp-bar" />
      </div>
      <button className="dp-back" onClick={() => navigate("/login")}>← Back</button>
      <div className="dp-scene-pill" aria-live="polite">
        <span className="dp-scene-num">{String(activeDot + 1).padStart(2, "0")}</span>
        <span className="dp-scene-sep" aria-hidden>/</span>
        <span className="dp-scene-total">{String(SCENES.length).padStart(2, "0")}</span>
        <span className="dp-scene-name">{SCENES[activeDot]}</span>
      </div>
      <nav className="dp-dots">
        {SCENES.map((label, i) => (
          <button
            key={i}
            className={`dp-dot${activeDot === i ? " active" : ""}`}
            onClick={() => scrollToScene(i)}
            title={label}
          />
        ))}
      </nav>

      {/* ══════════════════════════════════════════
          SCENE 1 — Discovery
      ══════════════════════════════════════════ */}
      <section className="dp-scene s1">
        <div className="s1-glow" />
        <div className="s1-inner">
          <div className="s1-left">
            <span className="s1-badge">Scene 1 · Discovery</span>
            <h2 className="s1-heading">Ravi ko mila ek smart<br />earning opportunity</h2>
            <p className="s1-sub">
              Bangalore se Mumbai flight book ki… phir ek notification aaya —
              "Apni flight se ₹500 kamao — kisi ka parcel le jaake."
            </p>
            <p className="s1-hint">Scroll to explore ↓</p>
          </div>
          <div className="s1-right">
            <div className="s1-notif">
              <span className="s1-notif-icon">✈</span>
              <div>
                <div className="s1-notif-title">TurantX</div>
                <div className="s1-notif-body">
                  Match mila! BLR → BOM. Earn ₹500 on your trip.
                </div>
              </div>
            </div>
            <div className="s1-phone">
              <div className="s1-ph-screen">
                <div className="s1-ph-header">TurantX</div>
                <div className="s1-ph-card">
                  <div className="s1-ph-route">BLR → BOM</div>
                  <div className="s1-ph-earn">Earn ₹ 500</div>
                  <div className="s1-ph-btn">Accept Trip</div>
                </div>
                <div className="s1-ph-meta">
                  <span>1 item · 1 kg</span>
                  <span>Sender Verified ✓</span>
                </div>
              </div>
            </div>
            <div className="s1-traveler">
              <Lottie animationData={lottieEarning} loop={true} className="s1-lottie" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SCENE 2 — Registration
      ══════════════════════════════════════════ */}
      <section className="dp-scene s2">
        <div className="s2-inner">
          <div className="s2-left">
            <span className="dp-badge">Scene 2 · Registration</span>
            <h2 className="s2-heading">60 seconds.<br />Fully verified.</h2>
            <p className="s2-sub">Bas PNR verify karo aur start karo.<br />No long forms. No friction.</p>
            <div className="s2-traveler">
              <Lottie animationData={lottieVerified} loop={true} className="s2-lottie" />
            </div>
          </div>
          <div className="s2-right">
            <div className="s2-phone">
              <div className="s2-screen">
                <div className="s2-ph-title">Create Account</div>
                <div className="s2-field s2-f1">
                  <span className="s2-flabel">Full Name</span>
                  <span className="s2-fval">Ravi Sharma</span>
                </div>
                <div className="s2-field s2-f2">
                  <span className="s2-flabel">Flight</span>
                  <span className="s2-fval">BLR → BOM</span>
                </div>
                <div className="s2-field s2-f3">
                  <span className="s2-flabel">PNR</span>
                  <span className="s2-fval">Q8X2L9</span>
                </div>
                <div className="s2-check">✓  PNR Verified!</div>
                <div className="s2-footer">🔒 Your data is secure</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SCENE 3 — Problem
      ══════════════════════════════════════════ */}
      <section className="dp-scene s3">
        <div className="s3-red-glow" />
        <div className="s3-inner">
          <div className="s3-left">
            <span className="dp-badge">Scene 3 · The Problem</span>
            <h2 className="s3-heading">Priya ko urgently parcel<br />Mumbai bhejna tha</h2>
            <p className="s3-sub">Courier prices dekh ke shock lag gaya…</p>
            <div className="s3-sender">
              <Lottie animationData={lottieTiredWoman} loop={true} className="s3-lottie" />
            </div>
          </div>
          <div className="s3-right">
            <div className="s3-prices">
              <div className="s3-price-card s3-p1">
                <span className="s3-carrier">Express Courier</span>
                <span className="s3-amount">₹ 1,800</span>
                <span className="s3-cross">✕</span>
              </div>
              <div className="s3-price-card s3-p2">
                <span className="s3-carrier">Premium Delivery</span>
                <span className="s3-amount">₹ 1,500</span>
                <span className="s3-cross">✕</span>
              </div>
              <div className="s3-price-card s3-p3">
                <span className="s3-carrier">Standard Courier</span>
                <span className="s3-amount">₹ 1,200</span>
                <span className="s3-cross">✕</span>
              </div>
            </div>
            <div className="s3-tag">⏱ Delivery time: 2–3 days</div>
            <div className="s3-arrow">↓ Koi faster aur sasta option?</div>
            <div className="s3-solution">
              <span className="s3-sol-logo">T</span>
              <span className="s3-sol-text">TurantX → ₹500 · Same-day delivery ⚡</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SCENE 4 — Matching
      ══════════════════════════════════════════ */}
      <section className="dp-scene s4">
        <div className="s4-grid" />
        <div className="s4-inner">
          <div className="s4-left">
            <span className="dp-badge bright">Scene 4 · The Match</span>
            <h2 className="s4-heading">Smart matching ne<br />perfect connection banaya</h2>
            <p className="s4-sub">
              Ravi BLR → BOM ja raha tha.<br />
              Priya ka parcel bhi Mumbai jaana tha.<br />
              → Instant match ⚡
            </p>
            <div className="s4-match-card">
              <div className="s4-mc-row">
                <span className="s4-mc-avatar">✈</span>
                <div className="s4-mc-info">
                  <div className="s4-mc-name">Ravi Sharma</div>
                  <div className="s4-mc-route">BLR → BOM · Today</div>
                </div>
                <div className="s4-match-badge">✓ MATCHED</div>
              </div>
            </div>
            <p className="s4-meta-note">Real-time matching across daily flights</p>
          </div>
          <div className="s4-right">
            <svg className="s4-map" viewBox="0 0 340 260" fill="none">
              <ellipse cx="100" cy="170" rx="72" ry="58"
                fill="rgba(255,145,77,0.10)" stroke="rgba(255,145,77,0.22)" strokeWidth="1" />
              <ellipse cx="260" cy="80" rx="46" ry="36"
                fill="rgba(255,145,77,0.07)" stroke="rgba(255,145,77,0.18)" strokeWidth="1" />
              <path className="s4-route"
                d="M100 168 Q180 20 260 80"
                stroke="#ff914d" strokeWidth="2.5"
                strokeDasharray="310" strokeDashoffset="310"
                strokeLinecap="round" fill="none" />
              <circle className="s4-dot-blr" cx="100" cy="168" r="9" fill="#ff914d" />
              <circle cx="100" cy="168" r="16" fill="none" stroke="#ff914d" strokeWidth="1.5" opacity="0.35" />
              <text x="100" y="194" textAnchor="middle"
                fill="rgba(255,255,255,0.65)" fontSize="9" fontFamily="Inter,sans-serif">Bangalore</text>
              <circle className="s4-dot-bom" cx="260" cy="80" r="9" fill="#ff914d" />
              <circle cx="260" cy="80" r="16" fill="none" stroke="#ff914d" strokeWidth="1.5" opacity="0.35" />
              <text x="260" y="106" textAnchor="middle"
                fill="rgba(255,255,255,0.65)" fontSize="9" fontFamily="Inter,sans-serif">Mumbai</text>
              <text x="178" y="56" fontSize="15" fill="white" opacity="0.7">✈</text>
            </svg>
            <p className="s4-map-note">Real-time matching across daily flights</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SCENE 5 — How It Works
      ══════════════════════════════════════════ */}
      <section className="dp-scene s5">
        <div className="s5-glow" />
        <div className="s5-inner">
          <span className="s5-badge dp-badge bright">How It Works</span>
          <h2 className="s5-heading">Simple. Safe. Smart.</h2>
          <div className="s5-cards">
            <div className="s5-card s5-card1">
              <span className="s5-card-icon">✈</span>
              <div className="s5-card-text">
                <div className="s5-card-title">Traveler carries</div>
                <div className="s5-card-desc">Sirf apni flight pe parcel carry karega</div>
              </div>
            </div>
            <div className="s5-card s5-card2">
              <span className="s5-card-icon">🚫</span>
              <div className="s5-card-text">
                <div className="s5-card-title">No pickup. No delivery.</div>
                <div className="s5-card-desc">Traveler ko kuch extra nahi karna</div>
              </div>
            </div>
            <div className="s5-card s5-card3">
              <span className="s5-card-icon">🤝</span>
              <div className="s5-card-text">
                <div className="s5-card-title">Sender handles logistics</div>
                <div className="s5-card-desc">Handover karega & receiver se pickup karwayega</div>
              </div>
            </div>
            <div className="s5-card s5-card4">
              <span className="s5-card-icon">🔒</span>
              <div className="s5-card-text">
                <div className="s5-card-title">Fully tracked & verified</div>
                <div className="s5-card-desc">Har step app mein secure aur recorded</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SCENE 6 — Handover
      ══════════════════════════════════════════ */}
      <section className="dp-scene s6">
        <div className="s6-inner">
          <div className="s6-text-block">
            <span className="dp-badge bright">Scene 6 · Handover</span>
            <h2 className="s6-heading">OTP verify.<br />Secure handover.</h2>
            <p className="s6-sub">
              Sender verified (Aadhaar ✓) · No pickup needed<br />
              Sender ne directly handover kiya<br />
              Ravi ne OTP confirm kiya<br />
              Same secure code delivery ke liye use hoga
            </p>
          </div>
          <div className="s6-stage">
            <div className="s6-handshake">
              <Lottie animationData={lottieHandshake} loop={true} className="s6-lottie" />
            </div>
            <div className="s6-stage-labels">
              <span className="s6-label">Priya · Sender</span>
              <span className="s6-label">Ravi · Traveler</span>
            </div>
          </div>
          <div className="s6-otp-box">
            <div className="s6-otp-title">Secure OTP Handover</div>
            <div className="s6-otp-digits">
              <span className="s6-otp-cell s6-d1">4</span>
              <span className="s6-otp-cell s6-d2">8</span>
              <span className="s6-otp-cell s6-d3">2</span>
              <span className="s6-otp-cell s6-d4">1</span>
            </div>
          </div>
          <div className="s6-verified">✓ Package Verified &amp; Handed Over</div>
          <div className="s6-location">📍 Location logged</div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SCENE 7 — Journey
      ══════════════════════════════════════════ */}
      <section className="dp-scene s7">
        <div className="s7-stars" />
        <div className="s7-cloud1" />
        <div className="s7-cloud2" />
        <div className="s7-plane">✈</div>
        <div className="s7-inner">
          <span className="dp-badge bright">Scene 7 · The Journey</span>
          <h2 className="s7-heading">Flight mein safely<br />travel karta parcel</h2>
          <p className="s7-sub">Live tracking enabled. Priya aur Ravi dono real-time updates dekh rahe the.</p>
          <div className="s7-alt">Altitude: 35,000 ft · Speed: 900 km/h</div>
          <div className="s7-progress-wrap">
            <div className="s7-progress-bar">
              <div className="s7-progress" />
            </div>
            <div className="s7-progress-label">In Transit ✈</div>
          </div>
          <div className="s7-cities-row">
            <span className="s7-city">Bangalore ✓</span>
            <span className="s7-sep">→</span>
            <span className="s7-city">Mumbai →</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SCENE 8 — Delivery
      ══════════════════════════════════════════ */}
      <section className="dp-scene s8">
        <div className="s8-inner">
          <div className="s8-left">
            <span className="dp-badge">Scene 8 · Delivery</span>
            <h2 className="s8-heading">Mumbai mein<br />successful delivery</h2>
            <p className="s8-sub">
              Receiver ne code verify kiya.<br />
              Ravi ne delivery confirm ki.<br />
              Secure handoff complete.
            </p>
            <div className="s8-time">⏱ Same day delivery</div>
          </div>
          <div className="s8-right">
            <div className="s8-scene">
              <div className="s8-celebration">
                <Lottie animationData={lottieCelebration} loop={true} className="s8-lottie" />
              </div>
            </div>
            <div className="s8-code-box">
              <div className="s8-code-label">Delivery Code</div>
              <div className="s8-code-digits">
                <span>4</span><span>8</span><span>2</span><span>1</span>
              </div>
              <div className="s8-code-status">✓ Code Verified &amp; Delivered</div>
            </div>
            <div className="s8-stamp">DELIVERED ✓</div>
            <div className="s8-rating">⭐ Rating submitted</div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SCENE 9 — Payment
      ══════════════════════════════════════════ */}
      <section className="dp-scene s9">
        <div className="s9-inner">
          <div className="s9-center">
            <span className="dp-badge bright">Scene 9 · Payment</span>
            <h2 className="s9-heading">Instant earning.<br />No follow-ups.</h2>
            <p className="s9-sub">Flight land hote hi payment auto-credit ho gaya</p>
            <div className="s9-upi">
              <div className="s9-upi-label">UPI Payment</div>
              <div className="s9-amount">₹ 500</div>
              <div className="s9-upi-id">ravi@upi</div>
              <div className="s9-pay-btn">Pay Now ↗</div>
            </div>
            <div className="s9-rupees">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="s9-rupee" style={{ "--i": i }}>₹</span>
              ))}
            </div>
            <div className="s9-success">✓ Payment Successful</div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SCENE 10 — Ending
      ══════════════════════════════════════════ */}
      <section className="dp-scene s10">
        <div className="s10-stars-wrap" />
        <div className="s10-glow" />
        <div className="s10-inner">
          <span className="s10-badge">Scene 10 · The Future</span>
          <div className="s10-logo">
            <img src={logo} alt="TurantX" className="s10-logo-img" />
          </div>
          <p className="s10-tagline">Fly Smart. Earn Smart.</p>
          <div className="s10-stats">
            <div className="s10-stat">
              <div className="s10-stat-num">50K+</div>
              <div className="s10-stat-label">Trips Matched</div>
            </div>
            <div className="s10-stat-divider" />
            <div className="s10-stat">
              <div className="s10-stat-num">₹2Cr+</div>
              <div className="s10-stat-label">Earned by Travelers</div>
            </div>
            <div className="s10-stat-divider" />
            <div className="s10-stat">
              <div className="s10-stat-num">4.9★</div>
              <div className="s10-stat-label">Avg Rating</div>
            </div>
          </div>
          <button className="s10-cta" onClick={() => navigate("/login")}>
            Start Earning →
          </button>
          <p className="s10-footnote">Join 10,000+ travelers already earning on every flight</p>
        </div>
      </section>

    </div>
  );
}

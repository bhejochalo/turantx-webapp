import { useEffect, useState } from "react";
import "./Loader.css";

/* Cinematic, intelligent statuses — feels like a live matching engine. */
const STATUSES = [
  "Connecting verified routes",
  "Matching live travellers",
  "Securing your handover",
];

const Loader = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % STATUSES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="tx-loader" role="status" aria-live="polite" aria-label="Loading TurantX">
      {/* Atmospheric backdrop */}
      <div className="tx-loader-bg" aria-hidden>
        <span className="tx-loader-orb tx-loader-orb--warm" />
        <span className="tx-loader-orb tx-loader-orb--cool" />
        <span className="tx-loader-grain" />
        <span className="tx-loader-vignette" />
      </div>

      {/* Stage */}
      <div className="tx-loader-stage">
        <svg
          viewBox="0 0 480 220"
          preserveAspectRatio="xMidYMid meet"
          className="tx-loader-svg"
          aria-hidden
        >
          <defs>
            <linearGradient id="tx-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#FF8B3E" stopOpacity="0" />
              <stop offset="20%"  stopColor="#FF8B3E" stopOpacity="0.55" />
              <stop offset="50%"  stopColor="#FF621A" stopOpacity="1" />
              <stop offset="80%"  stopColor="#FF8B3E" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#FF8B3E" stopOpacity="0" />
            </linearGradient>

            <radialGradient id="tx-node-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#FF7A29" stopOpacity="0.55" />
              <stop offset="60%"  stopColor="#FF621A" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#FF621A" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="tx-plane-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#FFB47A" />
              <stop offset="100%" stopColor="#FF621A" />
            </linearGradient>

            <filter id="tx-plane-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Soft drop shadow under plane */}
            <filter id="tx-soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#FF621A" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* ── ORIGIN node ── */}
          <g transform="translate(60, 160)">
            <circle r="42" fill="url(#tx-node-glow)" />
            <circle r="22" className="tx-pulse tx-pulse--origin" />
            <circle r="14" className="tx-pulse tx-pulse--origin tx-pulse--late" />
            <circle r="8"  fill="#FF621A" />
            <circle r="4"  fill="#fff" />
            <circle r="1.5" fill="#FF621A" />
          </g>

          {/* ── DESTINATION node ── */}
          <g transform="translate(420, 160)">
            <circle r="42" fill="url(#tx-node-glow)" />
            <circle r="22" className="tx-pulse tx-pulse--dest" />
            <circle r="14" className="tx-pulse tx-pulse--dest tx-pulse--late" />
            <circle r="8"  fill="#FF621A" />
            <circle r="4"  fill="#fff" />
            <circle r="1.5" fill="#FF621A" />

            {/* Verification check — pulses in once per loop after plane arrives */}
            <g className="tx-verify">
              <circle r="13" fill="none" stroke="#FF621A" strokeWidth="1.5" opacity="0.9" />
              <path
                d="M -5 0 L -1.5 4 L 5.5 -4"
                fill="none"
                stroke="#FF621A"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </g>

          {/* ── Background track (faint base) ── */}
          <path
            d="M 60 160 Q 240 30 420 160"
            fill="none"
            stroke="rgba(255, 98, 26, 0.10)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* ── Active dashed flow ── */}
          <path
            d="M 60 160 Q 240 30 420 160"
            fill="none"
            stroke="url(#tx-arc-grad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="6 9"
            className="tx-arc-dash"
          />

          {/* ── Companion ghost arc (suggests parallel routes / network) ── */}
          <path
            d="M 80 165 Q 240 70 400 165"
            fill="none"
            stroke="rgba(255, 98, 26, 0.12)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="2 6"
            className="tx-arc-ghost"
          />

          {/* ── Plane traversing the route ── */}
          <g filter="url(#tx-soft-shadow)">
            <g className="tx-plane">
              {/* refined silhouette: body + wings + tail */}
              <path
                d="M -13 0 L 6 -4.5 L 13 0 L 6 4.5 Z M -3 -4.5 L -10 -8 L -13 0 L -10 8 L -3 4.5 Z"
                fill="url(#tx-plane-grad)"
                stroke="#fff"
                strokeWidth="0.4"
                strokeLinejoin="round"
              />
              <animateMotion
                dur="2.8s"
                repeatCount="indefinite"
                rotate="auto"
                keyTimes="0;1"
                keySplines="0.4 0 0.2 1"
                calcMode="spline"
                path="M 60 160 Q 240 30 420 160"
              />
            </g>
          </g>
        </svg>
      </div>

      {/* Brand + cycling status */}
      <div className="tx-loader-meta">
        <span className="tx-loader-eyebrow">VERIFIED ROUTING NETWORK</span>
        <p className="tx-loader-brand">
          Turant<span className="tx-loader-brand-x">X</span>
        </p>
        <p className="tx-loader-status" key={idx}>
          {STATUSES[idx]}
          <span className="tx-loader-dots" aria-hidden>
            <span /><span /><span />
          </span>
        </p>
      </div>
    </div>
  );
};

export default Loader;

import React, { useState, useEffect } from "react";
import "./IntroPage.css";
import { useNavigate } from "react-router-dom";

const slides = [
  {
    title: "Send Items Faster",
    text: "Your item travels with real passengers — not in cargo delays.",
  },
  {
    title: "Earn While You Travel",
    text: "Travelers earn money for carrying verified parcels.",
  },
  {
    title: "Instant Matches",
    text: "We connect senders with travelers flying the same route.",
  },
];

export default function IntroPage() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="intro-container page-transition">
      <div className="intro-content">
        <div className="intro-slide">
          <h1>{slides[index].title}</h1>
          <p>{slides[index].text}</p>
        </div>

        <div className="dots">
          {slides.map((_, i) => (
            <div key={i} className={`dot ${index === i ? "active" : ""}`} />
          ))}
        </div>

        <button className="continue-btn" onClick={() => navigate("/login")}>
          Continue to TurantX →
        </button>
      </div>
    </div>
  );
}

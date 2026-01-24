import React, { useState, useEffect } from "react";
import "./IntroPage.css";
import { useNavigate } from "react-router-dom";

const slides = [
  {
    title: "Same-Day Documents",
    text: "Documents move with travellers already flying your route.",
  },
  {
    title: "Earn While You Travel",
    text: "Just carry documents on your scheduled flight and earn.",
  },
  {
    title: "Route-based matching",
    text: "We notify you only when a suitable route match is available.",
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

import React, { useState, useEffect } from "react";
import "./IntroPage.css";
import LandingPage from "./LandingPage";

const slides = [
  {
    title: "Deliver Smarter. Travel Lighter.",
    text: "Send parcels with real travelers flying to your destination."
  },
  {
    title: "Earn While You Travel.",
    text: "Travelers get paid to carry verified packages safely."
  },
  {
    title: "Fast, Reliable, Trusted.",
    text: "End-to-end verification for secure parcel delivery."
  }
];

const IntroPage = () => {
  const [index, setIndex] = useState(0);
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (showLanding) return <LandingPage />;

  return (
    <div className="intro-container">
      <div className="intro-slide fade-in">
        <h1>{slides[index].title}</h1>
        <p>{slides[index].text}</p>
      </div>

      <button className="continue-btn" onClick={() => setShowLanding(true)}>
        Continue to TurantX →
      </button>
    </div>
  );
};

export default IntroPage;

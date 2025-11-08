import React, { useEffect } from "react";
import "./LogoAnimation.css";
import logo from "../assets/turantx-logo.png";

export default function LogoAnimation({ onFinish }) {
  useEffect(() => {
    // Reduced total duration (2.5s)
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="logo-anim-screen">
      <div className="logo-anim-wrapper">
        <img src={logo} alt="TurantX" className="main-logo" />
      </div>
    </div>
  );
}

import React from "react";
import "./Loader.css";
import logo from "../assets/turantxloader.png"; // or use flight icon

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="loader-logo">
        <img src={logo} alt="TurantX" className="loader-img" />
        <div className="plane-path"></div>
      </div>
      <p className="loader-text">Connecting your journey...</p>
    </div>
  );
};

export default Loader;

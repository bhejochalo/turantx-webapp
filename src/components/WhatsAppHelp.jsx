import React from "react";
import "./WhatsAppHelp.css";
import waicon from "../assets/whatsappicon.png";

const WHATSAPP_LINK =
  "https://wa.me/919876545520?text=Hi%20TurantX%20Support";

export default function WhatsAppHelp() {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-help"
      aria-label="Chat with us on WhatsApp"
    >
      <img
      src={waicon}
        alt="WhatsApp TurantX"
        width="60"
        height="60"
      />
    </a>
  );
}

import React from "react";
import "./WhatsAppHelp.css";

const WHATSAPP_LINK =
  "https://wa.me/919876543210?text=Hi%20TurantX%20Support";

export default function WhatsAppHelp() {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-help"
    >
      💬 Help on WhatsApp
    </a>
  );
}

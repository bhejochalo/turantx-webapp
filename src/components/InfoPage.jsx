import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { loadContent, DEFAULT_CONTENT } from "../services/contentService";
import waicon from "../assets/whatsappicon.png";
import "./InfoPage.css";

const EYEBROW_MAP = {
  help: "Support",
  contact: "Get in Touch",
  safety: "Safety & Trust",
  terms: "Legal",
  privacy: "Legal",
  "why-turantx": "Why TurantX",
  "how-it-works": "How It Works",
};

/* ── About page — pulls structured data from CMS ── */
function AboutPage({ data }) {
  const d = data || DEFAULT_CONTENT.pages.about;
  return (
    <div className="info-about">
      <div className="about-hero">
        <p className="about-eyebrow">About Us</p>
        <h1 className="about-heading">{d.tagline}</h1>
        <p className="about-lead">{d.lead}</p>
      </div>

      <div className="about-values">
        {d.values.map((v, i) => (
          <div className="about-value-card" key={i}>
            <span className="value-icon">{v.icon}</span>
            <h3>{v.title}</h3>
            <p>{v.desc}</p>
          </div>
        ))}
      </div>

      <div className="about-story">
        <p className="about-story-eyebrow">Our Story</p>
        <h2>{d.storyHeading}</h2>
        {d.storyParagraphs.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div className="about-mission">
        <p className="about-mission-label">Our Mission</p>
        <p className="about-mission-text">{d.missionText}</p>
      </div>
    </div>
  );
}

/* ── Generic prose page ── */
function ProsePage({ data, type }) {
  const lines = (data.body || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="info-prose-page">
      <div className="prose-hero">
        <p className="prose-eyebrow">{EYEBROW_MAP[type] || "Info"}</p>
        <h1 className="prose-heading">{data.title}</h1>
      </div>
      <div className="prose-body">
        {lines.map((line, i) => {
          if (/^\d+[.)]\s/.test(line))
            return <h3 key={i} className="prose-section-title">{line}</h3>;
          if (line.startsWith("Last updated"))
            return <p key={i} className="prose-updated">{line}</p>;
          if (line.startsWith("✔"))
            return <p key={i} className="prose-check">{line}</p>;
          if (/^[📧📞📍]/.test(line))
            return <p key={i} className="prose-contact-line">{line}</p>;
          return <p key={i} className="prose-para">{line}</p>;
        })}
      </div>
    </div>
  );
}

export default function InfoPage() {
  const { type } = useParams();
  const [pages, setPages] = useState(DEFAULT_CONTENT.pages);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent()
      .then((c) => setPages(c.pages || DEFAULT_CONTENT.pages))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="info-prose-page">
        <p style={{ padding: "64px 24px", color: "#94A3B8", textAlign: "center", fontSize: 14 }}>
          Loading…
        </p>
      </div>
    );
  }

  if (type === "about") return <AboutPage data={pages.about} />;

  const data = pages[type];
  if (!data) {
    return (
      <div className="info-prose-page">
        <p style={{ padding: "64px 24px", color: "#475569" }}>Content not found.</p>
      </div>
    );
  }

  if (type === "help") {
    return (
      <>
        <ProsePage data={data} type={type} />
        <div className="help-whatsapp-cta">
          <a
            href="https://wa.me/919876545520?text=Hi%20TurantX%20Support"
            target="_blank"
            rel="noopener noreferrer"
            className="help-whatsapp-btn"
          >
            <img src={waicon} alt="WhatsApp" className="help-wa-icon" />
            <span>Chat with us on WhatsApp</span>
          </a>
        </div>
      </>
    );
  }

  return <ProsePage data={data} type={type} />;
}

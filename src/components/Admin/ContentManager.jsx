import { useEffect, useState } from "react";
import { loadContent, saveContent, DEFAULT_CONTENT } from "../../services/contentService";
import "./ContentManager.css";

const EMPTY_TESTIMONIAL = { name: "", city: "", time: "", text: "", role: "Sender", stars: 5 };
const EMPTY_FAQ = { q: "", a: "" };

const PAGE_TABS = [
  { key: "about", label: "About Us" },
  { key: "how-it-works", label: "How It Works" },
  { key: "why-turantx", label: "Why TurantX" },
  { key: "help", label: "Help & Support" },
  { key: "contact", label: "Contact Us" },
  { key: "safety", label: "Safety & Trust" },
  { key: "terms", label: "Terms" },
  { key: "privacy", label: "Privacy" },
];

export default function ContentManager() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [section, setSection] = useState("hero");
  const [pageTab, setPageTab] = useState("about");
  const [source, setSource] = useState("storage");
  const [loadError, setLoadError] = useState(null);

  const refresh = () => {
    setLoading(true);
    setMsg("");
    setLoadError(null);
    loadContent({ skipCache: true, withMeta: true })
      .then(({ data, source: src, error }) => {
        setContent(data);
        setSource(src);
        if (error) setLoadError(error?.code || error?.message || String(error));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    loadContent({ skipCache: true, withMeta: true })
      .then(({ data, source: src, error }) => {
        if (cancelled) return;
        setContent(data);
        setSource(src);
        if (error) setLoadError(error?.code || error?.message || String(error));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const isDefaultFallback = source === "default";

  // ── Landing page setters ────────────────────────────────────────────────────
  const setHero = (key, val) => setContent((p) => ({ ...p, hero: { ...p.hero, [key]: val } }));
  const setPricing = (key, val) =>
    setContent((p) => ({ ...p, pricing: { ...p.pricing, [key]: Math.max(0, Number(val) || 0) } }));
  const setCitiesText = (text) => {
    const list = text.split(",").map((s) => s.trim()).filter(Boolean);
    setContent((p) => ({ ...p, cities: list }));
  };
  const setStat = (i, key, val) =>
    setContent((p) => ({
      ...p,
      stats: p.stats.map((s, idx) => (idx === i ? { ...s, [key]: key === "num" ? Number(val) || 0 : val } : s)),
    }));
  const setBanner = (key, val) => setContent((p) => ({ ...p, banner: { ...p.banner, [key]: val } }));

  const updateTestimonial = (i, key, val) =>
    setContent((p) => ({
      ...p,
      testimonials: p.testimonials.map((t, idx) => (idx === i ? { ...t, [key]: val } : t)),
    }));
  const addTestimonial = () =>
    setContent((p) => ({ ...p, testimonials: [...p.testimonials, { ...EMPTY_TESTIMONIAL }] }));
  const removeTestimonial = (i) =>
    setContent((p) => ({ ...p, testimonials: p.testimonials.filter((_, idx) => idx !== i) }));
  const moveTestimonial = (i, dir) =>
    setContent((p) => {
      const arr = [...p.testimonials];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...p, testimonials: arr };
    });

  const updateFaq = (i, key, val) =>
    setContent((p) => ({
      ...p,
      faqs: p.faqs.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)),
    }));
  const addFaq = () => setContent((p) => ({ ...p, faqs: [...p.faqs, { ...EMPTY_FAQ }] }));
  const removeFaq = (i) =>
    setContent((p) => ({ ...p, faqs: p.faqs.filter((_, idx) => idx !== i) }));
  const moveFaq = (i, dir) =>
    setContent((p) => {
      const arr = [...p.faqs];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...p, faqs: arr };
    });

  // ── Pages setters ───────────────────────────────────────────────────────────
  const setPage = (pageKey, key, val) =>
    setContent((p) => ({
      ...p,
      pages: { ...p.pages, [pageKey]: { ...p.pages[pageKey], [key]: val } },
    }));

  const setAbout = (key, val) => setPage("about", key, val);

  const setAboutValue = (i, key, val) =>
    setContent((p) => ({
      ...p,
      pages: {
        ...p.pages,
        about: {
          ...p.pages.about,
          values: p.pages.about.values.map((v, idx) => idx === i ? { ...v, [key]: val } : v),
        },
      },
    }));

  const setAboutStoryPara = (i, val) =>
    setContent((p) => ({
      ...p,
      pages: {
        ...p.pages,
        about: {
          ...p.pages.about,
          storyParagraphs: p.pages.about.storyParagraphs.map((sp, idx) => idx === i ? val : sp),
        },
      },
    }));

  // ── Save / reset ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      await saveContent(content);
      setMsg("Saved. Live within 5 minutes (or refresh to see immediately).");
      setTimeout(() => setMsg(""), 5000);
    } catch (e) {
      const code = e?.code || "";
      let hint = "";
      if (code === "storage/unauthorized") {
        hint = " — Storage rules block writes. Set rules in Firebase Console → Storage → Rules.";
      } else if (code === "storage/unknown" || code === "storage/retry-limit-exceeded") {
        hint = " — Firebase Storage may not be initialized. Open Firebase Console → Storage → click 'Get Started' to enable it.";
      } else if (code === "storage/quota-exceeded") {
        hint = " — Storage quota exceeded.";
      }
      setMsg("Save failed: " + (e?.message || "unknown error") + hint + (code ? ` [${code}]` : ""));
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (!window.confirm("Reset all content to factory defaults? This will overwrite the current saved content when you click Save.")) return;
    setContent(DEFAULT_CONTENT);
  };

  if (loading) return <div className="cm-loading">Loading content…</div>;

  const pages = content.pages || DEFAULT_CONTENT.pages;
  const about = pages.about || DEFAULT_CONTENT.pages.about;

  return (
    <div className="cm-root">
      <div className="cm-head">
        <div>
          <h2 className="cm-title">Content Manager</h2>
          <p className="cm-sub">Edit all page content. Changes go live within 5 minutes.</p>
        </div>
        <div className="cm-head-actions">
          <button className="cm-btn cm-btn-ghost" onClick={refresh} disabled={saving || loading} title="Reload from Storage">
            ↻ Reload
          </button>
          <button className="cm-btn cm-btn-ghost" onClick={handleResetToDefaults} disabled={saving}>
            Reset to defaults
          </button>
          <button
            className="cm-btn cm-btn-primary"
            onClick={handleSave}
            disabled={saving || isDefaultFallback}
            title={isDefaultFallback ? "Cannot save — content failed to load. Click Reload first." : ""}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {isDefaultFallback && (
        <div className="cm-msg error" role="alert">
          ⚠️ Could not load saved content from Storage{loadError ? ` (${loadError})` : ""}.
          Currently showing factory defaults — <strong>saving now would overwrite your real saved content.</strong>
          {" "}Click ↻ Reload to retry. If it keeps failing, check Firebase Console → Storage and the browser console.
        </div>
      )}
      {source === "cache-stale" && (
        <div className="cm-msg error" role="alert">
          ⚠️ Storage fetch failed{loadError ? ` (${loadError})` : ""}. Showing your last cached content from this browser.
          Click ↻ Reload to retry — saving now will write what you see here.
        </div>
      )}

      {msg && <div className={`cm-msg${msg.startsWith("Saved") ? " success" : " error"}`}>{msg}</div>}

      {/* ── Top-level section tabs ── */}
      <div className="cm-section-tabs">
        {[
          { key: "hero", label: "Hero" },
          { key: "pricing", label: "Pricing" },
          { key: "cities", label: `Cities (${content.cities.length})` },
          { key: "stats", label: "Stats" },
          { key: "banner", label: `Banner${content.banner?.active ? " ●" : ""}` },
          { key: "testimonials", label: `Testimonials (${content.testimonials.length})` },
          { key: "faqs", label: `FAQs (${content.faqs.length})` },
          { key: "pages", label: "Pages" },
        ].map((t) => (
          <button
            key={t.key}
            className={`cm-section-tab${section === t.key ? " active" : ""}`}
            onClick={() => setSection(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Hero ── */}
      {section === "hero" && (
        <div className="cm-card">
          <Field label="Tagline (small text above heading)">
            <input
              type="text"
              value={content.hero.tagline}
              onChange={(e) => setHero("tagline", e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="Heading — line 1 (white)">
            <input
              type="text"
              value={content.hero.headlinePart1}
              onChange={(e) => setHero("headlinePart1", e.target.value)}
              maxLength={60}
            />
          </Field>
          <Field label="Heading — line 2 (orange gradient)">
            <input
              type="text"
              value={content.hero.headlinePart2}
              onChange={(e) => setHero("headlinePart2", e.target.value)}
              maxLength={60}
            />
          </Field>
          <Field label="Subtext — desktop">
            <textarea
              rows={2}
              value={content.hero.subtextDesktop}
              onChange={(e) => setHero("subtextDesktop", e.target.value)}
              maxLength={200}
            />
          </Field>
          <Field label="Subtext — mobile (shorter)">
            <textarea
              rows={2}
              value={content.hero.subtextMobile}
              onChange={(e) => setHero("subtextMobile", e.target.value)}
              maxLength={140}
            />
          </Field>
        </div>
      )}

      {/* ── Pricing ── */}
      {section === "pricing" && (
        <div className="cm-card">
          <p className="cm-help">
            Sender fee is the flat charge users pay. Traveller earnings are the range shown across the site.
          </p>
          <div className="cm-grid-2">
            <Field label="Sender fee (₹)">
              <input
                type="number"
                min="0"
                step="1"
                value={content.pricing.senderFee}
                onChange={(e) => setPricing("senderFee", e.target.value)}
              />
            </Field>
            <Field label="—" />
          </div>
          <div className="cm-grid-2">
            <Field label="Traveller earn — minimum (₹)">
              <input
                type="number"
                min="0"
                step="10"
                value={content.pricing.travellerEarnMin}
                onChange={(e) => setPricing("travellerEarnMin", e.target.value)}
              />
            </Field>
            <Field label="Traveller earn — maximum (₹)">
              <input
                type="number"
                min="0"
                step="10"
                value={content.pricing.travellerEarnMax}
                onChange={(e) => setPricing("travellerEarnMax", e.target.value)}
              />
            </Field>
          </div>
        </div>
      )}

      {/* ── Cities ── */}
      {section === "cities" && (
        <div className="cm-card">
          <p className="cm-help">
            Comma-separated list of live cities. Used in the mobile routes ticker and trust pills.
            Order matters — first city is featured.
          </p>
          <Field label="Cities">
            <textarea
              rows={3}
              value={content.cities.join(", ")}
              onChange={(e) => setCitiesText(e.target.value)}
              placeholder="Mumbai, Delhi, Bangalore, Pune, Kolkata"
            />
          </Field>
          <div className="cm-chips">
            {content.cities.map((c, i) => (
              <span key={i} className="cm-chip">{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      {section === "stats" && (
        <div className="cm-list">
          {content.stats.map((s, i) => (
            <div className="cm-card" key={i}>
              <div className="cm-item-head">
                <span className="cm-item-num">Stat #{i + 1}</span>
              </div>
              <Field label="Label (e.g. 'Cities live')">
                <input value={s.label} onChange={(e) => setStat(i, "label", e.target.value)} maxLength={40} />
              </Field>
              <div className="cm-grid-3">
                <Field label="Prefix (e.g. ₹)">
                  <input value={s.prefix} onChange={(e) => setStat(i, "prefix", e.target.value)} maxLength={4} />
                </Field>
                <Field label="Number">
                  <input type="number" value={s.num} onChange={(e) => setStat(i, "num", e.target.value)} />
                </Field>
                <Field label="Suffix (e.g. %)">
                  <input value={s.suffix} onChange={(e) => setStat(i, "suffix", e.target.value)} maxLength={4} />
                </Field>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Banner ── */}
      {section === "banner" && (
        <div className="cm-card">
          <p className="cm-help">
            Optional thin strip shown at the top of the landing page. Use it for launches, offers, or milestones.
          </p>
          <label className="cm-toggle">
            <input
              type="checkbox"
              checked={!!content.banner.active}
              onChange={(e) => setBanner("active", e.target.checked)}
            />
            <span>Show banner on the landing page</span>
          </label>
          <Field label="Text">
            <input value={content.banner.text} onChange={(e) => setBanner("text", e.target.value)} maxLength={140} />
          </Field>
          <Field label="Link (optional, e.g. /info/help or https://…)">
            <input
              value={content.banner.link}
              onChange={(e) => setBanner("link", e.target.value)}
              maxLength={200}
              placeholder="leave blank for no link"
            />
          </Field>
          <Field label="Style">
            <div className="cm-radio-row">
              {[
                { value: "info", label: "Info (blue)" },
                { value: "promo", label: "Promo (orange)" },
                { value: "alert", label: "Alert (red)" },
              ].map((o) => (
                <label key={o.value} className={`cm-radio${content.banner.style === o.value ? " active" : ""}`}>
                  <input
                    type="radio"
                    name="bannerStyle"
                    value={o.value}
                    checked={content.banner.style === o.value}
                    onChange={(e) => setBanner("style", e.target.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </Field>
          <div className={`cm-banner-preview cm-banner-${content.banner.style || "info"}`}>
            <span>{content.banner.text || "Banner preview"}</span>
            {content.banner.link && <span className="cm-banner-arrow">→</span>}
          </div>
        </div>
      )}

      {/* ── Testimonials ── */}
      {section === "testimonials" && (
        <div className="cm-list">
          {content.testimonials.map((t, i) => (
            <div className="cm-card cm-item" key={i}>
              <div className="cm-item-head">
                <span className="cm-item-num">#{i + 1}</span>
                <div className="cm-item-actions">
                  <button className="cm-icon-btn" onClick={() => moveTestimonial(i, -1)} disabled={i === 0} title="Move up">↑</button>
                  <button className="cm-icon-btn" onClick={() => moveTestimonial(i, 1)} disabled={i === content.testimonials.length - 1} title="Move down">↓</button>
                  <button className="cm-icon-btn cm-icon-danger" onClick={() => removeTestimonial(i)} title="Delete">✕</button>
                </div>
              </div>
              <div className="cm-grid-2">
                <Field label="Name">
                  <input value={t.name} onChange={(e) => updateTestimonial(i, "name", e.target.value)} maxLength={40} />
                </Field>
                <Field label="Route / City">
                  <input value={t.city} onChange={(e) => updateTestimonial(i, "city", e.target.value)} maxLength={40} />
                </Field>
              </div>
              <div className="cm-grid-2">
                <Field label="Time / Highlight">
                  <input value={t.time} onChange={(e) => updateTestimonial(i, "time", e.target.value)} maxLength={40} />
                </Field>
                <Field label="Role">
                  <select value={t.role} onChange={(e) => updateTestimonial(i, "role", e.target.value)}>
                    <option value="Sender">Sender</option>
                    <option value="Traveller">Traveller</option>
                  </select>
                </Field>
              </div>
              <Field label="Quote">
                <textarea
                  rows={3}
                  value={t.text}
                  onChange={(e) => updateTestimonial(i, "text", e.target.value)}
                  maxLength={400}
                />
              </Field>
              <Field label={`Stars: ${t.stars}`}>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={t.stars}
                  onChange={(e) => updateTestimonial(i, "stars", Number(e.target.value))}
                />
              </Field>
            </div>
          ))}
          <button className="cm-add" onClick={addTestimonial}>+ Add testimonial</button>
        </div>
      )}

      {/* ── FAQs ── */}
      {section === "faqs" && (
        <div className="cm-list">
          {content.faqs.map((f, i) => (
            <div className="cm-card cm-item" key={i}>
              <div className="cm-item-head">
                <span className="cm-item-num">#{i + 1}</span>
                <div className="cm-item-actions">
                  <button className="cm-icon-btn" onClick={() => moveFaq(i, -1)} disabled={i === 0} title="Move up">↑</button>
                  <button className="cm-icon-btn" onClick={() => moveFaq(i, 1)} disabled={i === content.faqs.length - 1} title="Move down">↓</button>
                  <button className="cm-icon-btn cm-icon-danger" onClick={() => removeFaq(i)} title="Delete">✕</button>
                </div>
              </div>
              <Field label="Question">
                <input value={f.q} onChange={(e) => updateFaq(i, "q", e.target.value)} maxLength={140} />
              </Field>
              <Field label="Answer">
                <textarea rows={3} value={f.a} onChange={(e) => updateFaq(i, "a", e.target.value)} maxLength={500} />
              </Field>
            </div>
          ))}
          <button className="cm-add" onClick={addFaq}>+ Add FAQ</button>
        </div>
      )}

      {/* ── Pages ── */}
      {section === "pages" && (
        <div>
          {/* Page sub-tabs */}
          <div className="cm-section-tabs cm-page-subtabs">
            {PAGE_TABS.map((t) => (
              <button
                key={t.key}
                className={`cm-section-tab${pageTab === t.key ? " active" : ""}`}
                onClick={() => setPageTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* About Us */}
          {pageTab === "about" && (
            <div className="cm-list">
              <div className="cm-card">
                <p className="cm-help">Hero section at the top of the About Us page.</p>
                <Field label="Tagline / Heading">
                  <input
                    value={about.tagline}
                    onChange={(e) => setAbout("tagline", e.target.value)}
                    maxLength={80}
                  />
                </Field>
                <Field label="Lead paragraph">
                  <textarea
                    rows={3}
                    value={about.lead}
                    onChange={(e) => setAbout("lead", e.target.value)}
                    maxLength={300}
                  />
                </Field>
              </div>

              <div className="cm-card">
                <p className="cm-help">Three value cards shown below the hero.</p>
                {about.values.map((v, i) => (
                  <div key={i} style={{ marginBottom: i < 2 ? 16 : 0 }}>
                    <div className="cm-item-head" style={{ marginBottom: 10 }}>
                      <span className="cm-item-num">Value card #{i + 1}</span>
                    </div>
                    <div className="cm-grid-3">
                      <Field label="Icon (emoji)">
                        <input value={v.icon} onChange={(e) => setAboutValue(i, "icon", e.target.value)} maxLength={4} />
                      </Field>
                      <Field label="Title">
                        <input value={v.title} onChange={(e) => setAboutValue(i, "title", e.target.value)} maxLength={40} />
                      </Field>
                      <Field label="—" />
                    </div>
                    <Field label="Description">
                      <textarea
                        rows={2}
                        value={v.desc}
                        onChange={(e) => setAboutValue(i, "desc", e.target.value)}
                        maxLength={160}
                      />
                    </Field>
                    {i < 2 && <hr style={{ border: "none", borderTop: "1px dashed #E2E8F0", margin: "12px 0" }} />}
                  </div>
                ))}
              </div>

              <div className="cm-card">
                <p className="cm-help">Our Story section.</p>
                <Field label="Story heading">
                  <input
                    value={about.storyHeading}
                    onChange={(e) => setAbout("storyHeading", e.target.value)}
                    maxLength={80}
                  />
                </Field>
                {about.storyParagraphs.map((para, i) => (
                  <Field key={i} label={`Paragraph ${i + 1}`}>
                    <textarea
                      rows={3}
                      value={para}
                      onChange={(e) => setAboutStoryPara(i, e.target.value)}
                      maxLength={400}
                    />
                  </Field>
                ))}
              </div>

              <div className="cm-card">
                <p className="cm-help">Mission strip at the bottom of the About page.</p>
                <Field label="Mission text">
                  <textarea
                    rows={2}
                    value={about.missionText}
                    onChange={(e) => setAbout("missionText", e.target.value)}
                    maxLength={200}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Prose pages — How It Works, Why TurantX, Help, Contact, Safety, Terms, Privacy */}
          {pageTab !== "about" && (() => {
            const pg = pages[pageTab] || DEFAULT_CONTENT.pages[pageTab];
            const isTerms = pageTab === "terms";
            return (
              <div className="cm-card">
                <Field label="Page title">
                  <input
                    value={pg.title}
                    onChange={(e) => setPage(pageTab, "title", e.target.value)}
                    maxLength={100}
                  />
                </Field>
                <Field label="Body content">
                  <p className="cm-help" style={{ margin: "0 0 8px" }}>
                    Each line becomes a paragraph. Lines starting with a number (1. 2.) become section headings.
                    Lines starting with ✔ get a checkmark style. Lines starting with 📧 📞 📍 get contact styling.
                    {isTerms && " Terms is long — scroll down to see all content."}
                  </p>
                  <textarea
                    rows={isTerms ? 30 : 12}
                    value={pg.body}
                    onChange={(e) => setPage(pageTab, "body", e.target.value)}
                    style={{ fontFamily: "monospace", fontSize: 13 }}
                  />
                </Field>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="cm-field">
      <span className="cm-label">{label}</span>
      {children}
    </label>
  );
}

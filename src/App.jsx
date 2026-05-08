import { useState, useCallback } from "react";

const SYSTEM_PROMPT = `You are an expert SEO and GEO (Generative Engine Optimization) analyst. Analyze the provided blog post content and URL/metadata.

Return ONLY a valid JSON object with this exact structure:
{
  "overallScore": 72,
  "seoScore": 68,
  "geoScore": 76,
  "title": "Post title detected",
  "summary": "One sentence summary of what was analyzed",
  "seo": {
    "checks": [
      { "id": "title_length", "label": "Title Length (50–60 chars)", "status": "pass", "note": "Title is 54 characters." },
      { "id": "meta_desc", "label": "Meta Description Present", "status": "warn", "note": "No meta description detected in content." },
      { "id": "h1_present", "label": "Single H1 Tag", "status": "pass", "note": "One clear H1 found." },
      { "id": "keyword_density", "label": "Keyword Density (1–3%)", "status": "fail", "note": "Primary keyword appears only once (0.2%)." },
      { "id": "internal_links", "label": "Internal Links", "status": "warn", "note": "No internal links detected." },
      { "id": "image_alt", "label": "Image Alt Text", "status": "pass", "note": "All images appear to have alt attributes." },
      { "id": "content_length", "label": "Content Length (>800 words)", "status": "pass", "note": "Estimated 1,240 words." },
      { "id": "headings_structure", "label": "Heading Hierarchy (H2/H3)", "status": "pass", "note": "Clear H2 and H3 structure found." },
      { "id": "url_slug", "label": "URL-Friendly Slug", "status": "pass", "note": "Clean, hyphenated slug." },
      { "id": "schema_markup", "label": "Schema / Structured Data", "status": "fail", "note": "No JSON-LD or schema markup detected." }
    ],
    "topIssues": ["Add primary keyword more consistently", "Include a meta description", "Add schema markup (Article or BlogPosting)"]
  },
  "geo": {
    "checks": [
      { "id": "direct_answers", "label": "Direct Answer Paragraphs", "status": "pass", "note": "Content opens with a clear, direct answer." },
      { "id": "question_headers", "label": "Question-Based Headings", "status": "warn", "note": "Only 1 of 5 headings is phrased as a question." },
      { "id": "entity_coverage", "label": "Named Entities & Context", "status": "pass", "note": "Good use of named entities and specific facts." },
      { "id": "citations", "label": "Authoritative Citations/Sources", "status": "fail", "note": "No external sources or citations found." },
      { "id": "faq_section", "label": "FAQ or Q&A Section", "status": "fail", "note": "No FAQ section detected." },
      { "id": "concise_definitions", "label": "Concise Definitions", "status": "pass", "note": "Key terms are defined clearly inline." },
      { "id": "brand_signals", "label": "Brand / Author Signals", "status": "warn", "note": "No author byline or About section found." },
      { "id": "freshness", "label": "Date / Freshness Signals", "status": "pass", "note": "Publication date is visible." },
      { "id": "listicles_tables", "label": "Lists or Tables (Scannable)", "status": "pass", "note": "Multiple bullet lists improve scannability." },
      { "id": "summary_block", "label": "TL;DR / Summary Block", "status": "fail", "note": "No summary block for AI snippet extraction." }
    ],
    "topIssues": ["Add a FAQ section with common user questions", "Include external citations to boost credibility", "Add a TL;DR block at the top or bottom"]
  },
  "quickWins": [
    "Write a meta description (150–160 chars) with your main keyword",
    "Add FAQ section with 3–5 common questions",
    "Add JSON-LD BlogPosting schema markup",
    "Include at least 2–3 internal links to related posts",
    "Add a TL;DR summary block at the top"
  ]
}

Analyze the actual content provided. Be specific in notes — reference actual content when possible. Scores should reflect real quality (don't inflate). Status must be exactly "pass", "warn", or "fail".`;

const StatusIcon = ({ status }) => {
  if (status === "pass") return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#22c55e" fillOpacity="0.15" stroke="#22c55e" strokeWidth="1.5"/>
      <path d="M5 8l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (status === "warn") return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14 13H2L8 2Z" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 7v3M8 11.5v.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1.5"/>
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
};

const ScoreRing = ({ score, label, color }) => {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="48" y="44" textAnchor="middle" fill="white" fontSize="18" fontWeight="700" fontFamily="'DM Mono', monospace">{score}</text>
        <text x="48" y="58" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="'DM Mono', monospace">/100</text>
      </svg>
      <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
};

const CheckRow = ({ check }) => {
  const colors = { pass: "#22c55e", warn: "#f59e0b", fail: "#ef4444" };
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "10px",
      padding: "10px 14px", borderRadius: "8px",
      background: "rgba(255,255,255,0.03)",
      borderLeft: `2px solid ${colors[check.status]}20`,
      marginBottom: "6px"
    }}>
      <div style={{ marginTop: "1px", flexShrink: 0 }}><StatusIcon status={check.status} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.85)", marginBottom: "2px" }}>{check.label}</div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: "1.4", fontFamily: "Georgia, serif" }}>{check.note}</div>
      </div>
    </div>
  );
};

export default function App() {
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("seo");

  const analyze = useCallback(async () => {
    if (!content.trim() && !url.trim()) {
      setError("Anna URL tai liitä blogipostauksen sisältö.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    const userMsg = `Analyze this blog post for SEO and GEO optimization.
${url ? `URL: ${url}` : ""}
${content ? `\nContent:\n${content}` : ""}`;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMsg })
      });
      const data = await res.json();
      const raw = data.content?.map(b => b.text || "").join("") || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setActiveTab("seo");
    } catch (e) {
      setError("Analyysi epäonnistui. Tarkista syöte ja yritä uudelleen.");
    } finally {
      setLoading(false);
    }
  }, [url, content]);

  const passCount = (checks) => checks.filter(c => c.status === "pass").length;
  const failCount = (checks) => checks.filter(c => c.status === "fail").length;
  const warnCount = (checks) => checks.filter(c => c.status === "warn").length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "Georgia, serif",
      color: "white",
      padding: "0"
    }}>
      {/* Noise texture overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.6
      }}/>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "760px", margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                <path d="M2 4h12M2 8h8M2 12h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="13" cy="11" r="3" fill="#a855f7" stroke="white" strokeWidth="1"/>
                <path d="M13 10v2M12 11h2" stroke="white" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>DevKarhu</span>
          </div>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 40px)", fontWeight: "400", margin: "0 0 8px",
            lineHeight: "1.1", letterSpacing: "-0.02em"
          }}>
            SEO <span style={{ color: "#6366f1" }}>&</span> GEO
            <br/>Analyzer
          </h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "15px", maxWidth: "420px", lineHeight: "1.6" }}>
            Tarkista blogipostauksen näkyvyys hakukoneissa ja tekoälyvastauksissa.
          </p>
        </div>

        {/* Input form */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px", padding: "24px", marginBottom: "24px"
        }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>
              URL (valinnainen)
            </label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://esimerkki.fi/blog/postaus"
              style={{
                width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px", padding: "10px 14px", color: "white",
                fontSize: "14px", fontFamily: "'DM Mono', monospace", outline: "none",
                boxSizing: "border-box", transition: "border-color 0.2s"
              }}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>
              Postauksen sisältö <span style={{ color: "rgba(255,255,255,0.2)" }}>(liitä teksti tähän)</span>
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Liitä blogipostauksen koko teksti tähän. Mukaan lukien otsikko, väliotsikot ja kaikki kappaleet..."
              rows={8}
              style={{
                width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px", padding: "12px 14px", color: "white",
                fontSize: "14px", fontFamily: "Georgia, serif", outline: "none",
                boxSizing: "border-box", resize: "vertical", lineHeight: "1.6",
                transition: "border-color 0.2s"
              }}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>
          {error && (
            <div style={{ marginBottom: "16px", padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", fontSize: "13px", color: "#ef4444" }}>
              {error}
            </div>
          )}
          <button
            onClick={analyze}
            disabled={loading}
            style={{
              width: "100%", padding: "13px 24px",
              background: loading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none", borderRadius: "10px", color: "white",
              fontSize: "14px", fontFamily: "'DM Mono', monospace", fontWeight: "600",
              letterSpacing: "0.05em", cursor: loading ? "not-allowed" : "pointer",
              transition: "opacity 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
            }}
          >
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                  <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.3"/>
                  <path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Analysoidaan...
              </>
            ) : "Analysoi postaus →"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            {/* Score overview */}
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px", padding: "32px 24px", marginBottom: "20px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "24px"
            }}>
              <div>
                <div style={{ textAlign: "center", marginBottom: "4px" }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
                    {result.title || "Analysoitu postaus"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "40px", justifyContent: "center", flexWrap: "wrap" }}>
                <ScoreRing score={result.overallScore} label="Kokonais" color="#a855f7" />
                <ScoreRing score={result.seoScore} label="SEO" color="#6366f1" />
                <ScoreRing score={result.geoScore} label="GEO" color="#06b6d4" />
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "16px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "4px" }}>
              {[
                { id: "seo", label: "SEO" },
                { id: "geo", label: "GEO" },
                { id: "wins", label: "Quick Wins" }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  flex: 1, padding: "8px 16px",
                  background: activeTab === tab.id ? "rgba(99,102,241,0.3)" : "transparent",
                  border: activeTab === tab.id ? "1px solid rgba(99,102,241,0.4)" : "1px solid transparent",
                  borderRadius: "7px", color: activeTab === tab.id ? "white" : "rgba(255,255,255,0.45)",
                  fontSize: "12px", fontFamily: "'DM Mono', monospace", fontWeight: "600",
                  letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.15s"
                }}>{tab.label}</button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px", padding: "24px"
            }}>
              {(activeTab === "seo" || activeTab === "geo") && (() => {
                const data = activeTab === "seo" ? result.seo : result.geo;
                const label = activeTab === "seo" ? "Search Engine Optimization" : "Generative Engine Optimization";
                const accentColor = activeTab === "seo" ? "#6366f1" : "#06b6d4";
                return (
                  <div>
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: accentColor, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "4px" }}>{activeTab.toUpperCase()}</div>
                      <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>{label}</div>
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        {[
                          { count: passCount(data.checks), label: "OK", color: "#22c55e" },
                          { count: warnCount(data.checks), label: "Varoitus", color: "#f59e0b" },
                          { count: failCount(data.checks), label: "Ongelma", color: "#ef4444" }
                        ].map(s => (
                          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "18px", fontFamily: "'DM Mono', monospace", fontWeight: "700", color: s.color }}>{s.count}</span>
                            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace" }}>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: "24px" }}>
                      {data.checks.map(c => <CheckRow key={c.id} check={c} />)}
                    </div>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px" }}>
                      <div style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "12px" }}>Tärkeimmät korjaukset</div>
                      {data.topIssues.map((issue, i) => (
                        <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "8px" }}>
                          <span style={{ color: accentColor, fontFamily: "'DM Mono', monospace", fontSize: "12px", marginTop: "1px", flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", lineHeight: "1.5" }}>{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {activeTab === "wins" && (
                <div>
                  <div style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "#a855f7", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "4px" }}>Quick Wins</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "20px" }}>Nämä toimenpiteet antavat nopeimman hyödyn</div>
                  {result.quickWins.map((win, i) => (
                    <div key={i} style={{
                      display: "flex", gap: "14px", alignItems: "flex-start",
                      padding: "14px 16px", marginBottom: "8px",
                      background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)",
                      borderRadius: "10px"
                    }}>
                      <div style={{
                        width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                        background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#a855f7", fontWeight: "700"
                      }}>{i + 1}</div>
                      <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: "1.5" }}>{win}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: "48px", textAlign: "center" }}>
          <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>
            DEVKARHU · SEO & GEO ANALYZER
          </span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
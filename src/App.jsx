import { useState, useCallback } from "react";

const ANALYZE_PROMPT = `You are an expert SEO and GEO (Generative Engine Optimization) analyst. Analyze the provided blog post content and target keyword.

Return ONLY a valid JSON object with this exact structure:
{
  "overallScore": 72,
  "seoScore": 68,
  "geoScore": 76,
  "keywordScore": 61,
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
  "keyword": {
    "checks": [
      { "id": "kw_in_title", "label": "Keyword in Title", "status": "pass", "note": "Target keyword found in H1." },
      { "id": "kw_in_intro", "label": "Keyword in First 100 Words", "status": "fail", "note": "Keyword missing from opening paragraph." },
      { "id": "kw_in_headings", "label": "Keyword in Subheadings", "status": "warn", "note": "Keyword in 1 of 4 H2 headings." },
      { "id": "kw_variations", "label": "Semantic Variations Used", "status": "pass", "note": "Related terms and synonyms detected." },
      { "id": "kw_density", "label": "Keyword Density (1–2%)", "status": "fail", "note": "Only 0.3% — too sparse for target keyword." },
      { "id": "kw_entities", "label": "Topic Entities Around Keyword", "status": "warn", "note": "Few supporting entities that signal topical authority." }
    ],
    "topIssues": ["Use keyword in first paragraph", "Add keyword to at least 2 more H2 headings", "Increase keyword frequency naturally throughout text"]
  },
  "quickWins": [
    "Write a meta description (150–160 chars) with your main keyword",
    "Add FAQ section with 3–5 common questions",
    "Add JSON-LD BlogPosting schema markup",
    "Include at least 2–3 internal links to related posts",
    "Add a TL;DR summary block at the top"
  ]
}

Analyze the actual content provided. Be specific in notes. Scores should reflect real quality. Status must be exactly "pass", "warn", or "fail".`;

const IMPROVE_PROMPT = `You are an expert SEO and GEO content optimizer. You will receive a blog post and a target keyword. Rewrite the content to maximize SEO and GEO visibility.

Rules:
- Keep the author's voice, tone, and core message intact
- Do NOT invent facts, statistics, or sources that don't exist in the original
- Naturally integrate the target keyword: in the title, first paragraph, subheadings, and throughout
- Add a TL;DR block at the very top
- Convert at least 2 subheadings into question format
- Add a FAQ section at the end with 3 to 5 real questions
- Use bullet points or numbered lists where appropriate
- Add a meta description line at the very top (before TL;DR) in format: "Meta description: ..." — must be 150–160 characters and include the target keyword
- Shorten the title to under 60 characters while keeping the target keyword
- Include the target keyword naturally in the second H2 heading

CRITICAL - Output format with diff markers:
- Wrap every added or changed word/phrase with [[ADD:the new text]]
- Wrap every removed word/phrase with [[DEL:the removed text]]
- Unchanged text stays as-is with NO markers
- Brand new sections (TL;DR, FAQ) that did not exist: wrap the entire section content in [[ADD:...]]
- Example: "Talvipyoraily [[DEL:on hauskaa]] [[ADD:aloittelijalle on helpompaa kuin luulet]] Tampereella"
- Return ONLY the marked-up improved text, no explanations or preamble`;

// Parse [[ADD:...]] and [[DEL:...]] markers into React spans
function renderDiff(text) {
  if (!text) return null;
  const parts = [];
  const regex = /\[\[(ADD|DEL):([^\]]*)\]\]/g;
  let last = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    }
    const type = match[1];
    const content = match[2];
    if (type === "ADD") {
      parts.push(
        <mark key={key++} style={{
          background: "rgba(34,197,94,0.25)",
          color: "#86efac",
          borderRadius: "3px",
          padding: "1px 3px",
          textDecoration: "none",
          borderBottom: "2px solid rgba(34,197,94,0.6)"
        }}>{content}</mark>
      );
    } else {
      parts.push(
        <span key={key++} style={{
          background: "rgba(239,68,68,0.2)",
          color: "rgba(252,165,165,0.7)",
          borderRadius: "3px",
          padding: "1px 3px",
          textDecoration: "line-through",
          textDecorationColor: "rgba(239,68,68,0.7)"
        }}>{content}</span>
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(<span key={key++}>{text.slice(last)}</span>);
  }

  return parts;
}

// Strip diff markers to get clean improved text for copying
function stripDiff(text) {
  return text
    .replace(/\[\[DEL:[^\]]*\]\]/g, "")
    .replace(/\[\[ADD:([^\]]*)\]\]/g, "$1")
    .replace(/  +/g, " ")
    .trim();
}

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
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"/>
        <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 42 42)" style={{ transition: "stroke-dashoffset 1s ease" }}/>
        <text x="42" y="38" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" fontFamily="'DM Mono', monospace">{score}</text>
        <text x="42" y="51" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="'DM Mono', monospace">/100</text>
      </svg>
      <span style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
};

const CheckRow = ({ check }) => {
  const colors = { pass: "#22c55e", warn: "#f59e0b", fail: "#ef4444" };
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", borderLeft: `2px solid ${colors[check.status]}20`, marginBottom: "6px" }}>
      <div style={{ marginTop: "1px", flexShrink: 0 }}><StatusIcon status={check.status} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.85)", marginBottom: "2px" }}>{check.label}</div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: "1.4", fontFamily: "Georgia, serif" }}>{check.note}</div>
      </div>
    </div>
  );
};

const callApi = async (systemPrompt, userMsg) => {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userMsg })
  });
  return res.json();
};

export default function App() {
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [result, setResult] = useState(null);
  const [improved, setImproved] = useState(null); // raw with [[ADD:]] [[DEL:]] markers
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("seo");
  const [copied, setCopied] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [serpTitle, setSerpTitle] = useState("");
  const [serpDesc, setSerpDesc] = useState("");
  const [showSerp, setShowSerp] = useState(false);

  const fetchUrl = useCallback(async () => {
    if (!url.trim()) return;
    setFetching(true);
    setError("");
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setContent(data.text); }
    } catch { setError("Sivun haku epäonnistui."); }
    finally { setFetching(false); }
  }, [url]);

  const analyze = useCallback(async () => {
    if (!content.trim()) { setError("Liitä blogipostauksen sisältö kenttään."); return; }
    setLoading(true); setError(""); setResult(null); setImproved(null);
    const userMsg = `${url ? `URL: ${url}\n` : ""}${keyword ? `Target keyword: ${keyword}\n` : ""}Content:\n${content}`;
    try {
      const data = await callApi(ANALYZE_PROMPT, userMsg);
      const raw = data.content?.map(b => b.text || "").join("") || "";
      setResult(JSON.parse(raw.replace(/```json|```/g, "").trim()));
      setActiveTab("seo");
    } catch { setError("Analyysi epäonnistui. Tarkista syöte ja yritä uudelleen."); }
    finally { setLoading(false); }
  }, [url, content, keyword]);

  const improve = useCallback(async () => {
    if (!content.trim()) return;
    setImproving(true); setImproved(null);
    const userMsg = `Target keyword: "${keyword || "not specified"}"\n\nOriginal content:\n${content}`;
    try {
      const data = await callApi(IMPROVE_PROMPT, userMsg);
      const text = data.content?.map(b => b.text || "").join("") || "";
      setImproved(text.trim());
      setActiveTab("compare");
    } catch { setError("Tekstin parantaminen epäonnistui."); }
    finally { setImproving(false); }
  }, [content, keyword]);

  const copyImproved = () => {
    navigator.clipboard.writeText(stripDiff(improved));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const useImproved = () => {
    setContent(stripDiff(improved));
    setImproved(null);
    setResult(null);
    setActiveTab("seo");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const passCount = c => c.filter(x => x.status === "pass").length;
  const failCount = c => c.filter(x => x.status === "fail").length;
  const warnCount = c => c.filter(x => x.status === "warn").length;

  const tabs = [
    { id: "seo", label: "SEO" },
    { id: "geo", label: "GEO" },
    { id: "keyword", label: "Avainsana" },
    { id: "wins", label: "Quick Wins" },
    ...(improved ? [{ id: "compare", label: "✦ Muutokset" }] : [])
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "Georgia, serif", color: "white" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, opacity: 0.6 }}/>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "820px", margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 16 16"><path d="M2 4h12M2 8h8M2 12h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>DevKarhu</span>
          </div>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 38px)", fontWeight: "400", margin: "0 0 8px", lineHeight: "1.1", letterSpacing: "-0.02em" }}>
            SEO <span style={{ color: "#6366f1" }}>&</span> GEO<br/>Analyzer
          </h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "14px", lineHeight: "1.6" }}>
            Analysoi, kohdistu avainsanaan ja paranna tekstiä — muutokset korostettu.
          </p>
        </div>

        {/* Input */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "7px" }}>URL (valinnainen)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://sivu.fi/blogi/postaus"
                  style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "9px 12px", color: "white", fontSize: "13px", fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  onKeyDown={e => e.key === "Enter" && fetchUrl()}
                />
                <button onClick={fetchUrl} disabled={!url.trim() || fetching} style={{
                  padding: "9px 14px", background: fetching ? "rgba(99,102,241,0.2)" : !url.trim() ? "rgba(255,255,255,0.04)" : "rgba(99,102,241,0.2)",
                  border: "1px solid " + (!url.trim() ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.4)"),
                  borderRadius: "8px", color: !url.trim() ? "rgba(255,255,255,0.2)" : "#a5b4fc",
                  fontSize: "11px", fontFamily: "'DM Mono', monospace", fontWeight: "600",
                  cursor: !url.trim() || fetching ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: "5px"
                }}>
                  {fetching ? <><svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 1s linear infinite" }}><circle cx="8" cy="8" r="6" stroke="#a5b4fc" strokeWidth="2" strokeOpacity="0.3"/><path d="M8 2a6 6 0 0 1 6 6" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round"/></svg>Haetaan...</> : "Hae →"}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "7px" }}>
                Kohdeavainsana <span style={{ color: "#f59e0b" }}>★</span>
              </label>
              <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="esim. talvipyöräily aloittelijalle"
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "8px", padding: "9px 12px", color: "white", fontSize: "13px", fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "rgba(245,158,11,0.6)"} onBlur={e => e.target.style.borderColor = "rgba(245,158,11,0.25)"}
              />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "7px" }}>Postauksen sisältö</label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Liitä blogipostauksen koko teksti tähän. Otsikko, väliotsikot ja kaikki kappaleet..." rows={8}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px 14px", color: "white", fontSize: "14px", fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: "1.6" }}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
            {(() => {
              const words = content.trim() ? content.trim().split(/\s+/).length : 0;
              const color = words === 0 ? "rgba(255,255,255,0.2)" : words < 400 ? "#ef4444" : words < 800 ? "#f59e0b" : "#22c55e";
              const label = words === 0 ? "" : words < 400 ? "liian lyhyt" : words < 800 ? "kohtalainen" : "hyvä";
              return words > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color, fontWeight: "600" }}>{words} sanaa</span>
                  <span style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.25)" }}>—</span>
                  <span style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.3)" }}>{label}</span>
                  <span style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.15)", marginLeft: "auto" }}>tavoite &gt;800</span>
                </div>
              ) : null;
            })()}
          </div>

          {/* SERP Preview section */}
          <div style={{ marginBottom: "16px" }}>
            <button onClick={() => setShowSerp(s => !s)} style={{
              background: "none", border: "none", padding: "0", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.15em", textTransform: "uppercase"
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: showSerp ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <path d="M3 2l4 3-4 3" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              SERP-esikatselu
            </button>
            {showSerp && (
              <div style={{ marginTop: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>
                      Title <span style={{ color: serpTitle.length > 60 ? "#ef4444" : serpTitle.length > 50 ? "#22c55e" : "rgba(255,255,255,0.2)" }}>{serpTitle.length}/60</span>
                    </label>
                    <input value={serpTitle} onChange={e => setSerpTitle(e.target.value)}
                      placeholder="Sivun otsikko..."
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 12px", color: "white", fontSize: "13px", fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>
                      Meta description <span style={{ color: serpDesc.length > 160 ? "#ef4444" : serpDesc.length > 140 ? "#22c55e" : "rgba(255,255,255,0.2)" }}>{serpDesc.length}/160</span>
                    </label>
                    <input value={serpDesc} onChange={e => setSerpDesc(e.target.value)}
                      placeholder="Meta description..."
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 12px", color: "white", fontSize: "13px", fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                    />
                  </div>
                </div>
                {/* Google SERP mockup */}
                <div style={{ background: "white", borderRadius: "10px", padding: "16px 20px", fontFamily: "Arial, sans-serif" }}>
                  <div style={{ fontSize: "12px", color: "#4d5156", marginBottom: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#e8eaed", flexShrink: 0 }}/>
                    <span style={{ color: "#202124" }}>{url || "https://sinunsivu.fi/blogi/postaus"}</span>
                  </div>
                  <div style={{
                    fontSize: "18px", color: serpTitle.length > 60 ? "#d93025" : "#1a0dab",
                    marginBottom: "4px", lineHeight: "1.3",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                  }}>
                    {serpTitle || <span style={{ color: "#9aa0a6" }}>Ei otsikkoa — kirjoita title yllä</span>}
                  </div>
                  {serpTitle.length > 60 && (
                    <div style={{ fontSize: "11px", color: "#d93025", marginBottom: "4px", fontFamily: "'DM Mono', monospace" }}>
                      ⚠ Title liian pitkä ({serpTitle.length} merkkiä) — Google katkaisee sen
                    </div>
                  )}
                  <div style={{
                    fontSize: "13px", color: "#4d5156", lineHeight: "1.5",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
                  }}>
                    {serpDesc || <span style={{ color: "#9aa0a6" }}>Ei meta descriptionia — Google generoi oman kuvauksen automaattisesti.</span>}
                  </div>
                  {serpDesc.length > 160 && (
                    <div style={{ fontSize: "11px", color: "#d93025", marginTop: "4px", fontFamily: "'DM Mono', monospace" }}>
                      ⚠ Description liian pitkä ({serpDesc.length} merkkiä) — Google katkaisee sen
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && <div style={{ marginBottom: "16px", padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", fontSize: "13px", color: "#ef4444" }}>{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button onClick={analyze} disabled={loading || improving} style={{
              padding: "12px 20px", background: loading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none", borderRadius: "10px", color: "white", fontSize: "13px", fontFamily: "'DM Mono', monospace",
              fontWeight: "600", letterSpacing: "0.05em", cursor: loading || improving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "7px"
            }}>
              {loading ? <><svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 1s linear infinite" }}><circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.3"/><path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>Analysoidaan...</> : "Analysoi →"}
            </button>
            <button onClick={improve} disabled={!content.trim() || improving || loading} style={{
              padding: "12px 20px",
              background: improving ? "rgba(168,85,247,0.3)" : !content.trim() ? "rgba(255,255,255,0.04)" : "rgba(168,85,247,0.15)",
              border: `1px solid ${!content.trim() ? "rgba(255,255,255,0.08)" : "rgba(168,85,247,0.4)"}`,
              borderRadius: "10px", color: !content.trim() ? "rgba(255,255,255,0.25)" : "#c084fc",
              fontSize: "13px", fontFamily: "'DM Mono', monospace", fontWeight: "600", letterSpacing: "0.05em",
              cursor: !content.trim() || improving || loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "7px"
            }}>
              {improving ? <><svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 1s linear infinite" }}><circle cx="8" cy="8" r="6" stroke="#c084fc" strokeWidth="2" strokeOpacity="0.3"/><path d="M8 2a6 6 0 0 1 6 6" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/></svg>Parannetaan...</> : "✦ Paranna teksti"}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "28px 24px", marginBottom: "16px" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>{result.title || "Analysoitu postaus"}</span>
              </div>
              <div style={{ display: "flex", gap: "24px", justifyContent: "center", flexWrap: "wrap" }}>
                <ScoreRing score={result.overallScore} label="Kokonais" color="#a855f7" />
                <ScoreRing score={result.seoScore} label="SEO" color="#6366f1" />
                <ScoreRing score={result.geoScore} label="GEO" color="#06b6d4" />
                {keyword && <ScoreRing score={result.keywordScore || 50} label="Avainsana" color="#f59e0b" />}
              </div>
            </div>

            <div style={{ display: "flex", gap: "3px", marginBottom: "12px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "4px", flexWrap: "wrap" }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  flex: 1, minWidth: "60px", padding: "7px 10px",
                  background: activeTab === tab.id ? (tab.id === "compare" ? "rgba(168,85,247,0.3)" : "rgba(99,102,241,0.3)") : "transparent",
                  border: activeTab === tab.id ? `1px solid ${tab.id === "compare" ? "rgba(168,85,247,0.4)" : "rgba(99,102,241,0.4)"}` : "1px solid transparent",
                  borderRadius: "7px", color: activeTab === tab.id ? "white" : "rgba(255,255,255,0.4)",
                  fontSize: "11px", fontFamily: "'DM Mono', monospace", fontWeight: "600",
                  letterSpacing: "0.06em", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap"
                }}>{tab.label}</button>
              ))}
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px" }}>

              {(activeTab === "seo" || activeTab === "geo" || activeTab === "keyword") && (() => {
                const dataMap = { seo: result.seo, geo: result.geo, keyword: result.keyword };
                const labelMap = { seo: "Search Engine Optimization", geo: "Generative Engine Optimization", keyword: `Kohdennusanalyysi: "${keyword || "—"}"` };
                const colorMap = { seo: "#6366f1", geo: "#06b6d4", keyword: "#f59e0b" };
                const data = dataMap[activeTab];
                const accentColor = colorMap[activeTab];
                if (!data) return <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Ei dataa.</div>;
                return (
                  <div>
                    <div style={{ marginBottom: "18px" }}>
                      <div style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: accentColor, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3px" }}>{activeTab.toUpperCase()}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginBottom: "14px" }}>{labelMap[activeTab]}</div>
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        {[{ count: passCount(data.checks), label: "OK", color: "#22c55e" }, { count: warnCount(data.checks), label: "Varoitus", color: "#f59e0b" }, { count: failCount(data.checks), label: "Ongelma", color: "#ef4444" }].map(s => (
                          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span style={{ fontSize: "17px", fontFamily: "'DM Mono', monospace", fontWeight: "700", color: s.color }}>{s.count}</span>
                            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: "20px" }}>{data.checks.map(c => <CheckRow key={c.id} check={c} />)}</div>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "18px" }}>
                      <div style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>Tärkeimmät korjaukset</div>
                      {data.topIssues.map((issue, i) => (
                        <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "7px" }}>
                          <span style={{ color: accentColor, fontFamily: "'DM Mono', monospace", fontSize: "11px", marginTop: "2px", flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.5" }}>{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {activeTab === "wins" && (
                <div>
                  <div style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#a855f7", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3px" }}>Quick Wins</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginBottom: "18px" }}>Nämä toimenpiteet antavat nopeimman hyödyn</div>
                  {result.quickWins.map((win, i) => (
                    <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px 14px", marginBottom: "8px", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: "10px" }}>
                      <div style={{ width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0, background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#a855f7", fontWeight: "700" }}>{i + 1}</div>
                      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: "1.5" }}>{win}</span>
                    </div>
                  ))}
                </div>
              )}


              {/* Diff / compare view */}
              {activeTab === "compare" && improved && (
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <div style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#a855f7", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px" }}>✦ Parannettu versio — muutokset korostettu</div>
                      <div style={{ display: "flex", gap: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "2px", background: "rgba(34,197,94,0.3)", border: "1px solid rgba(34,197,94,0.5)" }}/>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>Lisätty</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "2px", background: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.4)" }}/>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>Poistettu</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      <button onClick={copyImproved} style={{ padding: "7px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "rgba(255,255,255,0.7)", fontSize: "11px", fontFamily: "'DM Mono', monospace", cursor: "pointer" }}>
                        {copied ? "✓ Kopioitu" : "Kopioi puhdas"}
                      </button>
                      <button onClick={useImproved} style={{ padding: "7px 14px", background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: "8px", color: "#c084fc", fontSize: "11px", fontFamily: "'DM Mono', monospace", cursor: "pointer", fontWeight: "600" }}>
                        Käytä tätä →
                      </button>
                    </div>
                  </div>

                  {/* Diff rendered text */}
                  <div style={{
                    background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.15)",
                    borderRadius: "12px", padding: "24px",
                    fontSize: "14px", lineHeight: "1.8", color: "rgba(255,255,255,0.8)",
                    fontFamily: "Georgia, serif", whiteSpace: "pre-wrap", wordBreak: "break-word"
                  }}>
                    {renderDiff(improved)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: "48px", textAlign: "center" }}>
          <span style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em" }}>DEVKARHU · SEO & GEO ANALYZER</span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
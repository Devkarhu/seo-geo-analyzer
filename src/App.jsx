import { useState, useCallback } from "react";

// ─── Prompts per content type ───────────────────────────────────────────────

const PROMPTS = {
  blog: `You are an expert SEO and GEO analyst. Analyze the blog post for SEO, GEO, keyword targeting, and E-E-A-T signals.
Return ONLY valid JSON:
{
  "overallScore": 72, "seoScore": 68, "geoScore": 76, "keywordScore": 61,
  "title": "detected title", "summary": "one sentence summary",
  "seo": {
    "checks": [
      {"id":"title_length","label":"Title Length (50–60 chars)","status":"pass","note":"Title is 54 chars."},
      {"id":"meta_desc","label":"Meta Description","status":"warn","note":"No meta description found."},
      {"id":"h1","label":"Single H1","status":"pass","note":"One H1 found."},
      {"id":"keyword_density","label":"Keyword Density (1–3%)","status":"fail","note":"Keyword at 0.2%."},
      {"id":"internal_links","label":"Internal Links","status":"warn","note":"No internal links."},
      {"id":"image_alt","label":"Image Alt Text","status":"pass","note":"All images have alt."},
      {"id":"content_length","label":"Content Length (>800 words)","status":"pass","note":"~1240 words."},
      {"id":"headings","label":"H2/H3 Structure","status":"pass","note":"Clear heading hierarchy."},
      {"id":"url_slug","label":"URL Slug","status":"pass","note":"Clean slug."},
      {"id":"schema","label":"Schema Markup","status":"fail","note":"No JSON-LD found."}
    ],
    "topIssues":["Add meta description","Add schema markup","Increase keyword density"]
  },
  "geo": {
    "checks": [
      {"id":"direct_answer","label":"Direct Answer Paragraph","status":"pass","note":"Opens with direct answer."},
      {"id":"question_heads","label":"Question-Based Headings","status":"warn","note":"Only 1 question heading."},
      {"id":"entities","label":"Named Entities","status":"pass","note":"Good entity coverage."},
      {"id":"citations","label":"External Citations","status":"fail","note":"No external sources."},
      {"id":"faq","label":"FAQ Section","status":"fail","note":"No FAQ found."},
      {"id":"definitions","label":"Concise Definitions","status":"pass","note":"Terms defined inline."},
      {"id":"brand","label":"Brand/Author Signals","status":"warn","note":"No author byline."},
      {"id":"freshness","label":"Freshness Signals","status":"pass","note":"Date visible."},
      {"id":"lists","label":"Lists/Tables","status":"pass","note":"Good use of lists."},
      {"id":"tldr","label":"TL;DR Block","status":"fail","note":"No TL;DR found."}
    ],
    "topIssues":["Add FAQ section","Add external citations","Add TL;DR block"]
  },
  "keyword": {
    "checks": [
      {"id":"kw_title","label":"Keyword in Title","status":"pass","note":"Keyword in H1."},
      {"id":"kw_intro","label":"Keyword in First 100 Words","status":"fail","note":"Missing from intro."},
      {"id":"kw_h2","label":"Keyword in H2 Headings","status":"warn","note":"Only in 1 of 4 H2s."},
      {"id":"kw_variations","label":"Semantic Variations","status":"pass","note":"Good synonym use."},
      {"id":"kw_density","label":"Keyword Density (1–2%)","status":"fail","note":"Only 0.3%."},
      {"id":"kw_entities","label":"Supporting Entities","status":"warn","note":"Few topical entities."}
    ],
    "topIssues":["Use keyword in intro","Add keyword to more H2s","Increase density naturally"]
  },
  "eeat": {
    "score": 58,
    "checks": [
      {"id":"author","label":"Author Name & Bio","status":"fail","note":"No author info found."},
      {"id":"firsthand","label":"First-Hand Experience","status":"warn","note":"No personal experience references."},
      {"id":"date","label":"Publish Date","status":"pass","note":"Date is visible."},
      {"id":"sources","label":"External Sources","status":"fail","note":"No external links."},
      {"id":"facts","label":"Specific Facts & Numbers","status":"pass","note":"Good use of specifics."},
      {"id":"expertise","label":"Expertise Signals","status":"warn","note":"No credentials mentioned."},
      {"id":"brand","label":"Brand Identity","status":"warn","note":"Brand not mentioned in text."},
      {"id":"updated","label":"Content Freshness","status":"pass","note":"Content appears current."}
    ],
    "topIssues":["Add author bio","Link to external sources","Reference personal experience"]
  },
  "quickWins":["Write meta description with keyword","Add FAQ section","Add JSON-LD schema","Add 2–3 internal links","Add TL;DR block"]
}
Analyze the actual content. Be specific. Status must be exactly "pass", "warn", or "fail".`,

  instagram: `You are an Instagram content optimization expert. Analyze the caption for discoverability, engagement, and reach.
Return ONLY valid JSON:
{
  "overallScore": 65, "seoScore": 60, "geoScore": 55, "keywordScore": 58,
  "title": "Caption preview", "summary": "one sentence summary",
  "seo": {
    "checks": [
      {"id":"hook","label":"Hook (First 125 chars)","status":"pass","note":"Strong opening hook."},
      {"id":"hashtags_count","label":"Hashtag Count (5–15)","status":"warn","note":"Only 3 hashtags found."},
      {"id":"hashtag_mix","label":"Hashtag Mix (niche + broad)","status":"fail","note":"Only broad hashtags."},
      {"id":"keyword_caption","label":"Keywords in Caption","status":"pass","note":"Good keyword use."},
      {"id":"cta","label":"Call-to-Action","status":"fail","note":"No CTA found."},
      {"id":"alt_text","label":"Alt Text (accessibility)","status":"fail","note":"Alt text not mentioned."},
      {"id":"length","label":"Caption Length (optimal 138–150 words)","status":"warn","note":"Caption too short."},
      {"id":"emoji","label":"Emoji Usage","status":"pass","note":"Good emoji use."},
      {"id":"line_breaks","label":"Readability / Line Breaks","status":"warn","note":"Could use more breaks."},
      {"id":"location","label":"Location Tag Mentioned","status":"fail","note":"No location reference."}
    ],
    "topIssues":["Add clear CTA","Diversify hashtags with niche tags","Add alt text description"]
  },
  "geo": {
    "checks": [
      {"id":"searchable","label":"Searchable Keywords in Caption","status":"pass","note":"Keywords present."},
      {"id":"question","label":"Question to Drive Comments","status":"fail","note":"No question asked."},
      {"id":"value","label":"Value/Information Provided","status":"warn","note":"Mostly promotional."},
      {"id":"shareable","label":"Share-Worthy Content Signal","status":"pass","note":"Relatable content."},
      {"id":"brand_voice","label":"Consistent Brand Voice","status":"pass","note":"Tone is consistent."},
      {"id":"saves","label":"Save-Worthy Content","status":"warn","note":"No tips or lists to save."},
      {"id":"collab","label":"Collaboration/Tag Signals","status":"fail","note":"No @mentions or collabs."},
      {"id":"timing","label":"Freshness/Trend Signals","status":"warn","note":"No trending references."}
    ],
    "topIssues":["Ask a question to boost comments","Add save-worthy tips or list","Reference trending topic"]
  },
  "keyword": {
    "checks": [
      {"id":"primary_kw","label":"Primary Keyword in First Line","status":"warn","note":"Keyword not in first line."},
      {"id":"hashtag_kw","label":"Keyword as Hashtag","status":"pass","note":"Keyword used as hashtag."},
      {"id":"kw_natural","label":"Natural Keyword Integration","status":"pass","note":"Flows naturally."},
      {"id":"long_tail","label":"Long-Tail Hashtags","status":"fail","note":"No specific niche hashtags."},
      {"id":"location_kw","label":"Location Keywords","status":"warn","note":"No location tags."},
      {"id":"trending","label":"Trending Keywords","status":"warn","note":"No trending terms used."}
    ],
    "topIssues":["Put keyword in first line","Add long-tail niche hashtags","Add location keyword"]
  },
  "eeat": {
    "score": 50,
    "checks": [
      {"id":"author","label":"Personal Story/Experience","status":"warn","note":"No personal angle."},
      {"id":"firsthand","label":"Behind-the-Scenes Content","status":"fail","note":"No BTS shown."},
      {"id":"date","label":"Timely/Seasonal Reference","status":"warn","note":"Not time-specific."},
      {"id":"sources","label":"Data or Source Reference","status":"fail","note":"No stats or sources."},
      {"id":"facts","label":"Specific Details","status":"pass","note":"Some specifics present."},
      {"id":"expertise","label":"Expertise Signal","status":"warn","note":"No credentials shown."},
      {"id":"brand","label":"Brand Consistency","status":"pass","note":"On-brand tone."},
      {"id":"updated","label":"Fresh/Relevant Content","status":"warn","note":"Could tie to current trend."}
    ],
    "topIssues":["Add personal story element","Reference a stat or data point","Tie to current trend or season"]
  },
  "quickWins":["Add strong CTA (comment, save, share)","Mix niche + broad hashtags","Ask a question in caption","Add location tag","Write alt text for image"]
}
Analyze the actual caption. Status must be exactly "pass", "warn", or "fail".`,

  substack: `You are a Substack and email newsletter optimization expert. Analyze for open rates, readability, and subscriber growth.
Return ONLY valid JSON:
{
  "overallScore": 70, "seoScore": 65, "geoScore": 68, "keywordScore": 60,
  "title": "Newsletter title", "summary": "one sentence summary",
  "seo": {
    "checks": [
      {"id":"subject","label":"Subject Line (40–60 chars)","status":"pass","note":"Good length."},
      {"id":"preview","label":"Preview Text Optimized","status":"warn","note":"Preview text not specified."},
      {"id":"hook","label":"Opening Hook (First Paragraph)","status":"pass","note":"Strong opening."},
      {"id":"length","label":"Content Length (600–1500 words)","status":"pass","note":"~900 words."},
      {"id":"subheadings","label":"Subheadings for Scannability","status":"warn","note":"Few subheadings."},
      {"id":"links","label":"Internal Links to Archives","status":"fail","note":"No links to past issues."},
      {"id":"cta","label":"Clear CTA (subscribe/share)","status":"fail","note":"No CTA found."},
      {"id":"personalization","label":"Personalization Signals","status":"warn","note":"Not personalized."},
      {"id":"images","label":"Images/Visual Breaks","status":"pass","note":"Good visual use."},
      {"id":"mobile","label":"Mobile-Readable Format","status":"pass","note":"Short paragraphs."}
    ],
    "topIssues":["Optimize preview text","Add CTA to share or subscribe","Link to related past issues"]
  },
  "geo": {
    "checks": [
      {"id":"quotable","label":"Quotable/Shareable Sentences","status":"warn","note":"Few standalone quotes."},
      {"id":"unique","label":"Unique Insight or POV","status":"pass","note":"Original perspective."},
      {"id":"data","label":"Data or Research Cited","status":"fail","note":"No data referenced."},
      {"id":"actionable","label":"Actionable Takeaways","status":"pass","note":"Good action items."},
      {"id":"niche","label":"Niche Authority Signals","status":"warn","note":"Could be more specific."},
      {"id":"community","label":"Community/Conversation Hook","status":"fail","note":"No reader question."},
      {"id":"tldr","label":"TL;DR or Key Takeaways","status":"fail","note":"No summary block."},
      {"id":"story","label":"Story or Personal Narrative","status":"pass","note":"Good story element."}
    ],
    "topIssues":["Add TL;DR at top","Include data or research","End with reader question"]
  },
  "keyword": {
    "checks": [
      {"id":"kw_subject","label":"Keyword in Subject Line","status":"warn","note":"Keyword not in subject."},
      {"id":"kw_intro","label":"Keyword in First Paragraph","status":"pass","note":"Keyword in intro."},
      {"id":"kw_subheads","label":"Keyword in Subheadings","status":"fail","note":"Not in subheadings."},
      {"id":"kw_natural","label":"Natural Repetition","status":"pass","note":"Good keyword flow."},
      {"id":"related","label":"Related Terms Used","status":"warn","note":"Few semantic variations."},
      {"id":"seo_title","label":"SEO-Optimized Post Title","status":"warn","note":"Title not SEO-optimized."}
    ],
    "topIssues":["Put keyword in subject line","Add keyword to subheadings","Use more semantic variations"]
  },
  "eeat": {
    "score": 62,
    "checks": [
      {"id":"author","label":"Author Voice & Personality","status":"pass","note":"Strong author voice."},
      {"id":"firsthand","label":"Personal Experience/Story","status":"pass","note":"Personal elements present."},
      {"id":"date","label":"Timely Topic","status":"warn","note":"Could be more timely."},
      {"id":"sources","label":"Sources & References","status":"fail","note":"No sources cited."},
      {"id":"facts","label":"Specific Facts/Numbers","status":"warn","note":"Few specifics."},
      {"id":"expertise","label":"Expertise Demonstration","status":"pass","note":"Knowledge shown."},
      {"id":"brand","label":"Consistent Newsletter Brand","status":"pass","note":"On-brand."},
      {"id":"updated","label":"Fresh Perspective","status":"warn","note":"Could reference current events."}
    ],
    "topIssues":["Cite sources or data","Add more specific numbers","Reference current events or trends"]
  },
  "quickWins":["Write compelling preview text","Add TL;DR at the top","End with a reader question","Link to 2 past issues","Add one data point or stat"]
}
Analyze the actual content. Status must be exactly "pass", "warn", or "fail".`,

  linkedin: `You are a LinkedIn content optimization expert. Analyze for algorithm reach, engagement, and professional authority.
Return ONLY valid JSON:
{
  "overallScore": 68, "seoScore": 62, "geoScore": 72, "keywordScore": 65,
  "title": "Post preview", "summary": "one sentence summary",
  "seo": {
    "checks": [
      {"id":"hook","label":"Hook (First 2–3 Lines)","status":"pass","note":"Good hook before see more."},
      {"id":"no_links","label":"No External Links in Post","status":"fail","note":"External link reduces reach."},
      {"id":"length","label":"Post Length (1000–1300 chars)","status":"warn","note":"Too short for algorithm."},
      {"id":"line_breaks","label":"Line Breaks & Readability","status":"pass","note":"Good formatting."},
      {"id":"cta","label":"Call-to-Action","status":"fail","note":"No CTA found."},
      {"id":"hashtags","label":"Hashtags (3–5)","status":"warn","note":"Too many hashtags."},
      {"id":"native","label":"Native Content (no link)","status":"pass","note":"No external links."},
      {"id":"emoji","label":"Strategic Emoji Use","status":"warn","note":"Overuse of emojis."},
      {"id":"story","label":"Personal Story Element","status":"fail","note":"No personal narrative."},
      {"id":"comment_bait","label":"Comment-Driving Question","status":"fail","note":"No question asked."}
    ],
    "topIssues":["Add comment-driving question","Include personal story","Move links to comments"]
  },
  "geo": {
    "checks": [
      {"id":"authority","label":"Professional Authority Signal","status":"warn","note":"Credentials not mentioned."},
      {"id":"unique_pov","label":"Unique Point of View","status":"pass","note":"Original perspective."},
      {"id":"data","label":"Data or Industry Insight","status":"fail","note":"No data cited."},
      {"id":"actionable","label":"Actionable Advice","status":"pass","note":"Good takeaways."},
      {"id":"controversy","label":"Contrarian or Bold Claim","status":"warn","note":"Safe perspective."},
      {"id":"community","label":"Tags Relevant People/Companies","status":"fail","note":"No @mentions."},
      {"id":"series","label":"Part of Content Series","status":"warn","note":"Standalone post."},
      {"id":"timing","label":"Timely Topic","status":"pass","note":"Relevant to current trends."}
    ],
    "topIssues":["Add bold/contrarian claim","Tag relevant people or companies","Cite industry data"]
  },
  "keyword": {
    "checks": [
      {"id":"kw_hook","label":"Keyword in First Line","status":"warn","note":"Keyword not in hook."},
      {"id":"kw_natural","label":"Natural Keyword Use","status":"pass","note":"Flows naturally."},
      {"id":"industry_terms","label":"Industry Terminology","status":"pass","note":"Good professional terms."},
      {"id":"hashtag_kw","label":"Keyword as Hashtag","status":"warn","note":"Keyword not hashtagged."},
      {"id":"profile_kw","label":"Keyword Aligns with Profile","status":"warn","note":"Cannot verify profile."},
      {"id":"trending","label":"Trending LinkedIn Keywords","status":"fail","note":"No trending terms."}
    ],
    "topIssues":["Put keyword in first line","Hashtag your primary keyword","Use trending industry terms"]
  },
  "eeat": {
    "score": 60,
    "checks": [
      {"id":"author","label":"Credentials Mentioned","status":"fail","note":"No credentials shown."},
      {"id":"firsthand","label":"Personal Experience","status":"warn","note":"Limited personal story."},
      {"id":"date","label":"Timely Reference","status":"pass","note":"Timely topic."},
      {"id":"sources","label":"Data/Source Reference","status":"fail","note":"No data cited."},
      {"id":"facts","label":"Specific Results/Numbers","status":"warn","note":"Few specifics."},
      {"id":"expertise","label":"Thought Leadership Signal","status":"warn","note":"Could be stronger."},
      {"id":"brand","label":"Personal Brand Consistency","status":"pass","note":"Consistent voice."},
      {"id":"updated","label":"Fresh Industry Insight","status":"warn","note":"Could be more specific."}
    ],
    "topIssues":["Mention specific results or numbers","Add your credentials or title","Cite a recent study or report"]
  },
  "quickWins":["Move any links to first comment","Add comment-driving question at end","Use 3–5 hashtags max","Add one specific number or result","Tag 1–2 relevant people"]
}
Analyze the actual content. Status must be exactly "pass", "warn", or "fail".`
};

const IMPROVE_PROMPT = `You are an expert content optimizer. You will receive content, its type, and a target keyword. Rewrite to maximize visibility and engagement for that content type.

For BLOG: Optimize for SEO + GEO — TL;DR, question headings, FAQ, keyword density, meta description, title under 60 chars, keyword in second H2.
For INSTAGRAM: Optimize hook, hashtags (niche + broad mix), CTA, question for comments, alt text suggestion.
For SUBSTACK: Optimize subject line, preview text, TL;DR, reader question, link to past issues.
For LINKEDIN: Strong hook, personal story, data point, question CTA, move links to comments note, 3–5 hashtags.

CRITICAL - Output format with diff markers:
- Wrap every added/changed phrase with [[ADD:text]]
- Wrap every removed phrase with [[DEL:text]]
- Unchanged text stays as-is
- New sections entirely in [[ADD:...]]
- Return ONLY the marked-up text, no explanations`;

// ─── Diff renderer ───────────────────────────────────────────────────────────

function renderDiff(text) {
  if (!text) return null;
  const parts = [];
  const regex = /\[\[(ADD|DEL):([^\]]*)\]\]/g;
  let last = 0, match, key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    const [, type, val] = match;
    parts.push(type === "ADD"
      ? <mark key={key++} style={{ background: "rgba(34,197,94,0.25)", color: "#86efac", borderRadius: "3px", padding: "1px 3px", borderBottom: "2px solid rgba(34,197,94,0.6)" }}>{val}</mark>
      : <span key={key++} style={{ background: "rgba(239,68,68,0.2)", color: "rgba(252,165,165,0.7)", borderRadius: "3px", padding: "1px 3px", textDecoration: "line-through", textDecorationColor: "rgba(239,68,68,0.7)" }}>{val}</span>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>);
  return parts;
}

function stripDiff(text) {
  return text.replace(/\[\[DEL:[^\]]*\]\]/g, "").replace(/\[\[ADD:([^\]]*)\]\]/g, "$1").replace(/ {2,}/g, " ").trim();
}

// ─── UI Components ───────────────────────────────────────────────────────────

const StatusIcon = ({ status }) => {
  if (status === "pass") return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#22c55e" fillOpacity="0.15" stroke="#22c55e" strokeWidth="1.5"/><path d="M5 8l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (status === "warn") return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2Z" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 7v3M8 11.5v.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/></svg>;
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1.5"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/></svg>;
};

const ScoreRing = ({ score, label, color, small }) => {
  const size = small ? 68 : 84;
  const cx = size / 2, r = small ? 26 : 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`} style={{ transition: "stroke-dashoffset 1s ease" }}/>
        <text x={cx} y={cx - 4} textAnchor="middle" fill="white" fontSize={small ? 13 : 16} fontWeight="700" fontFamily="'DM Mono', monospace">{score}</text>
        <text x={cx} y={cx + 9} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="'DM Mono', monospace">/100</text>
      </svg>
      <span style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center" }}>{label}</span>
    </div>
  );
};

const CheckRow = ({ check }) => {
  const colors = { pass: "#22c55e", warn: "#f59e0b", fail: "#ef4444" };
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", borderLeft: `2px solid ${colors[check.status]}20`, marginBottom: "5px" }}>
      <div style={{ marginTop: "1px", flexShrink: 0 }}><StatusIcon status={check.status} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "12px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.85)", marginBottom: "2px" }}>{check.label}</div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", lineHeight: "1.4" }}>{check.note}</div>
      </div>
    </div>
  );
};

const CONTENT_TYPES = [
  { id: "blog", label: "Blogi", icon: "✍" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "substack", label: "Substack", icon: "📨" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
];

const callApi = async (systemPrompt, userMsg) => {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userMsg })
  });
  return res.json();
};

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [contentType, setContentType] = useState("blog");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [result, setResult] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [improved, setImproved] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("seo");
  const [copied, setCopied] = useState(false);
  const [serpTitle, setSerpTitle] = useState("");
  const [serpDesc, setSerpDesc] = useState("");
  const [showSerp, setShowSerp] = useState(false);

  const fetchUrl = useCallback(async () => {
    if (!url.trim()) return;
    setFetching(true); setError("");
    try {
      const res = await fetch("/api/fetch-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setContent(data.text);
    } catch { setError("Sivun haku epäonnistui."); }
    finally { setFetching(false); }
  }, [url]);

  const analyze = useCallback(async () => {
    if (!content.trim()) { setError("Lisää sisältö ensin."); return; }
    setLoading(true); setError(""); setImproved(null);
    const userMsg = `Content type: ${contentType}\n${url ? `URL: ${url}\n` : ""}${keyword ? `Target keyword: ${keyword}\n` : ""}Content:\n${content}`;
    try {
      const data = await callApi(PROMPTS[contentType], userMsg);
      const raw = data.content?.map(b => b.text || "").join("") || "";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setResult(prev => { if (prev) setBaseline(prev); return parsed; });
      setActiveTab("seo");
    } catch { setError("Analyysi epäonnistui. Tarkista syöte ja yritä uudelleen."); }
    finally { setLoading(false); }
  }, [url, content, keyword, contentType]);

  const improve = useCallback(async () => {
    if (!content.trim()) return;
    setImproving(true); setImproved(null);
    const userMsg = `Content type: ${contentType}\nTarget keyword: "${keyword || "not specified"}"\n\nOriginal:\n${content}`;
    try {
      const data = await callApi(IMPROVE_PROMPT, userMsg);
      const text = data.content?.map(b => b.text || "").join("") || "";
      setImproved(text.trim());
      setActiveTab("compare");
    } catch { setError("Parantaminen epäonnistui."); }
    finally { setImproving(false); }
  }, [content, keyword, contentType]);

  const copyImproved = () => { navigator.clipboard.writeText(stripDiff(improved)); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const useImproved = () => { setContent(stripDiff(improved)); setImproved(null); setResult(null); setBaseline(null); setActiveTab("seo"); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const passCount = c => c?.filter(x => x.status === "pass").length || 0;
  const warnCount = c => c?.filter(x => x.status === "warn").length || 0;

  const tabs = [
    { id: "seo", label: "SEO" },
    { id: "geo", label: "GEO" },
    { id: "keyword", label: "Avainsana" },
    { id: "eeat", label: "E-E-A-T" },
    { id: "wins", label: "Wins" },
    ...(baseline ? [{ id: "beforeafter", label: "↑ Muutos" }] : []),
    ...(improved ? [{ id: "compare", label: "✦ Diff" }] : []),
  ];

  const tabDataMap = result ? { seo: result.seo, geo: result.geo, keyword: result.keyword, eeat: result.eeat } : {};
  const tabLabelMap = { seo: "Search Engine Optimization", geo: "Generative Engine Optimization", keyword: `Avainsana: "${keyword || "—"}"`, eeat: "Experience · Expertise · Authoritativeness · Trust" };
  const tabColorMap = { seo: "#6366f1", geo: "#06b6d4", keyword: "#f59e0b", eeat: "#22c55e" };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const wcColor = wordCount === 0 ? "rgba(255,255,255,0.2)" : wordCount < 400 ? "#ef4444" : wordCount < 800 ? "#f59e0b" : "#22c55e";
  const wcLabel = wordCount < 400 ? "liian lyhyt" : wordCount < 800 ? "kohtalainen" : "hyvä";

  // ─── Styles ─────────────────────────────────────────────────────────────────
  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "9px 12px", color: "white", fontSize: "13px", fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "7px" };
  const sectionLabel = (text, color = "rgba(255,255,255,0.3)") => (
    <div style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", color, letterSpacing: "0.15em", textTransform: "uppercase", margin: "18px 0 8px" }}>{text}</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "white", fontFamily: "Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.18) !important; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .tab-btn { flex: 1; min-width: 0; padding: 7px 6px; border-radius: 7px; font-size: 10px; font-family: 'DM Mono', monospace; font-weight: 600; letter-spacing: 0.06em; cursor: pointer; transition: all 0.15s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .input-focus:focus { border-color: rgba(99,102,241,0.5) !important; outline: none; }
        @media (max-width: 600px) {
          .grid-2 { grid-template-columns: 1fr !important; }
          .scores-row { gap: 12px !important; }
          .score-ring { transform: scale(0.85); }
          .hide-mobile { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "clamp(20px, 5vw, 48px) clamp(12px, 4vw, 24px) 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: "clamp(24px, 4vw, 40px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 16 16"><path d="M2 4h12M2 8h8M2 12h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>DevKarhu</span>
          </div>
          <h1 style={{ fontSize: "clamp(22px, 5vw, 36px)", fontWeight: "400", lineHeight: "1.1", letterSpacing: "-0.02em", marginBottom: "8px" }}>
            SEO <span style={{ color: "#6366f1" }}>&</span> GEO<br/>Analyzer
          </h1>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "clamp(13px, 2vw, 14px)", lineHeight: "1.6" }}>
            Analysoi, optimoi ja paranna sisältöä — blogi, Instagram, Substack tai LinkedIn.
          </p>
        </div>

        {/* Input card */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "clamp(16px, 4vw, 24px)", marginBottom: "16px" }}>

          {/* Content type selector */}
          <div style={{ marginBottom: "20px" }}>
            <div style={labelStyle}>Sisältötyyppi</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
              {CONTENT_TYPES.map(t => (
                <button key={t.id} onClick={() => { setContentType(t.id); setResult(null); setBaseline(null); setImproved(null); }} style={{
                  padding: "10px 6px", borderRadius: "10px", border: "1px solid",
                  borderColor: contentType === t.id ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)",
                  background: contentType === t.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                  color: contentType === t.id ? "white" : "rgba(255,255,255,0.45)",
                  fontFamily: "'DM Mono', monospace", fontSize: "11px", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", transition: "all 0.15s"
                }}>
                  <span style={{ fontSize: "18px" }}>{t.icon}</span>
                  <span style={{ fontSize: "10px", letterSpacing: "0.05em" }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* URL + Keyword */}
          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            <div>
              <div style={labelStyle}>URL (valinnainen)</div>
              <div style={{ display: "flex", gap: "6px" }}>
                <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="input-focus"
                  style={{ ...inputStyle, flex: 1 }}
                  onKeyDown={e => e.key === "Enter" && fetchUrl()}
                />
                <button onClick={fetchUrl} disabled={!url.trim() || fetching} style={{
                  padding: "9px 10px", background: !url.trim() ? "rgba(255,255,255,0.03)" : "rgba(99,102,241,0.15)",
                  border: "1px solid " + (!url.trim() ? "rgba(255,255,255,0.07)" : "rgba(99,102,241,0.35)"),
                  borderRadius: "8px", color: !url.trim() ? "rgba(255,255,255,0.2)" : "#a5b4fc",
                  fontSize: "11px", fontFamily: "'DM Mono', monospace", cursor: !url.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap"
                }}>
                  {fetching ? "..." : "Hae"}
                </button>
              </div>
            </div>
            <div>
              <div style={labelStyle}>Kohdeavainsana <span style={{ color: "#f59e0b" }}>★</span></div>
              <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="esim. talvipyöräily" className="input-focus"
                style={{ ...inputStyle, borderColor: "rgba(245,158,11,0.2)" }}
              />
            </div>
          </div>

          {/* Content textarea */}
          <div style={{ marginBottom: "14px" }}>
            <div style={labelStyle}>Sisältö</div>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Liitä teksti tähän..." rows={7} className="input-focus"
              style={{ ...inputStyle, fontFamily: "Georgia, serif", fontSize: "14px", resize: "vertical", lineHeight: "1.6" }}
            />
            {wordCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" }}>
                <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: wcColor, fontWeight: "600" }}>{wordCount} sanaa</span>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>—</span>
                <span style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.3)" }}>{wcLabel}</span>
                <span style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.15)", marginLeft: "auto" }}>tavoite &gt;800</span>
              </div>
            )}
          </div>

          {/* SERP Preview toggle */}
          {contentType === "blog" && (
            <div style={{ marginBottom: "14px" }}>
              <button onClick={() => setShowSerp(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", padding: "0" }}>
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ transform: showSerp ? "rotate(90deg)" : "rotate(0)", transition: "0.2s" }}>
                  <path d="M2 1.5l4 3-4 3" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ ...labelStyle, marginBottom: 0 }}>SERP-esikatselu</span>
              </button>
              {showSerp && (
                <div style={{ marginTop: "10px" }}>
                  <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                    <div>
                      <div style={labelStyle}>Title <span style={{ color: serpTitle.length > 60 ? "#ef4444" : "#22c55e" }}>{serpTitle.length}/60</span></div>
                      <input value={serpTitle} onChange={e => setSerpTitle(e.target.value)} placeholder="Sivun otsikko..." className="input-focus" style={inputStyle}/>
                    </div>
                    <div>
                      <div style={labelStyle}>Meta description <span style={{ color: serpDesc.length > 160 ? "#ef4444" : serpDesc.length > 140 ? "#22c55e" : "rgba(255,255,255,0.2)" }}>{serpDesc.length}/160</span></div>
                      <input value={serpDesc} onChange={e => setSerpDesc(e.target.value)} placeholder="Meta description..." className="input-focus" style={inputStyle}/>
                    </div>
                  </div>
                  <div style={{ background: "white", borderRadius: "10px", padding: "14px 18px", fontFamily: "Arial, sans-serif" }}>
                    <div style={{ fontSize: "11px", color: "#4d5156", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url || "https://sinunsivu.fi/blogi/postaus"}</div>
                    <div style={{ fontSize: "17px", color: serpTitle.length > 60 ? "#d93025" : "#1a0dab", lineHeight: "1.3", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {serpTitle || <span style={{ color: "#9aa0a6" }}>Kirjoita title yllä</span>}
                    </div>
                    {serpTitle.length > 60 && <div style={{ fontSize: "10px", color: "#d93025", marginBottom: "3px" }}>⚠ Liian pitkä — Google katkaisee ({serpTitle.length} merkkiä)</div>}
                    <div style={{ fontSize: "13px", color: "#4d5156", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {serpDesc || <span style={{ color: "#9aa0a6" }}>Google generoi oman kuvauksen jos tämä puuttuu.</span>}
                    </div>
                    {serpDesc.length > 160 && <div style={{ fontSize: "10px", color: "#d93025", marginTop: "3px" }}>⚠ Liian pitkä — Google katkaisee ({serpDesc.length} merkkiä)</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <div style={{ marginBottom: "12px", padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", fontSize: "13px", color: "#ef4444" }}>{error}</div>}

          {/* Action buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button onClick={analyze} disabled={loading || improving} style={{
              padding: "12px", background: loading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none", borderRadius: "10px", color: "white", fontSize: "13px",
              fontFamily: "'DM Mono', monospace", fontWeight: "600", cursor: loading || improving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
            }}>
              {loading ? <><svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 1s linear infinite" }}><circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.3"/><path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>Analysoidaan...</> : "Analysoi →"}
            </button>
            <button onClick={improve} disabled={!content.trim() || improving || loading} style={{
              padding: "12px",
              background: improving ? "rgba(168,85,247,0.3)" : !content.trim() ? "rgba(255,255,255,0.04)" : "rgba(168,85,247,0.15)",
              border: "1px solid " + (!content.trim() ? "rgba(255,255,255,0.07)" : "rgba(168,85,247,0.4)"),
              borderRadius: "10px", color: !content.trim() ? "rgba(255,255,255,0.2)" : "#c084fc",
              fontSize: "13px", fontFamily: "'DM Mono', monospace", fontWeight: "600",
              cursor: !content.trim() || improving || loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
            }}>
              {improving ? <><svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 1s linear infinite" }}><circle cx="8" cy="8" r="6" stroke="#c084fc" strokeWidth="2" strokeOpacity="0.3"/><path d="M8 2a6 6 0 0 1 6 6" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/></svg>Parannetaan...</> : "✦ Paranna teksti"}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>

            {/* Score rings */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "clamp(16px, 4vw, 24px)", marginBottom: "12px" }}>
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>{result.title || "Analysoitu"}</span>
              </div>
              <div className="scores-row" style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                <ScoreRing score={result.overallScore} label="Kokonais" color="#a855f7" />
                <ScoreRing score={result.seoScore} label="SEO" color="#6366f1" />
                <ScoreRing score={result.geoScore} label="GEO" color="#06b6d4" />
                {keyword && <ScoreRing score={result.keywordScore || 50} label="Avainsana" color="#f59e0b" />}
                {result.eeat && <ScoreRing score={result.eeat.score || 50} label="E-E-A-T" color="#22c55e" />}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "3px", marginBottom: "10px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "4px" }}>
              {tabs.map(tab => (
                <button key={tab.id} className="tab-btn" onClick={() => setActiveTab(tab.id)} style={{
                  background: activeTab === tab.id ? (tab.id === "compare" || tab.id === "beforeafter" ? "rgba(168,85,247,0.3)" : "rgba(99,102,241,0.3)") : "transparent",
                  border: "1px solid " + (activeTab === tab.id ? (tab.id === "compare" || tab.id === "beforeafter" ? "rgba(168,85,247,0.4)" : "rgba(99,102,241,0.4)") : "transparent"),
                  color: activeTab === tab.id ? "white" : "rgba(255,255,255,0.38)",
                }}>{tab.label}</button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "clamp(16px, 4vw, 24px)" }}>

              {/* SEO / GEO / Keyword / E-E-A-T */}
              {["seo","geo","keyword","eeat"].includes(activeTab) && (() => {
                const data = tabDataMap[activeTab];
                const color = tabColorMap[activeTab];
                if (!data) return <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Ei dataa.</div>;
                return (
                  <div>
                    {sectionLabel(activeTab.toUpperCase(), color)}
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "14px" }}>{tabLabelMap[activeTab]}</div>
                    <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "14px" }}>
                      {[{count: passCount(data.checks), label:"OK", c:"#22c55e"},{count: warnCount(data.checks), label:"Varoitus", c:"#f59e0b"},{count: data.checks.length - passCount(data.checks) - warnCount(data.checks), label:"Ongelma", c:"#ef4444"}].map(s => (
                        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "16px", fontFamily: "'DM Mono', monospace", fontWeight: "700", color: s.c }}>{s.count}</span>
                          <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                    {data.checks.map(c => <CheckRow key={c.id} check={c} />)}
                    {data.topIssues?.length > 0 && (
                      <>
                        {sectionLabel("Tärkeimmät korjaukset")}
                        {data.topIssues.map((issue, i) => (
                          <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "6px" }}>
                            <span style={{ color, fontFamily: "'DM Mono', monospace", fontSize: "10px", marginTop: "2px", flexShrink: 0 }}>{String(i+1).padStart(2,"0")}</span>
                            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: "1.5" }}>{issue}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Quick Wins */}
              {activeTab === "wins" && result.quickWins && (
                <div>
                  {sectionLabel("Quick Wins", "#a855f7")}
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "16px" }}>Nopein hyöty pienimmällä vaivalla</div>
                  {result.quickWins.map((win, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "11px 13px", marginBottom: "6px", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: "10px" }}>
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0, background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#a855f7", fontWeight: "700" }}>{i+1}</div>
                      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: "1.5" }}>{win}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Before / After */}
              {activeTab === "beforeafter" && baseline && result && (() => {
                const metrics = [
                  { label: "Kokonais", key: "overallScore", color: "#a855f7" },
                  { label: "SEO", key: "seoScore", color: "#6366f1" },
                  { label: "GEO", key: "geoScore", color: "#06b6d4" },
                  { label: "Avainsana", key: "keywordScore", color: "#f59e0b" },
                  { label: "E-E-A-T", keyFn: r => r.eeat?.score, color: "#22c55e" },
                ];
                return (
                  <div>
                    {sectionLabel("↑ ENNEN / JÄLKEEN", "#a855f7")}
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "20px" }}>Pisteiden muutos ensimmäisestä analyysistä</div>
                    {metrics.map(m => {
                      const before = m.keyFn ? m.keyFn(baseline) : baseline[m.key];
                      const after = m.keyFn ? m.keyFn(result) : result[m.key];
                      if (!before && !after) return null;
                      const diff = (after || 0) - (before || 0);
                      const diffColor = diff > 0 ? "#22c55e" : diff < 0 ? "#ef4444" : "rgba(255,255,255,0.3)";
                      return (
                        <div key={m.label} style={{ marginBottom: "18px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                            <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.6)" }}>{m.label}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.25)" }}>{before} → {after}</span>
                              <span style={{ fontSize: "12px", fontFamily: "'DM Mono', monospace", fontWeight: "700", color: diffColor }}>{diff > 0 ? "+" : ""}{diff}</span>
                            </div>
                          </div>
                          <div style={{ position: "relative", height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${before}%`, background: "rgba(255,255,255,0.12)", borderRadius: "3px" }}/>
                            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${after}%`, background: m.color, borderRadius: "3px", opacity: 0.7, transition: "width 0.8s ease" }}/>
                          </div>
                        </div>
                      );
                    })}
                    {(() => {
                      const diff = result.overallScore - baseline.overallScore;
                      return (
                        <div style={{ marginTop: "8px", padding: "14px", borderRadius: "10px", background: diff > 0 ? "rgba(34,197,94,0.07)" : diff < 0 ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.03)", border: `1px solid ${diff > 0 ? "rgba(34,197,94,0.2)" : diff < 0 ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}` }}>
                          <div style={{ fontSize: "12px", fontFamily: "'DM Mono', monospace", color: diff > 0 ? "#22c55e" : diff < 0 ? "#ef4444" : "rgba(255,255,255,0.4)", textAlign: "center" }}>
                            {diff > 5 ? "✓ Merkittävä parannus" : diff > 0 ? "↑ Pieni parannus — jatka optimointia" : diff === 0 ? "→ Ei muutosta" : "↓ Pisteet laskivat — tarkista muutokset"}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {/* Diff compare */}
              {activeTab === "compare" && improved && (
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
                    <div>
                      {sectionLabel("✦ PARANNETTU — muutokset korostettu", "#a855f7")}
                      <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                        {[{c:"rgba(34,197,94,0.3)",b:"rgba(34,197,94,0.5)",l:"Lisätty"},{c:"rgba(239,68,68,0.2)",b:"rgba(239,68,68,0.4)",l:"Poistettu"}].map(s => (
                          <div key={s.l} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: s.c, border: `1px solid ${s.b}`, display: "inline-block" }}/>
                            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace" }}>{s.l}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <button onClick={copyImproved} style={{ padding: "6px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "7px", color: "rgba(255,255,255,0.65)", fontSize: "10px", fontFamily: "'DM Mono', monospace", cursor: "pointer" }}>{copied ? "✓ Kopioitu" : "Kopioi"}</button>
                      <button onClick={useImproved} style={{ padding: "6px 12px", background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: "7px", color: "#c084fc", fontSize: "10px", fontFamily: "'DM Mono', monospace", cursor: "pointer", fontWeight: "600" }}>Käytä →</button>
                    </div>
                  </div>
                  <div style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: "12px", padding: "20px", fontSize: "14px", lineHeight: "1.8", color: "rgba(255,255,255,0.8)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {renderDiff(improved)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: "40px", textAlign: "center" }}>
          <span style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.12)", letterSpacing: "0.1em" }}>DEVKARHU · SEO & GEO ANALYZER</span>
        </div>
      </div>
    </div>
  );
}
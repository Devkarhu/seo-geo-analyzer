export const config = { runtime: "edge" };

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

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { userMsg } = await req.json();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
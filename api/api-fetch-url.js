export const config = {
  runtime: "nodejs",
  maxDuration: 30,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL required" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SEOAnalyzer/1.0)",
      },
    });

    if (!response.ok) {
      return res.status(400).json({ error: `Sivua ei voitu hakea (${response.status})` });
    }

    const html = await response.text();

    // Extract readable text from HTML
    const cleaned = html
      // Remove scripts, styles, nav, footer, header, aside
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<aside[\s\S]*?<\/aside>/gi, "")
      // Convert headings to markdown-like format
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
      // Convert paragraphs and list items to text with newlines
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n")
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1")
      // Strip remaining HTML tags
      .replace(/<[^>]+>/g, "")
      // Decode HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      // Clean up whitespace
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return res.status(200).json({ text: cleaned });
  } catch (err) {
    return res.status(500).json({ error: "Sivun haku epäonnistui: " + err.message });
  }
}

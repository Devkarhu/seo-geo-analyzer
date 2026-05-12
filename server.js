import express from "express";
import { createServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// API route — analyze
app.post("/api/analyze", async (req, res) => {
  const { systemPrompt, userMsg, model } = req.body;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "API call failed: " + err.message });
  }
});

// API route — fetch url
app.post("/api/fetch-url", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return res.status(400).json({ error: `Sivua ei voitu hakea (${response.status})` });
    }

    const html = await response.text();
    const NL = String.fromCharCode(10);
    let t2 = html;
    t2 = t2.replace(/<script[^]*?<\/script>/gi, "");
    t2 = t2.replace(/<style[^]*?<\/style>/gi, "");
    t2 = t2.replace(/<nav[^]*?<\/nav>/gi, "");
    t2 = t2.replace(/<footer[^]*?<\/footer>/gi, "");
    t2 = t2.replace(/<header[^]*?<\/header>/gi, "");
    t2 = t2.replace(/<aside[^]*?<\/aside>/gi, "");
    t2 = t2.replace(/<h1[^>]*>([^]*?)<\/h1>/gi, NL + "# $1" + NL);
    t2 = t2.replace(/<h2[^>]*>([^]*?)<\/h2>/gi, NL + "## $1" + NL);
    t2 = t2.replace(/<h3[^>]*>([^]*?)<\/h3>/gi, NL + "### $1" + NL);
    t2 = t2.replace(/<a[^>]+href="([^"]+)"[^>]*>([^]*?)<\/a>/gi, "$2 [$1]");
    t2 = t2.replace(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, NL + "[Kuva: $2 - $1]" + NL);
    t2 = t2.replace(/<img[^>]+src="([^"]+)"[^>]*\/?>/gi, NL + "[Kuva: $1]" + NL);
    t2 = t2.replace(/<li[^>]*>([^]*?)<\/li>/gi, NL + "- $1");
    t2 = t2.replace(/<br\s*\/?>/gi, NL);
    t2 = t2.replace(/<p[^>]*>([^]*?)<\/p>/gi, NL + "$1" + NL);
    t2 = t2.replace(/<[^>]+>/g, "");
    t2 = t2.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    t2 = t2.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
    t2 = t2.replace(/\n\n\n+/g, "\n\n").trim();

    res.json({ text: t2 });
  } catch (err) {
    res.status(500).json({ error: "Sivun haku epäonnistui: " + err.message });
  }
});

// Serve frontend
if (isProd) {
  // Production: serve built files
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
} else {
  // Development: use Vite dev server
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
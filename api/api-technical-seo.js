export const config = {
  runtime: "nodejs",
  maxDuration: 30,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SEOAnalyzer/1.0)" },
    });

    if (!response.ok) {
      return res.status(400).json({ error: `Sivua ei voitu hakea (${response.status})` });
    }

    const html = await response.text();

    // --- Meta tags ---
    const getMetaContent = (name) => {
      const m = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"))
               || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i"));
      return m ? m[1] : null;
    };
    const getMetaProp = (prop) => {
      const m = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"))
               || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, "i"));
      return m ? m[1] : null;
    };

    const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]?.trim() || null;
    const metaDesc = getMetaContent("description");
    const robots = getMetaContent("robots");
    const canonical = (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) || [])[1] || null;
    const hreflang = html.match(/<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["']/gi) || [];
    const ogTitle = getMetaProp("og:title");
    const ogDesc = getMetaProp("og:description");
    const ogImage = getMetaProp("og:image");
    const twitterCard = getMetaContent("twitter:card");

    // --- Headings ---
    const h1s = (html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || []).map(h => h.replace(/<[^>]+>/g, "").trim());
    const h2s = (html.match(/<h2[^>]*>[\s\S]*?<\/h2>/gi) || []).map(h => h.replace(/<[^>]+>/g, "").trim());

    // --- Images ---
    const imgTags = html.match(/<img[^>]+>/gi) || [];
    const images = imgTags.map(tag => {
      const src = (tag.match(/src=["']([^"']+)["']/) || [])[1] || "";
      const alt = (tag.match(/alt=["']([^"']*)["']/) || [])[1];
      return { src, alt: alt ?? null, hasAlt: alt !== undefined && alt !== null };
    });
    const imagesWithoutAlt = images.filter(i => !i.hasAlt).length;
    const imagesWithEmptyAlt = images.filter(i => i.hasAlt && i.alt === "").length;

    // --- Links ---
    const linkTags = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi) || [];
    const baseUrl = new URL(url);
    const links = linkTags.map(tag => {
      const href = (tag.match(/href=["']([^"']+)["']/) || [])[1] || "";
      const isInternal = href.startsWith("/") || href.includes(baseUrl.hostname);
      const isExternal = href.startsWith("http") && !href.includes(baseUrl.hostname);
      return { href, isInternal, isExternal };
    });
    const internalLinks = links.filter(l => l.isInternal).length;
    const externalLinks = links.filter(l => l.isExternal).length;

    // Check a sample of external links for broken status
    const externalHrefs = links.filter(l => l.isExternal).slice(0, 8).map(l => l.href);
    const brokenLinks = [];
    await Promise.all(externalHrefs.map(async (href) => {
      try {
        const r = await fetch(href, { method: "HEAD", signal: AbortSignal.timeout(5000) });
        if (!r.ok) brokenLinks.push({ href, status: r.status });
      } catch {
        brokenLinks.push({ href, status: "timeout/error" });
      }
    }));

    // --- Structured data ---
    const jsonLd = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    const schemaTypes = jsonLd.map(block => {
      try { return JSON.parse(block.replace(/<script[^>]+>|<\/script>/gi, "").trim())["@type"]; } catch { return null; }
    }).filter(Boolean);

    // --- Word count ---
    const bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ").trim();
    const wordCount = bodyText.split(" ").filter(w => w.length > 0).length;

    // --- SERP preview data ---
    const serpTitle = title || "";
    const serpDesc = metaDesc || "";
    const serpUrl = url;

    return res.status(200).json({
      title: { value: serpTitle, length: serpTitle.length },
      metaDesc: { value: serpDesc, length: serpDesc.length },
      robots: robots || "index, follow (oletus)",
      canonical: canonical || null,
      hreflang: hreflang.length,
      openGraph: { title: ogTitle, description: ogDesc, image: ogImage },
      twitterCard: twitterCard || null,
      headings: { h1s, h2s },
      images: { total: images.length, withoutAlt: imagesWithoutAlt, emptyAlt: imagesWithEmptyAlt },
      links: { internal: internalLinks, external: externalLinks },
      brokenLinks,
      schema: schemaTypes,
      wordCount,
      serp: { title: serpTitle, description: serpDesc, url: serpUrl },
    });

  } catch (err) {
    return res.status(500).json({ error: "Tekninen analyysi epäonnistui: " + err.message });
  }
}

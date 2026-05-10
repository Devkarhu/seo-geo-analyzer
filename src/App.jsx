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
  "cta": {
    "score": 45,
    "checks": [
      {"id":"cta_present","label":"CTA löytyy tekstistä","status":"fail","note":"Ei selkeää kehotusta toimintaan."},
      {"id":"cta_placement","label":"CTA sijoitettu loppuun","status":"warn","note":"CTA puuttuu tai se on piilotettu tekstin keskelle."},
      {"id":"cta_product_link","label":"Linkki tuotesivulle tai mallistoon","status":"fail","note":"Ei linkkiä tuotteisiin — lukija ei tiedä mitä tehdä seuraavaksi."},
      {"id":"cta_urgency","label":"Kiireellisyys tai hyöty CTA:ssa","status":"fail","note":"CTA on geneerinen — lisää konkreettinen hyöty tai syy toimia nyt."},
      {"id":"cta_contact","label":"Yhteydenotto tai tarjouspyyntö","status":"warn","note":"Ei kehotusta ottaa yhteyttä tai pyytää tarjousta."},
      {"id":"cta_buying_intent","label":"Ostopolku selkeä","status":"fail","note":"Teksti ei ohjaa lukijaa kohti ostopäätöstä."},
      {"id":"cta_local","label":"Paikallinen CTA (tule myymälään, testaa)","status":"fail","note":"Ei paikallista kehotusta — lisää jos myymälä on käytettävissä."},
      {"id":"cta_multiple","label":"Useampi CTA-vaihtoehto","status":"warn","note":"Tarjoa sekä kova CTA (osta nyt) että pehmeä (lue lisää, katso mallisto)."}
    ],
    "topIssues":["Lisää selkeä CTA postauksen loppuun","Linkitä suoraan tuotesivulle tai mallistoon","Lisää pehmeä vaihtoehto: tilaa uutiskirje tai tule testaamaan"]
  },
  "quickWins":["Write meta description with keyword","Add FAQ section","Add JSON-LD schema","Add 2–3 internal links","Add TL;DR block","Add product link CTA at end of post"]
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
      {"id":"hook_length","label":"Hook (ensimmäiset 125 merkkiä)","status":"pass","note":"Arvioi onko ensimmäinen lause tarpeeksi vahva ennen lue lisää -katkosta."},
      {"id":"length_general","label":"Kokonaispituus (100–150 sanaa optimaali)","status":"pass","note":"100–150 sanaa = korkein engagement. Alle 80 = liian lyhyt. Yli 200 = riski että ei lueta loppuun. Arvioi todellinen sanamäärä."},
      {"id":"length_story","label":"Tarinaformaatti (150–300 sanaa ok)","status":"pass","note":"Jos sisältö on henkilökohtainen tarina, jopa 300 sanaa voi toimia — arvioi kontekstin mukaan."},
      {"id":"length_reel","label":"Reel-caption (alle 50 sanaa)","status":"pass","note":"Reelissä video kantaa — arvioi onko caption turhan pitkä formaattiin nähden."},
      {"id":"length_carousel","label":"Carousel-caption","status":"pass","note":"Carouselissa sisältö on slideissa — caption voi olla minimaalinen. Arvioi formaatti."},
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

  ecommerce: `You are an expert e-commerce SEO copywriter specializing in product pages. Analyze the product description for search visibility, conversion, and buyer confidence.
Return ONLY valid JSON:
{
  "overallScore": 70, "seoScore": 65, "geoScore": 68, "keywordScore": 62,
  "title": "product name", "summary": "one sentence summary",
  "seo": {
    "checks": [
      {"id":"product_title","label":"Tuoteotsikko (50–60 merkkiä, avainsana alussa)","status":"pass","note":"Otsikko on selkeä ja avainsana edessä."},
      {"id":"meta_desc","label":"Meta Description (150–160 merkkiä)","status":"warn","note":"Meta description puuttuu tai liian lyhyt."},
      {"id":"primary_kw","label":"Pääavainsana tekstissä (1–2%)","status":"pass","note":"Avainsana esiintyy luontevasti."},
      {"id":"long_tail","label":"Long-tail avainsanat (esim. sähköpyörä kaupunki aikuinen)","status":"warn","note":"Vain yleisavainsana — lisää tarkentavia hakutermejä."},
      {"id":"h1_h2","label":"H1 ja H2 rakenne","status":"pass","note":"Selkeä otsikkorakenne."},
      {"id":"bullet_specs","label":"Tekniset tiedot bullet-listana","status":"fail","note":"Tekniset speksit puuttuvat tai ne ei ole listattu selkeästi."},
      {"id":"word_count","label":"Tekstin pituus (300–500 sanaa)","status":"warn","note":"Liian lyhyt tuotekuvaus — Google suosii kattavampaa sisältöä."},
      {"id":"image_alt","label":"Kuva alt-tekstit avainsanalla","status":"fail","note":"Alt-teksteissä ei ole avainsanaa."},
      {"id":"schema","label":"Product Schema Markup","status":"fail","note":"Ei product schemaa — lisää hinta, saatavuus, arvostelut."},
      {"id":"url_slug","label":"URL-slug (lyhyt, avainsana mukana)","status":"pass","note":"Siisti URL-rakenne."}
    ],
    "topIssues":["Lisää long-tail avainsanat tekstiin","Lisää Product schema (hinta, saatavuus, reviews)","Kirjoita meta description"]
  },
  "geo": {
    "checks": [
      {"id":"direct_answer","label":"Vastaa ostajan kysymyksiin suoraan","status":"pass","note":"Teksti vastaa keskeisiin kysymyksiin."},
      {"id":"use_cases","label":"Käyttötilanteet kuvattu","status":"warn","note":"Ei konkreettisia käyttötilanteita (esim. kaupunkiajo, retket)."},
      {"id":"comparison","label":"Vertailu muihin malleihin / kilpailijoihin","status":"fail","note":"Ei vertailua — tekoäly ei voi suositella ilman kontekstia."},
      {"id":"faq","label":"UKK / Ostajien kysymykset","status":"fail","note":"Ei FAQ-osiota — lisää yleisimmät ostokysymykset."},
      {"id":"specs_detail","label":"Tarkat tekniset speksit","status":"pass","note":"Speksit löytyvät."},
      {"id":"social_proof","label":"Arvostelut / Käyttäjäkokemukset","status":"warn","note":"Ei arvosteluihin viittausta tekstissä."},
      {"id":"brand_trust","label":"Brändi- ja takuusignaalit","status":"warn","note":"Takuu tai huoltopalvelu ei mainittuna."},
      {"id":"local","label":"Paikallinen saatavuus (esim. Tampere, Finland)","status":"fail","note":"Ei paikallista kontekstia — lisää jos toimitus/nouto mahdollinen."}
    ],
    "topIssues":["Lisää FAQ ostajien yleisimmillä kysymyksillä","Mainitse takuu ja huoltopalvelu","Lisää käyttötilanteet (kaupunki, maasto, pendelöinti)"]
  },
  "keyword": {
    "checks": [
      {"id":"kw_title","label":"Avainsana otsikossa","status":"pass","note":"Pääavainsana otsikossa."},
      {"id":"kw_first_para","label":"Avainsana ensimmäisessä kappaleessa","status":"warn","note":"Avainsana puuttuu avauskappaleesta."},
      {"id":"kw_specs","label":"Avainsana spekseissä","status":"pass","note":"Avainsana toistuu luontevasti."},
      {"id":"kw_longtail","label":"Long-tail: malli + käyttötarkoitus + kohderyhmä","status":"fail","note":"Esim. 'sähköpyörä naisille kaupunki' tai 'sähköpyörä 250W tavarankuljetus' puuttuu."},
      {"id":"kw_alt","label":"Avainsana kuva alt-teksteissä","status":"fail","note":"Alt-teksteissä ei avainsanaa."},
      {"id":"kw_variations","label":"Semanttiset variaatiot (e-pyörä, sähköavusteinen)","status":"warn","note":"Käytä myös synonyymejä luontevasti."}
    ],
    "topIssues":["Lisää long-tail avainsanat (malli + käyttö + kohderyhmä)","Käytä synonyymejä: e-pyörä, sähköavusteinen pyörä","Lisää avainsana alt-teksteihin"]
  },
  "eeat": {
    "score": 55,
    "checks": [
      {"id":"brand","label":"Brändin asiantuntijuus esillä","status":"warn","note":"Ei mainintaa kaupan asiantuntemuksesta tai historiasta."},
      {"id":"specs_accurate","label":"Tarkat ja todennetut speksit","status":"pass","note":"Tekniset tiedot ovat konkreettiset."},
      {"id":"certifications","label":"Sertifikaatit / standardit (CE, EN15194)","status":"fail","note":"Ei mainintaa turvallisuusstandardeista."},
      {"id":"reviews","label":"Oikeat asiakasarvostelut","status":"warn","note":"Ei arvosteluihin viittausta."},
      {"id":"warranty","label":"Takuu ja huoltopalvelu","status":"fail","note":"Takuuaika ja huolto mainitsematta."},
      {"id":"real_photos","label":"Oikeat tuotekuvat (ei stockkuvia)","status":"warn","note":"Ei tietoa kuvien alkuperästä."},
      {"id":"contact","label":"Yhteystiedot / asiantuntija-apu","status":"warn","note":"Ei mainintaa asiantuntija-avusta ostopäätökseen."},
      {"id":"updated","label":"Hintatiedot ajantasaiset","status":"pass","note":"Hinta näkyvissä."}
    ],
    "topIssues":["Mainitse CE-sertifikaatti ja EN15194-standardi","Lisää takuuaika ja huoltopalvelu selkeästi","Lisää oikeiden asiakkaiden arvosteluja"]
  },
  "cta": {
    "score": 40,
    "checks": [
      {"id":"cta_buy","label":"Selkeä osta-nappi tai CTA","status":"fail","note":"Ei selkeää ostopainiketta tai kehotusta."},
      {"id":"cta_test","label":"Testiajomahdollisuus mainittu","status":"fail","note":"Ei mainintaa testaamisesta — tärkeä konversiotekijä kalliissa tuotteissa."},
      {"id":"cta_finance","label":"Rahoitusvaihtoehto mainittu","status":"fail","note":"Osamaksu tai rahoitus voi ratkaista ostopäätöksen — mainitse jos saatavilla."},
      {"id":"cta_stock","label":"Saatavuustieto (varastossa / tilaustuote)","status":"warn","note":"Ei tietoa saatavuudesta — epävarmuus estää ostamisen."},
      {"id":"cta_contact","label":"Asiantuntija-apu tarjolla","status":"warn","note":"Lisää: ota yhteyttä asiantuntijaan tai chat-tuki."},
      {"id":"cta_urgency","label":"Kiireellisyys tai rajoitettu erä","status":"fail","note":"Ei urgencyä — harkitse kampanjaa tai rajoitetun erän mainintaa."},
      {"id":"cta_compare","label":"Vertailulinkki muihin malleihin","status":"warn","note":"Anna asiakkaalle mahdollisuus vertailla — se pitää heidät sivustolla."},
      {"id":"cta_local","label":"Nouto myymälästä / paikallinen saatavuus","status":"fail","note":"Mainitse jos tuotteen voi noutaa tai tulla testaamaan paikan päällä."}
    ],
    "topIssues":["Mainitse testaamismahdollisuus — kriittinen kalliille tuotteille","Lisää rahoitusvaihtoehto jos saatavilla","Näytä saatavuustieto selkeästi"]
  },
  "quickWins":["Lisää Product schema (hinta, saatavuus, arvosana)","Kirjoita FAQ ostajien yleisimmillä kysymyksillä","Mainitse takuu, huolto ja palautuskäytäntö","Lisää long-tail avainsanat käyttötarkoituksen mukaan","Lisää CE-merkintä ja EN15194-standardi tekstiin","Mainitse testiajomahdollisuus ja rahoitusvaihtoehdot"]
}
Analyze the actual product description provided. Be specific — reference actual product details when possible. Status must be exactly "pass", "warn", or "fail".`,

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

const IMPROVE_PROMPT = `You are a human content editor — not an AI writer. Your job is to make minimal, surgical edits that improve SEO and engagement while making the text sound MORE human, not less. The reader should never suspect AI was involved.

HUMAN VOICE RULES (apply to all content types):
- Preserve the author's exact vocabulary, rhythm, and quirks — do not normalize or polish their style
- Keep contractions, informal phrases, incomplete sentences if they exist in the original
- Do NOT add generic filler phrases like "In today's world", "It's important to note", "As we can see"
- Do NOT use words: leverage, delve, crucial, comprehensive, seamlessly, robust, utilize, innovative, groundbreaking, unlock, empower, dive in, game-changer, cutting-edge
- Add first-person experience references naturally if the original has any personal tone ("When I tried this...", "Last winter I learned...")
- Specific details beat vague claims — replace "many people" with actual numbers or named examples when possible
- Imperfect is authentic — a slightly awkward phrase that sounds human beats a polished phrase that sounds AI

PLATFORM RULES:

BLOG (max ~2000 words recommended):
- Add TL;DR block at top (2–3 sentences max, conversational tone)
- Title under 60 characters with keyword
- Keyword naturally in first paragraph and second H2
- Convert 2 headings to questions
- Add FAQ section (3–5 questions the author would actually answer)
- Meta description line at top: "Meta description: ..." (150–160 chars, includes keyword)

INSTAGRAM (caption limits):
- Total caption: max 2200 characters
- First 125 characters are shown before "more" — hook must land here
- Hashtags: 5–10 total, mix of niche (under 500k posts) and broad, placed at end or first comment note
- Line breaks after every 1–2 sentences for mobile readability
- End with one direct question or CTA
- No external links (they don't work in captions)

SUBSTACK (email format):
- Subject line: 40–50 characters, curiosity or benefit-driven
- Preview text: 85–100 characters (what shows in inbox under subject)
- Opening line must hook within first 20 words
- Ideal length: 600–1200 words for regular issues, up to 2500 for deep dives
- Short paragraphs: max 3–4 lines each
- End with one reader question
- Add TL;DR or key takeaways block

ECOMMERCE / PRODUCT PAGE (conversion + SEO):
- Title: brand + model + key spec + use case, under 60 chars, primary keyword first
- First paragraph: lead with the main benefit, not a feature list
- Bullet specs: motor (W), battery (Wh), range (km), weight (kg), max speed, frame material, brake type — all in one clean list
- Add use case paragraph: who is this for, what terrain, what trip length
- Add FAQ section: 4–6 questions real buyers ask (range in cold weather, charging time, suitable for hills, service & warranty)
- Mention CE certification and EN15194 standard if applicable
- State warranty duration and service availability clearly
- Use long-tail keywords naturally: e.g. "sähköpyörä kaupunkiajoon naisille", "sähköavusteinen pyörä 250W"
- Do NOT use "revolutionary", "cutting-edge", "ultimate" — use specific facts instead

LINKEDIN (algorithm rules):
- Total post: 1000–1300 characters optimal (hard limit before "see more" is ~210 chars)
- First 2 lines must be the hook — no context-setting, no preamble
- Line breaks after every sentence or two
- No external links in post body — add note "link in comments" if needed
- Max 3–5 hashtags at end
- End with a direct question to drive comments
- Personal story or specific result outperforms generic advice

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
        <text x={cx} y={cx + 9} textAnchor="middle" fill="rgba(200,200,220,0.55)" fontSize="7" fontFamily="'DM Mono', monospace">/100</text>
      </svg>
      <span style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center" }}>{label}</span>
    </div>
  );
};

const CheckRow = ({ check }) => {
  const colors = { pass: "#22c55e", warn: "#f59e0b", fail: "#ef4444" };
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", borderRadius: "8px", background: "#212121", borderLeft: `2px solid ${colors[check.status]}50`, marginBottom: "5px" }}>
      <div style={{ marginTop: "1px", flexShrink: 0 }}><StatusIcon status={check.status} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "12px", fontFamily: "'DM Mono', monospace", color: "#f0f0f8", marginBottom: "2px" }}>{check.label}</div>
        <div style={{ fontSize: "11px", color: "rgba(240,240,248,0.55)", lineHeight: "1.4" }}>{check.note}</div>
      </div>
    </div>
  );
};

const CONTENT_TYPES = [
  { id: "blog", label: "Blogi", icon: "✍" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "substack", label: "Substack", icon: "📨" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
  { id: "ecommerce", label: "E-commerce", icon: "🛒" },
];

const callApi = async (systemPrompt, userMsg) => {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userMsg })
  });
  return res.json();
};

// ─── HTML Parser ─────────────────────────────────────────────────────────────

function parseHtml(html) {
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
  t2 = t2.replace(/<a[^>]+href='([^']+)'[^>]*>([^]*?)<\/a>/gi, '$2 [$1]');
  t2 = t2.replace(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, NL + "[Kuva: $2 - $1]" + NL);
  t2 = t2.replace(/<img[^>]+alt="([^"]*)"[^>]+src="([^"]+)"[^>]*\/?>/gi, NL + "[Kuva: $1 - $2]" + NL);
  t2 = t2.replace(/<img[^>]+src="([^"]+)"[^>]*\/?>/gi, NL + "[Kuva: $1]" + NL);
  t2 = t2.replace(/<li[^>]*>([^]*?)<\/li>/gi, NL + "- $1");
  t2 = t2.replace(/<br\s*\/?>/gi, NL);
  t2 = t2.replace(/<p[^>]*>([^]*?)<\/p>/gi, NL + "$1" + NL);
  t2 = t2.replace(/<(strong|b)[^>]*>([^]*?)<\/(strong|b)>/gi, "$2");
  t2 = t2.replace(/<(em|i)[^>]*>([^]*?)<\/(em|i)>/gi, "$2");
  t2 = t2.replace(/<[^>]+>/g, "");
  t2 = t2.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  t2 = t2.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
  t2 = t2.replace(/&ndash;/g, "-").replace(/&mdash;/g, "--");
  t2 = t2.replace(/\n\n\n+/g, NL + NL).trim();
  return t2;
}

function looksLikeHtml(text) {
  return text.includes("</") && /<[a-z][^>]*>/i.test(text);
}

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
  const [htmlParsed, setHtmlParsed] = useState(false);

  const t = {
    bg: "#111111",
    surface: "#1c1c1c",
    surfaceHigh: "#242424",
    border: "rgba(255,255,255,0.12)",
    borderStrong: "rgba(255,255,255,0.18)",
    text: "#f0f0f8",
    textMuted: "rgba(240,240,248,0.6)",
    textFaint: "rgba(240,240,248,0.35)",
    input: "#161616",
    inputBorder: "rgba(255,255,255,0.15)",
    labelColor: "rgba(240,240,248,0.55)",
    tabInactive: "rgba(240,240,248,0.5)",
    checkBg: "#212121",
    checkNote: "rgba(240,240,248,0.55)",
    checkLabel: "#f0f0f8",
    sectionLabel: "rgba(240,240,248,0.4)",
    winsBg: "rgba(168,85,247,0.12)",
    winsBorder: "rgba(168,85,247,0.3)",
    diffBg: "rgba(168,85,247,0.08)",
    diffBorder: "rgba(168,85,247,0.25)",
    toggleBg: "rgba(255,255,255,0.08)",
    toggleBorder: "rgba(255,255,255,0.15)",
    toggleText: "rgba(240,240,248,0.6)",
  };

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


  const exportPdf = () => {
    const now = new Date().toLocaleDateString("fi-FI");
    const ct = CONTENT_TYPES.find(x => x.id === contentType)?.label || contentType;

    const ring = (score, label, color) => {
      const r = 38, circ = 2 * Math.PI * r;
      const offset = circ - (score / 100) * circ;
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="8"/>
          <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="8"
            stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
            stroke-linecap="round" transform="rotate(-90 50 50)"/>
          <text x="50" y="46" text-anchor="middle" fill="white" font-size="18" font-weight="700" font-family="monospace">${score}</text>
          <text x="50" y="60" text-anchor="middle" fill="rgba(255,255,255,0.35)" font-size="8" font-family="monospace">/100</text>
        </svg>
        <span style="font-size:9px;font-family:monospace;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em">${label}</span>
      </div>`;
    };

    const checkIcon = s => s === "pass"
      ? `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#22c55e" fill-opacity="0.2" stroke="#22c55e" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      : s === "warn"
      ? `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2Z" fill="#f59e0b" fill-opacity="0.2" stroke="#f59e0b" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 7v3M8 11.5v.5" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#ef4444" fill-opacity="0.2" stroke="#ef4444" stroke-width="1.5"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    const checkColor = s => s === "pass" ? "#22c55e" : s === "warn" ? "#f59e0b" : "#ef4444";

    const checksSection = (title, data, color) => {
      if (!data?.checks) return "";
      return `<div style="margin-bottom:28px">
        <div style="font-size:9px;font-family:monospace;color:${color};letter-spacing:0.15em;text-transform:uppercase;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.06)">${title}</div>
        <div style="display:flex;gap:10px;margin-bottom:12px">
          <span style="font-size:16px;font-weight:700;color:#22c55e;font-family:monospace">${data.checks.filter(x=>x.status==="pass").length}</span><span style="font-size:9px;color:rgba(255,255,255,0.3);font-family:monospace;margin-top:5px">OK</span>
          <span style="margin:0 4px;color:rgba(255,255,255,0.1)">·</span>
          <span style="font-size:16px;font-weight:700;color:#f59e0b;font-family:monospace">${data.checks.filter(x=>x.status==="warn").length}</span><span style="font-size:9px;color:rgba(255,255,255,0.3);font-family:monospace;margin-top:5px">Varoitus</span>
          <span style="margin:0 4px;color:rgba(255,255,255,0.1)">·</span>
          <span style="font-size:16px;font-weight:700;color:#ef4444;font-family:monospace">${data.checks.filter(x=>x.status==="fail").length}</span><span style="font-size:9px;color:rgba(255,255,255,0.3);font-family:monospace;margin-top:5px">Ongelma</span>
        </div>
        ${data.checks.map(ch => `
          <div style="display:flex;align-items:flex-start;gap:10px;padding:9px 12px;border-radius:8px;background:#1c1c1c;border-left:2px solid ${checkColor(ch.status)}40;margin-bottom:5px">
            <div style="flex-shrink:0;margin-top:1px">${checkIcon(ch.status)}</div>
            <div>
              <div style="font-size:12px;color:#f0f0f8;font-family:monospace;margin-bottom:2px">${ch.label}</div>
              <div style="font-size:11px;color:rgba(240,240,248,0.5);line-height:1.4">${ch.note}</div>
            </div>
          </div>
        `).join("")}
        ${data.topIssues?.length ? `<div style="margin-top:10px;padding:12px;background:#161616;border-radius:8px">
          <div style="font-size:9px;font-family:monospace;color:rgba(255,255,255,0.25);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px">Tärkeimmät korjaukset</div>
          ${data.topIssues.map((iss, n) => `<div style="display:flex;gap:8px;margin-bottom:6px">
            <span style="color:${color};font-family:monospace;font-size:10px;flex-shrink:0;margin-top:1px">${String(n+1).padStart(2,"0")}</span>
            <span style="font-size:12px;color:rgba(240,240,248,0.6);line-height:1.4">${iss}</span>
          </div>`).join("")}
        </div>` : ""}
      </div>`;
    };

    const beforeAfterSection = () => {
      if (!baseline) return "";
      const metrics = [
        { label: "Kokonais", before: baseline.overallScore, after: result.overallScore, color: "#a855f7" },
        { label: "SEO", before: baseline.seoScore, after: result.seoScore, color: "#6366f1" },
        { label: "GEO", before: baseline.geoScore, after: result.geoScore, color: "#06b6d4" },
        { label: "Avainsana", before: baseline.keywordScore, after: result.keywordScore, color: "#f59e0b" },
        { label: "E-E-A-T", before: baseline.eeat?.score, after: result.eeat?.score, color: "#22c55e" },
        { label: "CTA", before: baseline.cta?.score, after: result.cta?.score, color: "#f97316" },
      ].filter(m => m.before || m.after);
      const totalDiff = result.overallScore - baseline.overallScore;
      return `<div style="background:#1c1c1c;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:20px;margin-bottom:24px">
        <div style="font-size:9px;font-family:monospace;color:#a855f7;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:16px">↑ ENNEN / JÄLKEEN</div>
        ${metrics.map(m => {
          const diff = (m.after||0)-(m.before||0);
          const dc = diff>0?"#22c55e":diff<0?"#ef4444":"rgba(255,255,255,0.3)";
          return `<div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px">
              <span style="font-size:11px;font-family:monospace;color:rgba(255,255,255,0.6)">${m.label}</span>
              <div style="display:flex;gap:10px;align-items:center">
                <span style="font-size:10px;font-family:monospace;color:rgba(255,255,255,0.25)">${m.before||"—"} → ${m.after||"—"}</span>
                <span style="font-size:13px;font-weight:700;font-family:monospace;color:${dc}">${diff>0?"+":""}${diff}</span>
              </div>
            </div>
            <div style="position:relative;height:6px;border-radius:3px;background:rgba(255,255,255,0.06)">
              <div style="position:absolute;left:0;top:0;height:6px;border-radius:3px;background:rgba(255,255,255,0.18);width:${m.before||0}%"></div>
              <div style="position:absolute;left:0;top:0;height:6px;border-radius:3px;background:${m.color};opacity:0.75;width:${m.after||0}%"></div>
            </div>
          </div>`;
        }).join("")}
        <div style="margin-top:14px;padding:12px;border-radius:8px;text-align:center;background:${totalDiff>0?"rgba(34,197,94,0.08)":"rgba(239,68,68,0.08)"};border:1px solid ${totalDiff>0?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)"}">
          <span style="font-size:12px;font-family:monospace;color:${totalDiff>0?"#22c55e":"#ef4444"}">${totalDiff>5?"✓ Merkittävä parannus":totalDiff>0?"↑ Pieni parannus — jatka optimointia":totalDiff===0?"→ Ei muutosta":"↓ Pisteet laskivat — tarkista muutokset"}</span>
        </div>
      </div>`;
    };

    const html = `<!DOCTYPE html>
<html style="background:#111111">
<head>
  <meta charset="utf-8">
  <title>SEO & GEO Raportti — ${result.title || "Analyysi"}</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: #111111 !important; color: #f0f0f8; font-family: Georgia, serif; }
    body { padding: 48px; max-width: 860px; margin: 0 auto; }
    @media print {
      html, body { background: #111111 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { padding: 24px; }
      .no-print { display: none !important; }
      @page { margin: 1cm; size: A4; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.08)">
    <div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <div style="width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#6366f1,#a855f7);display:flex;align-items:center;justify-content:center">
          <svg width="12" height="12" fill="none" viewBox="0 0 16 16"><path d="M2 4h12M2 8h8M2 12h10" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <span style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.2em;color:rgba(255,255,255,0.3);text-transform:uppercase">DevKarhu · SEO & GEO Analyzer</span>
      </div>
      <h1 style="font-size:24px;font-weight:400;letter-spacing:-0.02em;margin-bottom:8px;color:white">${result.title || "Analyysi"}</h1>
      <div style="font-size:12px;color:rgba(255,255,255,0.4);font-family:'DM Mono',monospace">
        ${ct}${keyword ? " · " + keyword : ""} · ${now}
      </div>
    </div>
    <div style="text-align:center;flex-shrink:0">
      ${ring(result.overallScore, "Kokonais", "#a855f7")}
    </div>
  </div>

  <!-- Score rings -->
  <div style="background:#1c1c1c;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:24px;margin-bottom:24px">
    <div style="display:flex;gap:24px;justify-content:center;flex-wrap:wrap">
      ${ring(result.seoScore, "SEO", "#6366f1")}
      ${ring(result.geoScore, "GEO", "#06b6d4")}
      ${keyword ? ring(result.keywordScore||0, "Avainsana", "#f59e0b") : ""}
      ${result.eeat ? ring(result.eeat.score||0, "E-E-A-T", "#22c55e") : ""}
      ${result.cta ? ring(result.cta.score||0, "CTA", "#f97316") : ""}
    </div>
  </div>

  <!-- Before/After -->
  ${beforeAfterSection()}

  <!-- Quick Wins -->
  ${result.quickWins?.length ? `<div style="background:#1c1c1c;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:20px;margin-bottom:24px">
    <div style="font-size:9px;font-family:'DM Mono',monospace;color:#a855f7;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:14px">Quick Wins</div>
    ${result.quickWins.map((w,i) => `<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 12px;margin-bottom:6px;background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.2);border-radius:8px">
      <div style="width:20px;height:20px;border-radius:50%;background:rgba(168,85,247,0.2);border:1px solid rgba(168,85,247,0.4);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:monospace;font-size:9px;color:#a855f7;font-weight:700">${i+1}</div>
      <span style="font-size:13px;color:rgba(255,255,255,0.75);line-height:1.5">${w}</span>
    </div>`).join("")}
  </div>` : ""}

  <!-- All checks -->
  ${checksSection("SEO — Search Engine Optimization", result.seo, "#6366f1")}
  ${checksSection("GEO — Generative Engine Optimization", result.geo, "#06b6d4")}
  ${keyword ? checksSection('Avainsana: ' + keyword, result.keyword, "#f59e0b") : ""}
  ${result.eeat ? checksSection("E-E-A-T — Experience · Expertise · Authoritativeness · Trust", result.eeat, "#22c55e") : ""}
  ${result.cta ? checksSection("CTA — Call-to-Action & Ostopolku", result.cta, "#f97316") : ""}

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
    <span style="font-size:9px;font-family:'DM Mono',monospace;color:rgba(255,255,255,0.15);letter-spacing:0.1em">DEVKARHU · SEO & GEO ANALYZER · ${now}</span>
  </div>

  <div class="no-print" style="position:fixed;bottom:24px;right:24px">
    <button onclick="window.print()" style="padding:12px 24px;background:linear-gradient(135deg,#6366f1,#a855f7);border:none;border-radius:10px;color:white;font-family:'DM Mono',monospace;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 20px rgba(99,102,241,0.4)">
      ⬇ Tallenna PDF
    </button>
  </div>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

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
    ...(result?.cta ? [{ id: "cta", label: "CTA" }] : []),
    ...(result?.cta ? [{ id: "cta", label: "CTA" }] : []),
    ...(baseline ? [{ id: "beforeafter", label: "↑ Muutos" }] : []),
    ...(improved ? [{ id: "compare", label: "✦ Diff" }] : []),
  ];

  const tabDataMap = result ? { seo: result.seo, geo: result.geo, keyword: result.keyword, eeat: result.eeat, cta: result.cta } : {};
  const tabLabelMap = { seo: "Search Engine Optimization", geo: "Generative Engine Optimization", keyword: `Avainsana: "${keyword || "—"}"`, eeat: "Experience · Expertise · Authoritativeness · Trust", cta: "Call-to-Action — ostopolun selkeys" };
  const tabColorMap = { seo: "#6366f1", geo: "#06b6d4", keyword: "#f59e0b", eeat: "#22c55e", cta: "#f97316" };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const wcLimits = {
    blog:      { low: 400, good: 800, lowLabel: "liian lyhyt", midLabel: "kohtalainen", goodLabel: "hyvä", target: ">800" },
    instagram: { low: 50,  good: 150, lowLabel: "liian lyhyt", midLabel: "hyvä",        goodLabel: "pitkä — harkitse lyhentämistä", target: "100–150" },
    substack:  { low: 300, good: 600, lowLabel: "liian lyhyt", midLabel: "kohtalainen", goodLabel: "hyvä", target: "600–1200" },
    linkedin:  { low: 50,  good: 150, lowLabel: "liian lyhyt", midLabel: "hyvä",        goodLabel: "pitkä — tarkista merkkimäärä", target: "100–150 sanaa / 1000–1300 merkkiä" },
    ecommerce: { low: 150, good: 300, lowLabel: "liian lyhyt", midLabel: "kohtalainen", goodLabel: "hyvä", target: "300–500 sanaa" },
  };
  const wc = wcLimits[contentType] || wcLimits.blog;
  const wcColor = wordCount === 0 ? "rgba(255,255,255,0.2)" : wordCount < wc.low ? "#ef4444" : wordCount < wc.good ? "#f59e0b" : wordCount > wc.good * 1.5 && contentType !== "blog" ? "#f59e0b" : "#22c55e";
  const wcLabel = wordCount < wc.low ? wc.lowLabel : wordCount < wc.good ? wc.midLabel : wc.goodLabel;

  // ─── Styles ─────────────────────────────────────────────────────────────────
  const inputStyle = { width: "100%", background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: "8px", padding: "9px 12px", color: t.text, fontSize: "13px", fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: "10px", fontFamily: "'DM Mono', monospace", color: t.labelColor, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "7px" };
  const sectionLabel = (text, color) => (
    <div style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", color: color || t.sectionLabel, letterSpacing: "0.15em", textTransform: "uppercase", margin: "18px 0 8px" }}>{text}</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "Georgia, serif", transition: "background 0.3s, color 0.3s" }}>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 16 16"><path d="M2 4h12M2 8h8M2 12h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.2em", color: t.textMuted, textTransform: "uppercase" }}>DevKarhu</span>
            </div>

          </div>
          <h1 style={{ fontSize: "clamp(22px, 5vw, 36px)", fontWeight: "400", lineHeight: "1.1", letterSpacing: "-0.02em", marginBottom: "8px" }}>
            SEO <span style={{ color: "#6366f1" }}>&</span> GEO<br/>Analyzer
          </h1>
          <p style={{ color: t.textMuted, fontSize: "clamp(13px, 2vw, 14px)", lineHeight: "1.6" }}>
            Analysoi, optimoi ja paranna sisältöä — blogi, Instagram, Substack tai LinkedIn.
          </p>
        </div>

        {/* Input card */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "clamp(16px, 4vw, 24px)", marginBottom: "16px" }}>

          {/* Content type selector */}
          <div style={{ marginBottom: "20px" }}>
            <div style={labelStyle}>Sisältötyyppi</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
              {CONTENT_TYPES.map(t => (
                <button key={t.id} onClick={() => { setContentType(t.id); setResult(null); setBaseline(null); setImproved(null); }} style={{
                  padding: "10px 6px", borderRadius: "10px", border: "1px solid",
                  borderColor: contentType === t.id ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)",
                  background: contentType === t.id ? "rgba(99,102,241,0.25)" : t.surfaceHigh,
                  color: contentType === t.id ? "white" : t.textMuted,
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
            <textarea value={content} onChange={e => {
                const val = e.target.value;
                if (looksLikeHtml(val)) {
                  setContent(parseHtml(val));
                  setHtmlParsed(true);
                } else {
                  setContent(val);
                  setHtmlParsed(false);
                }
              }}
              placeholder="Liitä teksti tai HTML-lähdekoodi tähän — linkit ja kuvat säilytetään automaattisesti..." rows={7} className="input-focus"
              style={{ ...inputStyle, fontFamily: "Georgia, serif", fontSize: "14px", resize: "vertical", lineHeight: "1.6" }}
            />
            {htmlParsed && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px" }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="1.5"/><path d="M5 8l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <span style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#22c55e" }}>HTML parsittu — linkit ja kuvat säilytetty</span>
                <button onClick={() => { setHtmlParsed(false); }} style={{ marginLeft: "auto", fontSize: "10px", fontFamily: "'DM Mono', monospace", color: t.textFaint, background: "none", border: "none", cursor: "pointer" }}>× poista</button>
              </div>
            )}
            {wordCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" }}>
                <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: wcColor, fontWeight: "600" }}>{wordCount} sanaa</span>
                <span style={{ fontSize: "10px", color: t.textFaint }}>—</span>
                <span style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: t.textMuted }}>{wcLabel}</span>
                <span style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: t.textFaint, marginLeft: "auto" }}>tavoite {wc.target}</span>
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

          {error && <div style={{ marginBottom: "12px", padding: "10px 14px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "8px", fontSize: "13px", color: "#fca5a5" }}>{error}</div>}

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
        {(result || loading) && (
          <div style={{ position: "relative", animation: "fadeIn 0.4s ease" }}>
            {loading && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 10,
                background: "rgba(17,17,17,0.75)", borderRadius: "16px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: "14px", backdropFilter: "blur(4px)", minHeight: "200px"
              }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                  <circle cx="18" cy="18" r="14" stroke="rgba(255,255,255,0.1)" strokeWidth="3"/>
                  <path d="M18 4a14 14 0 0 1 14 14" stroke="#6366f1" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>Analysoidaan...</span>
              </div>
            )}

            {/* Score rings */}
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "clamp(16px, 4vw, 24px)", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.2em", color: t.textFaint, textTransform: "uppercase" }}>{result?.title || "Analysoidaan..."}</span>
                {result && <button onClick={exportPdf} style={{
                  padding: "5px 12px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                  borderRadius: "6px", color: "#a5b4fc", fontSize: "10px", fontFamily: "'DM Mono', monospace",
                  cursor: "pointer", letterSpacing: "0.05em", fontWeight: "600"
                }}>⬇ PDF</button>}
              </div>
              <div className="scores-row" style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                {result && <ScoreRing score={result.overallScore} label="Kokonais" color="#a855f7" />}
                {result && <ScoreRing score={result.seoScore} label="SEO" color="#6366f1" />}
                {result && <ScoreRing score={result.geoScore} label="GEO" color="#06b6d4" />}
                {result && keyword && <ScoreRing score={result.keywordScore || 50} label="Avainsana" color="#f59e0b" />}
                {result?.eeat && <ScoreRing score={result.eeat.score || 50} label="E-E-A-T" color="#22c55e" />}
                {result?.cta && <ScoreRing score={result.cta.score || 50} label="CTA" color="#f97316" />}
              </div>
            </div>

            {/* Tabs */}
            {result && <div style={{ display: "flex", gap: "3px", marginBottom: "10px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "4px" }}>
              {tabs.map(tab => (
                <button key={tab.id} className="tab-btn" onClick={() => setActiveTab(tab.id)} style={{
                  background: activeTab === tab.id ? (tab.id === "compare" || tab.id === "beforeafter" ? "rgba(168,85,247,0.3)" : "rgba(99,102,241,0.3)") : "transparent",
                  border: "1px solid " + (activeTab === tab.id ? (tab.id === "compare" || tab.id === "beforeafter" ? "rgba(168,85,247,0.4)" : "rgba(99,102,241,0.4)") : "transparent"),
                  color: activeTab === tab.id ? "white" : t.tabInactive,
                }}>{tab.label}</button>
              ))}
            </div>}

            {result && <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "clamp(16px, 4vw, 24px)" }}>

              {/* SEO / GEO / Keyword / E-E-A-T */}
              {["seo","geo","keyword","eeat","cta"].includes(activeTab) && (() => {
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
                            <span style={{ fontSize: "12px", color: t.textMuted, lineHeight: "1.5" }}>{issue}</span>
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
                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "11px 13px", marginBottom: "6px", background: t.winsBg, border: `1px solid ${t.winsBorder}`, borderRadius: "10px" }}>
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0, background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#a855f7", fontWeight: "700" }}>{i+1}</div>
                      <span style={{ fontSize: "13px", color: t.text, lineHeight: "1.5" }}>{win}</span>
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
                            <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: t.textMuted }}>{m.label}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: t.textFaint }}>{before} → {after}</span>
                              <span style={{ fontSize: "12px", fontFamily: "'DM Mono', monospace", fontWeight: "700", color: diffColor }}>{diff > 0 ? "+" : ""}{diff}</span>
                            </div>
                          </div>
                          <div style={{ position: "relative", height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${before}%`, background: "rgba(255,255,255,0.2)", borderRadius: "3px" }}/>
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
                  <div style={{ background: t.diffBg, border: `1px solid ${t.diffBorder}`, borderRadius: "12px", padding: "20px", fontSize: "14px", lineHeight: "1.8", color: t.text, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {renderDiff(improved)}
                  </div>
                </div>
              )}
            </div>}
          </div>
        )}

        <div style={{ marginTop: "40px", textAlign: "center" }}>
          <span style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", color: t.textFaint, letterSpacing: "0.1em" }}>DEVKARHU · SEO & GEO ANALYZER</span>
        </div>
      </div>
    </div>
  );
}
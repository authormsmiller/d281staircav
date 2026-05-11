// site/_data/searchIndex.js
// Generates a Lunr-compatible search index from all content types.
// Eleventy exposes this as {{ searchIndex }} in templates and as
// /search-index.json via the fetch in search.njk.
//
// Content types indexed:
//   soldiers  — soldiers/[slug]/[slug].md
//   events    — events/[slug]/index.md
//   documents — documents/[contributor]/[slug]/[slug].md
//   anecdotes — anecdotes/[soldier]/[slug]/index.md

const fs   = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// Parse front matter from a raw .md string.
// Returns parsed data object or null on failure.
function parseFrontMatter(raw, label) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  try {
    return yaml.load(match[1]);
  } catch (e) {
    console.warn(`searchIndex: failed to parse front matter for ${label}`, e);
    return null;
  }
}

// Extract the first paragraph of markdown body (after front matter)
// for use as an excerpt.
function extractExcerpt(raw) {
  const body = raw.replace(/^---[\s\S]*?---\n/, "").trim();
  const firstPara = body.split(/\n\n/)[0] || "";
  return firstPara.replace(/^#+\s+/, "").replace(/\s+/g, " ").trim().slice(0, 300);
}

// Flatten contains/tagged arrays to a space-separated string of slugs
// so Lunr can index them.
function slugList(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.map(s => (typeof s === "string" ? s : s.slug || "")).filter(Boolean).join(" ");
}

module.exports = function () {
  const base = path.join(__dirname, "..");
  const records = [];

  // ------------------------------------------------------------------
  // SOLDIERS
  // ------------------------------------------------------------------
  const soldiersDir = path.join(base, "soldiers");
  if (fs.existsSync(soldiersDir)) {
    for (const slug of fs.readdirSync(soldiersDir)) {
      if (!fs.statSync(path.join(soldiersDir, slug)).isDirectory()) continue;
      const filePath = path.join(soldiersDir, slug, slug + ".md");
      if (!fs.existsSync(filePath)) continue;
      const raw  = fs.readFileSync(filePath, "utf8");
      const data = parseFrontMatter(raw, slug);
      if (!data) continue;

      const parts = [data.rank, data.first_name, data.middle_name, data.last_name].filter(Boolean);
      records.push({
        type:          "soldier",
        id:            data.slug || slug,
        slug:          data.slug || slug,
        url:           `/soldiers/${data.slug || slug}/`,
        name:          parts.join(" "),
        first_name:    data.first_name  || "",
        last_name:     data.last_name   || "",
        nickname:      data.nickname    || "",
        rank:          data.rank        || "",
        platoon:       data.platoon     || "",
        mos:           data.mos         || "",
        arrived:       data.arrived     || "",
        departed:      data.departed    || "",
        hometown:      data.hometown    || "",
        status:        data.status      || "",
        excerpt:       data.timeline_source
                         ? data.timeline_source.replace(/\s+/g, " ").trim()
                         : extractExcerpt(raw),
        profile_photo: data.profile_photo || "",
      });
    }
  }

  // ------------------------------------------------------------------
  // EVENTS
  // ------------------------------------------------------------------
  const eventsDir = path.join(base, "events");
  if (fs.existsSync(eventsDir)) {
    for (const slug of fs.readdirSync(eventsDir)) {
      if (!fs.statSync(path.join(eventsDir, slug)).isDirectory()) continue;
      const filePath = path.join(eventsDir, slug, "index.md");
      if (!fs.existsSync(filePath)) continue;
      const raw  = fs.readFileSync(filePath, "utf8");
      const data = parseFrontMatter(raw, slug);
      if (!data) continue;
      if (data.status === "draft") continue;

      records.push({
        type:     "event",
        id:       data.slug || slug,
        slug:     data.slug || slug,
        url:      `/events/${data.slug || slug}/`,
        name:     data.title || slug,
        date:     data.date  || "",
        location: data.location || "",
        contains: slugList(data.contains),
        tagged:   slugList(data.tagged),
        excerpt:  extractExcerpt(raw),
      });
    }
  }

  // ------------------------------------------------------------------
  // DOCUMENTS
  // documents/[contributor]/[doc-slug]/[doc-slug].md
  // ------------------------------------------------------------------
  const docsDir = path.join(base, "documents");
  if (fs.existsSync(docsDir)) {
    for (const contributor of fs.readdirSync(docsDir)) {
      const contribPath = path.join(docsDir, contributor);
      if (!fs.statSync(contribPath).isDirectory()) continue;
      for (const docSlug of fs.readdirSync(contribPath)) {
        const docPath = path.join(contribPath, docSlug);
        if (!fs.statSync(docPath).isDirectory()) continue;
        const filePath = path.join(docPath, docSlug + ".md");
        if (!fs.existsSync(filePath)) continue;
        const raw  = fs.readFileSync(filePath, "utf8");
        const data = parseFrontMatter(raw, docSlug);
        if (!data) continue;
        if (data.status === "draft") continue;

        records.push({
          type:        "document",
          id:          data.slug || docSlug,
          slug:        data.slug || docSlug,
          url:         `/documents/${contributor}/${docSlug}/`,
          name:        data.title || docSlug,
          date:        data.date  || "",
          contributor: contributor,
          event:       data.event || "",
          contains:    slugList(data.contains),
          tagged:      slugList(data.tagged),
          excerpt:     extractExcerpt(raw),
        });
      }
    }
  }

  // ------------------------------------------------------------------
  // ANECDOTES
  // anecdotes/[soldier]/[anecdote-slug]/index.md
  // ------------------------------------------------------------------
  const anecdotesDir = path.join(base, "anecdotes");
  if (fs.existsSync(anecdotesDir)) {
    for (const soldier of fs.readdirSync(anecdotesDir)) {
      const soldierPath = path.join(anecdotesDir, soldier);
      if (!fs.statSync(soldierPath).isDirectory()) continue;
      for (const anecdoteSlug of fs.readdirSync(soldierPath)) {
        const anecdotePath = path.join(soldierPath, anecdoteSlug);
        if (!fs.statSync(anecdotePath).isDirectory()) continue;
        const filePath = path.join(anecdotePath, "index.md");
        if (!fs.existsSync(filePath)) continue;
        const raw  = fs.readFileSync(filePath, "utf8");
        const data = parseFrontMatter(raw, anecdoteSlug);
        if (!data) continue;
        if (data.status === "draft") continue;

        records.push({
          type:     "anecdote",
          id:       data.slug || anecdoteSlug,
          slug:     data.slug || anecdoteSlug,
          url:      `/anecdotes/${soldier}/${anecdoteSlug}/`,
          name:     data.title || anecdoteSlug,
          date:     data.date  || "",
          event:    data.event || "",
          contains: slugList(data.contains),
          tagged:   slugList(data.tagged),
          excerpt:  extractExcerpt(raw),
        });
      }
    }
  }

  return records;
};

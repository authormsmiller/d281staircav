// site/_data/_crawlDocuments.js
// Shared crawl utility. Not exposed to Eleventy directly (underscore prefix).
// Called by documentsBySlug.js and documentsByEvent.js.
//
// Returns:
//   {
//     bySlug:  { [soldierSlug]: { authored: [], referenced: [], tagged: [] } }
//     byEvent: { [eventSlug]:   [...docs] }
//   }

const fs     = require('fs');
const path   = require('path');
const matter = require('gray-matter');

const DOCUMENTS_DIR = path.join(__dirname, '../documents');

module.exports = function crawlDocuments() {
  const bySlug  = {};
  const byEvent = {};

  // ── Helpers ────────────────────────────────────────────────────────────────

  function ensureSlug(slug) {
    if (!bySlug[slug]) {
      bySlug[slug] = { authored: [], referenced: [], tagged: [] };
    }
  }

  function addToEvent(eventSlug, doc) {
    if (!byEvent[eventSlug]) byEvent[eventSlug] = [];
    byEvent[eventSlug].push(doc);
  }

  // ── Crawl ──────────────────────────────────────────────────────────────────

  const topSlugs = fs.readdirSync(DOCUMENTS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  for (const topSlug of topSlugs) {
    const topDir = path.join(DOCUMENTS_DIR, topSlug);

    const docSlugs = fs.readdirSync(topDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name);

    for (const docSlug of docSlugs) {
      const docFile = path.join(topDir, docSlug, `${docSlug}.md`);

      if (!fs.existsSync(docFile)) continue;

      const { data: fm } = matter(fs.readFileSync(docFile, 'utf8'));

      // Minimal doc descriptor stored in indexes
      const doc = {
        slug:       docSlug,
        topSlug,
        title:      fm.title      || '',
        type:       fm.type       || '',
        date:       fm.doc_date   || '',
        date_known: fm.date_known !== false, // missing field defaults to true
        status:     fm.status     || 'draft',
        source:     fm.source     || '',
        event:      fm.event      || '',
        path:       `${topSlug}/${docSlug}`,
      };

      // ── authored ────────────────────────────────────────────────────────────
      if (fm.author) {
        ensureSlug(fm.author);
        bySlug[fm.author].authored.push(doc);
      }

      // ── referenced (contains:) ──────────────────────────────────────────────
      if (Array.isArray(fm.contains)) {
        for (const slug of fm.contains) {
          ensureSlug(slug);
          bySlug[slug].referenced.push(doc);
        }
      }

      // ── tagged ──────────────────────────────────────────────────────────────
      if (Array.isArray(fm.tagged)) {
        for (const slug of fm.tagged) {
          ensureSlug(slug);
          bySlug[slug].tagged.push(doc);
        }
      }

      // ── event index ─────────────────────────────────────────────────────────
      if (fm.event) {
        addToEvent(fm.event, doc);
      }
    }
  }

  return { bySlug, byEvent };
};

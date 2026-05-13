// site/_data/photosBySlug.js
//
// Photo crawler — Phase 4
// Walks site/soldiers/[slug]/photos/[subfolder]/index.md
// Reads front matter from each index file
// Builds a keyed object: { [soldierSlug]: { profile: [...], field: [...], ... } }
// Each photo entry gets a resolved `url` pointing to the Cloudflare Worker path.
//
// Templates consume this instead of the `photos:` array in soldier front matter.
// The `photos:` array in soldier .md files is kept as a fallback until Phase 5 removes it.
//
// Output shape:
// {
//   "miller-marvin-dale": {
//     profile: [
//       {
//         filename: "marvin-miller-selfie.jpg",
//         caption: "...",
//         caption_short: "...",
//         credit: "...",
//         credit_slug: "...",
//         date: "1971-04-20",
//         date_known: false,
//         event: "contact-fsb-fontaine-1971-04-20",
//         contains: ["miller-marvin-dale"],
//         tagged: [],
//         subfolder: "profile",
//         soldier_slug: "miller-marvin-dale",
//         url: "/media/photos/soldiers/miller-marvin-dale/profile/marvin-miller-selfie.jpg"
//       }
//     ],
//     field: [...],
//     "field/events": [...]
//   }
// }
//
// Cross-reference output (separate export not possible from a single data file,
// but photosBySlug also exposes a `byContains` map for reverse lookups):
// photosBySlug._byContains["weaver-ken"] → [ ...photo entries where contains includes weaver-ken ]
// photosBySlug._byTagged["cate-larry"]  → [ ...photo entries where tagged includes cate-larry ]

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SOLDIERS_DIR = path.join(__dirname, "..", "soldiers");
const MEDIA_BASE = "/media/photos/soldiers";

// Subfolders we recognize. Order matters for profile photo resolution:
// the first matching subfolder with a photo is used as profile_photo fallback.
const KNOWN_SUBFOLDERS = [
  "profile",
  "field",
  "field/events",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a photo index.md file.
 * The file is front-matter only (no body required) OR front-matter + body.
 * Front matter contains a `photos:` array, each entry being a photo object.
 * Returns the `photos` array, or [] if the file is missing/malformed.
 */
function parsePhotoIndex(indexPath) {
  if (!fs.existsSync(indexPath)) return [];

  const raw = fs.readFileSync(indexPath, "utf8");

  // Extract front matter between --- delimiters
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return [];

  let parsed;
  try {
    parsed = yaml.load(match[1]);
  } catch (e) {
    console.warn(`[photosBySlug] YAML parse error in ${indexPath}:`, e.message);
    return [];
  }

  if (!parsed || !Array.isArray(parsed.photos)) return [];

  return parsed.photos;
}

/**
 * Resolve a photo entry: add computed fields.
 */
function resolvePhoto(entry, soldierSlug, subfolder) {
  if (!entry.filename) return null;

  return {
    // Source fields (pass through as-is)
    filename: entry.filename,
    caption: entry.caption || "",
    caption_short: entry.caption_short || "",
    credit: entry.credit || "",
    credit_slug: entry.credit_slug || "",
    photographer: entry.photographer || "",
    date: entry.date || "",
    date_known: entry.date_known === true,
    event: entry.event || "",
    contains: Array.isArray(entry.contains) ? entry.contains : [],
    tagged: Array.isArray(entry.tagged) ? entry.tagged : [],

    // Computed fields
    subfolder: subfolder,
    soldier_slug: soldierSlug,
    url: `${MEDIA_BASE}/${soldierSlug}/${subfolder}/${entry.filename}`,
  };
}

// ---------------------------------------------------------------------------
// Main crawler
// ---------------------------------------------------------------------------

module.exports = function () {
  const result = {};
  const byContains = {};
  const byTagged = {};

  // Guard: soldiers directory must exist
  if (!fs.existsSync(SOLDIERS_DIR)) {
    console.warn(`[photosBySlug] Soldiers directory not found: ${SOLDIERS_DIR}`);
    return result;
  }

  const soldierDirs = fs.readdirSync(SOLDIERS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const soldierSlug of soldierDirs) {
    const photosRoot = path.join(SOLDIERS_DIR, soldierSlug, "photos");
    if (!fs.existsSync(photosRoot)) continue;

    const soldierPhotos = {};

    for (const subfolder of KNOWN_SUBFOLDERS) {
      const indexPath = path.join(photosRoot, subfolder, "index.md");
      const rawEntries = parsePhotoIndex(indexPath);
      const resolved = rawEntries
        .map(entry => resolvePhoto(entry, soldierSlug, subfolder))
        .filter(Boolean);

      if (resolved.length > 0) {
        soldierPhotos[subfolder] = resolved;

        // Build reverse lookup maps
        for (const photo of resolved) {
          for (const slug of photo.contains) {
            if (!byContains[slug]) byContains[slug] = [];
            byContains[slug].push(photo);
          }
          for (const slug of photo.tagged) {
            if (!byTagged[slug]) byTagged[slug] = [];
            byTagged[slug].push(photo);
          }
        }
      }
    }

    // Also check for any unexpected subfolders (non-destructive scan)
    const unexpectedSubfolders = [];
    if (fs.existsSync(photosRoot)) {
      const topLevel = fs.readdirSync(photosRoot, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      for (const dir of topLevel) {
        if (!KNOWN_SUBFOLDERS.includes(dir)) {
          // Recurse one level (e.g., field/events is already covered above
          // but a new 'documents' subfolder would appear here)
          unexpectedSubfolders.push(dir);
        }
      }
    }
    if (unexpectedSubfolders.length > 0) {
      console.warn(
        `[photosBySlug] Unknown photo subfolders for ${soldierSlug}: ${unexpectedSubfolders.join(", ")}` +
        ` — add to KNOWN_SUBFOLDERS in photosBySlug.js to index them`
      );
    }

    if (Object.keys(soldierPhotos).length > 0) {
      result[soldierSlug] = soldierPhotos;
    }
  }

  // Attach reverse lookup maps as non-enumerable properties
  // so templates can use photosBySlug._byContains["weaver-ken"]
  Object.defineProperty(result, "_byContains", { value: byContains, enumerable: false });
  Object.defineProperty(result, "_byTagged",   { value: byTagged,   enumerable: false });

  return result;
};

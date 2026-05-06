// site/_data/searchIndex.js
// Generates a Lunr-compatible search index from the soldiers collection.
// Eleventy exposes this as {{ searchIndex }} in templates and as
// /search-index.json via the fetch in search.njk.

const fs   = require("fs");
const path = require("path");
const yaml = require("js-yaml");

module.exports = function () {
  const soldiersDir = path.join(__dirname, "../soldiers");

  if (!fs.existsSync(soldiersDir)) return [];

  const slugs = fs.readdirSync(soldiersDir).filter((entry) => {
    return fs.statSync(path.join(soldiersDir, entry)).isDirectory();
  });

  const soldiers = [];

  for (const slug of slugs) {
  const indexPath = path.join(soldiersDir, slug, slug + ".md");
    if (!fs.existsSync(indexPath)) continue;

    const raw  = fs.readFileSync(indexPath, "utf8");
    const match = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;

    let data;
    try {
      data = yaml.load(match[1]);
    } catch (e) {
      console.warn(`searchIndex: failed to parse front matter for ${slug}`, e);
      continue;
    }

    // Build a clean display name from available fields
    const parts = [
      data.rank,
      data.first_name,
      data.middle_name,
      data.last_name,
    ].filter(Boolean);
    const displayName = parts.join(" ");

    soldiers.push({
      id:          data.slug || slug,
      slug:        data.slug || slug,
      name:        displayName,
      first_name:  data.first_name  || "",
      last_name:   data.last_name   || "",
      nickname:    data.nickname    || "",
      rank:        data.rank        || "",
      platoon:     data.platoon     || "",
      mos:         data.mos         || "",
      arrived:     data.arrived     || "",
      departed:    data.departed    || "",
      hometown:    data.hometown    || "",
      status:      data.status      || "",
      excerpt:     data.timeline_source
                     ? data.timeline_source.replace(/\s+/g, " ").trim()
                     : "",
      profile_photo: data.profile_photo || "",
    });
  }

  return soldiers;
};

// site/_data/documentsBySlug.js
// Exposes the bySlug index to Eleventy templates as `documentsBySlug`.
//
// Usage in templates:
//   documentsBySlug["miller-marvin-dale"].authored
//   documentsBySlug["miller-marvin-dale"].referenced
//   documentsBySlug["miller-marvin-dale"].tagged

const crawl = require('./_crawlDocuments');

module.exports = function () {
  return crawl().bySlug;
};

// site/_data/documentsByEvent.js
// Exposes the byEvent index to Eleventy templates as `documentsByEvent`.
//
// Usage in templates:
//   documentsByEvent["contact-19710420"]

const crawl = require('./_crawlDocuments');

module.exports = function () {
  return crawl().byEvent;
};

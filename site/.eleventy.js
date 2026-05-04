module.exports = function(eleventyConfig) {

  // Pass static assets through unchanged
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("soldiers");
  eleventyConfig.addPassthroughCopy("documents");
  eleventyConfig.addPassthroughCopy("anecdotes");
  eleventyConfig.addWatchTarget("assets/");

  // Collections
  // All soldier profiles — sorted by last name
  eleventyConfig.addCollection("soldiers", function(collectionApi) {
    return collectionApi
      .getFilteredByGlob("./soldiers/*/*.md")
      .sort((a, b) => {
        const nameA = (a.data.last_name || "").toLowerCase();
        const nameB = (b.data.last_name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
  });

  // KIA soldiers only — for the Never Forgotten section
  eleventyConfig.addCollection("kia", function(collectionApi) {
    return collectionApi
      .getFilteredByGlob("./soldiers/*/*.md")
      .filter(s => s.data.status === "KIA");
  });

  // Document pages — sorted by contributor then slug
  eleventyConfig.addCollection("documents", function(collectionApi) {
  return collectionApi.getFilteredByGlob("./documents/**/*.md");
  });

  eleventyConfig.addCollection("anecdotes", function(collectionApi) {
  return collectionApi.getFilteredByGlob("./anecdotes/**/*.md");
  });
  
  // All photos across all soldiers — for cross-soldier contains queries
  eleventyConfig.addCollection("allPhotos", function(collectionApi) {
    const soldiers = collectionApi.getFilteredByGlob("./soldiers/*/*.md");
    const allPhotos = [];
    for (const soldier of soldiers) {
      const photos = soldier.data.photos || [];
      for (const photo of photos) {
        allPhotos.push({
          ...photo,
          source_soldier_slug: soldier.data.slug,
          source_soldier_name: soldier.data.first_name + " " + soldier.data.last_name,
        });
      }
    }
    return allPhotos;
  });

  // Filters
  // Format a date string nicely: "December 1970"
  eleventyConfig.addFilter("dateDisplay", function(dateStr) {
    if (!dateStr) return "—";
    return dateStr;
  });

  // Join an array with a separator
  eleventyConfig.addFilter("join", function(arr, sep = ", ") {
    if (!arr || !Array.isArray(arr)) return "";
    return arr.join(sep);
  });

  // Return first item of array (for profile photo)
  eleventyConfig.addFilter("first", function(arr) {
    if (!arr || !arr.length) return null;
    return arr[0];
  });

  // Nickname display — wraps in quotes if present
  eleventyConfig.addFilter("nickname", function(nick) {
    if (!nick) return "";
    return `"${nick}"`;
  });
  // Limit array to N items
  eleventyConfig.addFilter("limit", function(arr, n) {
    if (!arr || !Array.isArray(arr)) return [];
    return arr.slice(0, n);
  });
  return {
    dir: {
      input:    ".",
      output:   "_site",
      includes: "_includes",
      data:     "_data"
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};

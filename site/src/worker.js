export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle /media/* requests — serve from R2
    if (path.startsWith("/media/")) {
      return handleMedia(request, env, path);
    }

    // Everything else — pass through to static assets
    return fetch("https://d281staircav.pages.dev" + url.pathname + url.search, request);
  },
};

async function handleMedia(request, env, path) {
  let bucket;
  let key;

  if (path.startsWith("/media/photos/")) {
    bucket = env.PHOTOS;
    key = path.slice("/media/photos/".length);
  } else if (path.startsWith("/media/documents/")) {
    bucket = env.DOCUMENTS;
    key = path.slice("/media/documents/".length);
  } else {
    return new Response("Not found", { status: 404 });
  }

  if (!key) {
    return new Response("Not found", { status: 404 });
  }

  const object = await bucket.get(key);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const contentType = getContentType(key);

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", object.httpEtag);

  const ifNoneMatch = request.headers.get("If-None-Match");
  if (ifNoneMatch === object.httpEtag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(object.body, { status: 200, headers });
}

function getContentType(key) {
  const ext = key.split(".").pop().toLowerCase();
  const types = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
  };
  return types[ext] || "application/octet-stream";
}

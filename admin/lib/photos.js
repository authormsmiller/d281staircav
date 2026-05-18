import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

// ---------------------------------------------------------------------------
// Paths — all relative to repo root (two levels up from admin/lib/)
// ---------------------------------------------------------------------------
const REPO_ROOT = path.resolve(process.cwd(), '..');
const INTAKE_ROOT = path.join(REPO_ROOT, '_intake');
const RAW_PHOTOS = path.join(INTAKE_ROOT, 'raw', 'photos');
const STAGING_PHOTOS = path.join(INTAKE_ROOT, 'staging', 'photos');
const SITE_SOLDIERS = path.join(REPO_ROOT, 'site', 'soldiers');
const LOG_FILE = path.join(INTAKE_ROOT, 'photo-intake.log');

// ---------------------------------------------------------------------------
// Log helpers
// ---------------------------------------------------------------------------
function readLog() {
  if (!fs.existsSync(LOG_FILE)) return [];
  return fs.readFileSync(LOG_FILE, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
}

function appendLog(entry) {
  const line = JSON.stringify({ ...entry, ts: new Date().toISOString() });
  fs.appendFileSync(LOG_FILE, line + '\n', 'utf-8');
}

function logHasStage(folderName) {
  return readLog().some(e => e.folder === folderName && e.action === 'staged');
}

// ---------------------------------------------------------------------------
// Fuzzy match helper — score against roster slugs
// ---------------------------------------------------------------------------
function fuzzyScore(input, slug) {
  const a = input.toLowerCase().replace(/[^a-z]/g, '');
  const b = slug.replace(/-/g, '');
  if (b.includes(a) || a.includes(b)) return 1;
  let matches = 0;
  for (const ch of a) { if (b.includes(ch)) matches++; }
  return matches / Math.max(a.length, b.length);
}

function fuzzyMatchSlugs(name, slugs, topN = 6) {
  const scored = slugs
    .map(s => ({ slug: s, score: fuzzyScore(name, s) }))
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, topN).map(s => s.slug);
}

// ---------------------------------------------------------------------------
// Roster slugs (same source as other tabs)
// ---------------------------------------------------------------------------
function getRosterSlugs() {
  const soldiersDir = SITE_SOLDIERS;
  if (!fs.existsSync(soldiersDir)) return [];
  return fs.readdirSync(soldiersDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();
}

// ---------------------------------------------------------------------------
// Raw folder helpers
// ---------------------------------------------------------------------------
function listRawFolders() {
  if (!fs.existsSync(RAW_PHOTOS)) return [];
  return fs.readdirSync(RAW_PHOTOS, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const folderPath = path.join(RAW_PHOTOS, d.name);
      const files = fs.readdirSync(folderPath);
      const photos = files.filter(f => /\.(jpg|jpeg|png|tiff|webp)$/i.test(f));
      const notes = files.find(f => /^notes\.(txt|rtf)$/i.test(f)) || null;
      const alreadyStaged = logHasStage(d.name);
      // Parse name and timestamp from folder name e.g. "Marvin Miller-051526-103045"
      const match = d.name.match(/^(.+?)-(\d{6})-(\d{6})$/);
      const displayName = match ? match[1] : d.name;
      const timestamp = match ? `${match[2]}-${match[3]}` : '';
      return {
        folder: d.name,
        displayName,
        timestamp,
        photoCount: photos.length,
        hasNotes: !!notes,
        notesFile: notes,
        alreadyStaged,
        status: alreadyStaged ? 'already-staged' : 'ready'
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function getRawFolderDetail(folderName) {
  const folderPath = path.join(RAW_PHOTOS, folderName);
  if (!fs.existsSync(folderPath)) return null;
  const files = fs.readdirSync(folderPath);
  const photos = files.filter(f => /\.(jpg|jpeg|png|tiff|webp)$/i.test(f));
  const notesFile = files.find(f => /^notes\.(txt|rtf)$/i.test(f)) || null;
  let notesContent = '';
  if (notesFile) {
    try { notesContent = fs.readFileSync(path.join(folderPath, notesFile), 'utf-8'); } catch {}
  }
  // Fuzzy match
  const match = folderName.match(/^(.+?)-(\d{6})-(\d{6})$/);
  const displayName = match ? match[1] : folderName;
  const slugs = getRosterSlugs();
  const suggestions = fuzzyMatchSlugs(displayName, slugs);
  return { folderName, displayName, photos, notesContent, suggestions, allSlugs: slugs };
}

// ---------------------------------------------------------------------------
// Move raw folder to staging
// ---------------------------------------------------------------------------
async function moveToStaging(folderName, soldierSlug) {
  if (logHasStage(folderName)) {
    return { ok: false, error: `${folderName} has already been moved to staging.` };
  }
  const srcDir = path.join(RAW_PHOTOS, folderName);
  const destDir = path.join(STAGING_PHOTOS, soldierSlug);
  if (!fs.existsSync(srcDir)) return { ok: false, error: 'Raw folder not found.' };

  await fsp.mkdir(destDir, { recursive: true });

  const files = await fsp.readdir(srcDir);
  for (const file of files) {
    const src = path.join(srcDir, file);
    const isNotes = /^notes\.(txt|rtf)$/i.test(file);
    if (isNotes) {
      // Append to existing notes.txt with separator
      const destNotes = path.join(destDir, 'notes.txt');
      const content = await fsp.readFile(src, 'utf-8');
      const separator = `\n\n--- Submission: ${folderName} ---\n\n`;
      await fsp.appendFile(destNotes, separator + content, 'utf-8');
    } else {
      // Copy photo — skip if filename already exists (collision: keep existing)
      const dest = path.join(destDir, file);
      if (!fs.existsSync(dest)) {
        await fsp.copyFile(src, dest);
      }
    }
  }

  appendLog({ folder: folderName, slug: soldierSlug, action: 'staged' });
  return { ok: true, slug: soldierSlug };
}

// ---------------------------------------------------------------------------
// Staging folder helpers
// ---------------------------------------------------------------------------
function listStagingFolders() {
  if (!fs.existsSync(STAGING_PHOTOS)) return [];
  const slugs = getRosterSlugs();
  return fs.readdirSync(STAGING_PHOTOS, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const folderPath = path.join(STAGING_PHOTOS, d.name);
      const files = fs.readdirSync(folderPath);
      const photos = files.filter(f => /\.(jpg|jpeg|png|tiff|webp)$/i.test(f));
      const isExisting = slugs.includes(d.name);
      return { slug: d.name, photoCount: photos.length, isExisting };
    })
    .sort((a, b) => {
      // Existing profiles first, new soldiers second
      if (a.isExisting !== b.isExisting) return a.isExisting ? -1 : 1;
      return a.slug.localeCompare(b.slug);
    });
}

function getStagingFolderDetail(slug) {
  const folderPath = path.join(STAGING_PHOTOS, slug);
  if (!fs.existsSync(folderPath)) return null;
  const files = fs.readdirSync(folderPath);
  const photos = files.filter(f => /\.(jpg|jpeg|png|tiff|webp)$/i.test(f)).sort();
  const notesFile = path.join(folderPath, 'notes.txt');
  let notesContent = '';
  try { notesContent = fs.readFileSync(notesFile, 'utf-8'); } catch {}
  const slugs = getRosterSlugs();
  const isExisting = slugs.includes(slug);
  return { slug, photos, notesContent, isExisting };
}

// ---------------------------------------------------------------------------
// Known events list (for event destination dropdown)
// ---------------------------------------------------------------------------
function getKnownEvents() {
  const eventsDir = path.join(REPO_ROOT, 'site', 'events');
  if (!fs.existsSync(eventsDir)) return [];
  return fs.readdirSync(eventsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();
}

// ---------------------------------------------------------------------------
// YAML scalar helper — wraps a value in double quotes, escaping any
// embedded backslashes and double quotes so the output is always valid YAML.
// Use for any free-text field that could contain colons or special chars.
// ---------------------------------------------------------------------------
function yamlStr(val) {
  const s = (val || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${s}"`;
}

// ---------------------------------------------------------------------------
// Flush buffer to disk
// Each entry in buffer: { filename, dest, eventSlug, caption, caption_short,
//   credit, contains, tagged, quality, date, date_known }
// dest: 'field' | 'profile' | 'event'
// ---------------------------------------------------------------------------
async function flushBuffer(slug, buffer) {
  const stagingDir = path.join(STAGING_PHOTOS, slug);
  const soldiersDir = path.join(SITE_SOLDIERS, slug);

  // Group by destination
  // Profile entries use subjectSlug override if provided, otherwise fall back to folder slug
  const byDest = { field: [], profile: {}, event: {} };
  for (const entry of buffer) {
    if (entry.dest === 'profile') {
      const subject = (entry.subjectSlug && entry.subjectSlug.trim()) ? entry.subjectSlug.trim() : slug;
      if (!byDest.profile[subject]) byDest.profile[subject] = [];
      byDest.profile[subject].push(entry);
    } else if (entry.dest === 'event') {
      const es = entry.eventSlug || 'unknown';
      if (!byDest.event[es]) byDest.event[es] = [];
      byDest.event[es].push(entry);
    } else {
      byDest.field.push(entry);
    }
  }

  const results = { moved: [], written: [], errors: [] };

  // Helper: ensure dir, copy photo, append to index.md
  // targetSlug: optional override for which soldier folder to write into (for profile subject overrides)
  async function processEntries(entries, photosSubdir, targetSlug) {
    if (!entries.length) return;
    const targetSoldiersDir = targetSlug ? path.join(SITE_SOLDIERS, targetSlug) : soldiersDir;
    const destPhotoDir = path.join(targetSoldiersDir, 'photos', photosSubdir);
    await fsp.mkdir(destPhotoDir, { recursive: true });
    const indexPath = path.join(destPhotoDir, 'index.md');

    // Build YAML entries
    const yamlBlocks = [];
    for (const e of entries) {
      const srcPhoto = path.join(stagingDir, e.filename);
      const destPhoto = path.join(destPhotoDir, e.filename);
      try {
        await fsp.copyFile(srcPhoto, destPhoto);
        results.moved.push(`${photosSubdir}/${e.filename}`);
      } catch (err) {
        results.errors.push(`Failed to copy ${e.filename}: ${err.message}`);
        continue;
      }
      const contains = e.contains ? e.contains.split(',').map(s => s.trim()).filter(Boolean) : [];
      const tagged = e.tagged ? e.tagged.split(',').map(s => s.trim()).filter(Boolean) : [];
      const block = [
        `  - filename: ${e.filename}`,
        `    caption: >`,
        `      ${(e.caption || '').replace(/\n/g, '\n      ')}`,
        `    caption_short: ${yamlStr(e.caption_short)}`,
        `    credit: ${yamlStr(e.credit)}`,
        `    photographer: ${yamlStr(e.photographer)}`,
        `    date: ${e.date || ''}`,
        `    date_known: ${e.date_known === true || e.date_known === 'true' ? 'true' : 'false'}`,
        `    event: ${e.eventSlug || '""'}`,
        `    quality: ${e.quality || ''}`,
        contains.length ? `    contains:\n${contains.map(c => `      - ${c}`).join('\n')}` : `    contains: []`,
        tagged.length ? `    tagged:\n${tagged.map(t => `      - ${t}`).join('\n')}` : `    tagged: []`,
      ].join('\n');
      yamlBlocks.push(block);
    }

    if (!yamlBlocks.length) return;

    // Append to index.md or create it
    if (!fs.existsSync(indexPath)) {
      const header = `---\nsoldier: ${targetSlug || slug}\nsubfolder: ${photosSubdir}\nphotos:\n`;
      await fsp.writeFile(indexPath, header + yamlBlocks.join('\n') + '\n---\n', 'utf-8');
    } else {
      // Insert before closing ---
      let existing = await fsp.readFile(indexPath, 'utf-8');
      const closeMarker = '\n---\n';
      if (existing.endsWith(closeMarker)) {
        existing = existing.slice(0, -closeMarker.length);
        existing += '\n' + yamlBlocks.join('\n') + closeMarker;
      } else {
        existing += '\n' + yamlBlocks.join('\n') + '\n';
      }
      await fsp.writeFile(indexPath, existing, 'utf-8');
    }
    results.written.push(indexPath);
  }

  await processEntries(byDest.field, 'field');
  for (const [subject, entries] of Object.entries(byDest.profile)) {
    await processEntries(entries, 'profile', subject);
  }
  for (const [eventSlug, entries] of Object.entries(byDest.event)) {
    await processEntries(entries, `field/events/${eventSlug}`);
  }

  // Clean up staging folder after successful flush
  if (!results.errors.length) {
    try {
      await fsp.rm(stagingDir, { recursive: true, force: true });
      appendLog({ slug, action: 'flushed', photoCount: buffer.length });
    } catch (err) {
      results.errors.push(`Staging cleanup failed: ${err.message}`);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Register all routes
// ---------------------------------------------------------------------------
export function registerPhotosRoutes(app) {

  // GET /api/photos/staging/:slug/image/:filename — serve a staging photo file
  app.get('/api/photos/staging/:slug/image/:filename', (req, res) => {
    try {
      const { slug, filename } = req.params;
      const filePath = path.join(STAGING_PHOTOS, slug, filename);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
      res.sendFile(filePath);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/photos/raw — list raw folders with counts
  app.get('/api/photos/raw', (req, res) => {
    try {
      res.json({ folders: listRawFolders() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/photos/raw/:folder — detail + fuzzy match suggestions
  app.get('/api/photos/raw/:folder', (req, res) => {
    try {
      const detail = getRawFolderDetail(req.params.folder);
      if (!detail) return res.status(404).json({ error: 'Folder not found' });
      res.json(detail);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/photos/raw/stage — move raw folder to staging
  // Body: { folder, slug }
  app.post('/api/photos/raw/stage', async (req, res) => {
    try {
      const { folder, slug } = req.body;
      if (!folder || !slug) return res.status(400).json({ error: 'folder and slug required' });
      const result = await moveToStaging(folder, slug);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/photos/staging — list staging folders
  app.get('/api/photos/staging', (req, res) => {
    try {
      res.json({ folders: listStagingFolders() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/photos/staging/:slug — detail for one staging folder
  app.get('/api/photos/staging/:slug', (req, res) => {
    try {
      const detail = getStagingFolderDetail(req.params.slug);
      if (!detail) return res.status(404).json({ error: 'Staging folder not found' });
      res.json(detail);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/photos/events — known event slugs for dropdown
  app.get('/api/photos/events', (req, res) => {
    try {
      res.json({ events: getKnownEvents() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/photos/flush — flush buffer to site/ and clean staging
  // Body: { slug, buffer: [...] }
  app.post('/api/photos/flush', async (req, res) => {
    try {
      const { slug, buffer } = req.body;
      if (!slug || !Array.isArray(buffer)) {
        return res.status(400).json({ error: 'slug and buffer array required' });
      }
      const result = await flushBuffer(slug, buffer);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/photos/log — read intake log (for UI display)
  app.get('/api/photos/log', (req, res) => {
    try {
      res.json({ entries: readLog() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/photos/counts — raw + staging counts for tab bubbles
  app.get('/api/photos/counts', (req, res) => {
    try {
      const raw = fs.existsSync(RAW_PHOTOS)
        ? fs.readdirSync(RAW_PHOTOS, { withFileTypes: true }).filter(d => d.isDirectory()).length
        : 0;
      const staging = fs.existsSync(STAGING_PHOTOS)
        ? fs.readdirSync(STAGING_PHOTOS, { withFileTypes: true }).filter(d => d.isDirectory()).length
        : 0;
      res.json({ raw, staging, total: raw + staging });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

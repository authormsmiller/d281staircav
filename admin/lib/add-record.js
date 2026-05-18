// admin/lib/add-record.js
// Add Record tab — server endpoints (ES module version)
// Usage in server.js:
//   import registerAddRecordRoutes from './lib/add-record.js';
//   registerAddRecordRoutes(app, __dirname);

import fs   from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { buildSoldierStub } from './soldiers.js';

const fsp = fs.promises;

// ─── Path helpers ─────────────────────────────────────────────────────────────

function repoRoot(adminDir) {
  return path.resolve(adminDir, '..');
}

function intakePath(adminDir, ...parts) {
  return path.join(repoRoot(adminDir), '_intake', ...parts);
}

function sitePath(adminDir, ...parts) {
  return path.join(repoRoot(adminDir), 'site', ...parts);
}

// ─── Fuzzy slug match ─────────────────────────────────────────────────────────

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function fuzzyMatch(query, slugs) {
  if (!query) return [];
  const q = query.toLowerCase().replace(/\s+/g, '-');
  return slugs
    .map(slug => ({ slug, score: levenshtein(q, slug) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);
}

// ─── Roster loader ────────────────────────────────────────────────────────────

async function loadRoster(adminDir) {
  const p = sitePath(adminDir, '_data', 'roster.json');
  try {
    const raw = await fsp.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// ─── _intake folder walker ────────────────────────────────────────────────────

async function walkIntake(base) {
  const results = [];
  async function walk(dir) {
    let entries;
    try { entries = await fsp.readdir(dir, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) await walk(abs);
      else if (e.name !== '.gitkeep') results.push({ rel: path.relative(base, abs), abs });
    }
  }
  await walk(base);
  return results;
}

async function stagingSummary(adminDir) {
  const stagingBase = intakePath(adminDir, 'staging');
  const types = ['docs', 'photos', 'letters', 'anecdotes', 'soldiers', 'events-todo', 'unsorted'];
  const result = {};
  for (const t of types) {
    const files = await walkIntake(path.join(stagingBase, t));
    result[t] = files.map(f => ({
      rel:       f.rel,
      name:      path.basename(f.abs),
      subfolder: path.dirname(f.rel),
    }));
  }
  return result;
}

async function rawSummary(adminDir) {
  const rawBase = intakePath(adminDir, 'raw');
  const types = ['docs', 'photos', 'unsorted'];
  const result = {};
  for (const t of types) {
    const files = await walkIntake(path.join(rawBase, t));
    result[t] = files.map(f => ({
      rel:       f.rel,
      name:      path.basename(f.abs),
      subfolder: path.dirname(f.rel),
    }));
  }
  return result;
}

// ─── Front matter builder ─────────────────────────────────────────────────────

const TYPE_SITE_MAP = {
  docs:      'documents',
  letters:   'letters',
  anecdotes: 'anecdotes',
};

function buildFrontMatter(fields) {
  return `---\n${yaml.dump(fields, { lineWidth: -1 }).trimEnd()}\n---\n`;
}

// ─── Route registration ───────────────────────────────────────────────────────

export default function registerAddRecordRoutes(app, adminDir) {

  app.get('/api/add-record/staging', async (req, res) => {
    try {
      res.json({ ok: true, staging: await stagingSummary(adminDir) });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/add-record/raw', async (req, res) => {
    try {
      res.json({ ok: true, raw: await rawSummary(adminDir) });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/add-record/file', async (req, res) => {
    const { area = 'staging', type, rel } = req.query;
    if (!type || !rel) return res.status(400).json({ ok: false, error: 'type and rel required' });
    const base = area === 'raw'
      ? intakePath(adminDir, 'raw', type)
      : intakePath(adminDir, 'staging', type);
    const abs = path.resolve(base, rel);
    if (!abs.startsWith(intakePath(adminDir))) {
      return res.status(403).json({ ok: false, error: 'Path escape rejected' });
    }
    try {
      const body  = await fsp.readFile(abs, 'utf8');
      let notes = '';
      try { notes = await fsp.readFile(path.join(path.dirname(abs), 'notes.txt'), 'utf8'); }
      catch { /* no notes */ }
      res.json({ ok: true, body, notes });
    } catch {
      res.status(404).json({ ok: false, error: 'File not found' });
    }
  });

  app.post('/api/add-record/triage', async (req, res) => {
    const { type, fromRel, slug } = req.body || {};
    if (!type || !fromRel || !slug) {
      return res.status(400).json({ ok: false, error: 'type, fromRel, slug required' });
    }
    const rawBase = intakePath(adminDir, 'raw', type);
    const src  = path.resolve(rawBase, fromRel);
    const dest = path.resolve(rawBase, slug, path.basename(fromRel));
    if (!src.startsWith(rawBase) || !dest.startsWith(rawBase)) {
      return res.status(403).json({ ok: false, error: 'Path escape rejected' });
    }
    try {
      await fsp.mkdir(path.dirname(dest), { recursive: true });
      await fsp.rename(src, dest);
      res.json({ ok: true, moved: { from: fromRel, to: path.relative(rawBase, dest) } });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/add-record/fuzzy', async (req, res) => {
    const { q } = req.query;
    try {
      const roster = await loadRoster(adminDir);
      const slugs  = roster.map(r => r.slug).filter(Boolean);
      res.json({ ok: true, matches: fuzzyMatch(q, slugs) });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/add-record/roster-slugs', async (req, res) => {
    try {
      const roster = await loadRoster(adminDir);
      res.json({ ok: true, slugs: roster.map(r => r.slug).filter(Boolean) });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/add-record/promote/document', async (req, res) => {
    const { stagingType, stagingRel, slug, frontMatter } = req.body || {};
    if (!stagingType || !stagingRel || !slug || !frontMatter) {
      return res.status(400).json({ ok: false, error: 'stagingType, stagingRel, slug, frontMatter required' });
    }
    const siteType = TYPE_SITE_MAP[stagingType];
    if (!siteType) return res.status(400).json({ ok: false, error: `Unknown staging type: ${stagingType}` });

    const stagingAbs = path.resolve(intakePath(adminDir, 'staging', stagingType), stagingRel);
    if (!stagingAbs.startsWith(intakePath(adminDir, 'staging', stagingType))) {
      return res.status(403).json({ ok: false, error: 'Path escape rejected' });
    }

    try {
      const body       = await fsp.readFile(stagingAbs, 'utf8');
      const authorSlug = frontMatter.author || 'unit';
      const permalink  = `/${siteType}/${authorSlug}/${slug}/`;
      const destDir    = sitePath(adminDir, siteType, authorSlug, slug);
      await fsp.mkdir(destDir, { recursive: true });
      const destFile = path.join(destDir, `${slug}.md`);
      await fsp.writeFile(destFile,
        buildFrontMatter({ layout: 'layouts/document.njk', permalink, ...frontMatter }) + '\n' + body.trim() + '\n', 'utf8');
      await fsp.unlink(stagingAbs);
      res.json({ ok: true, written: path.relative(repoRoot(adminDir), destFile) });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/add-record/promote/soldier', async (req, res) => {
    const { stagingRel, slug, frontMatter } = req.body || {};
    if (!stagingRel || !slug || !frontMatter) {
      return res.status(400).json({ ok: false, error: 'stagingRel, slug, frontMatter required' });
    }
    const stagingAbs = path.resolve(intakePath(adminDir, 'staging', 'soldiers'), stagingRel);
    if (!stagingAbs.startsWith(intakePath(adminDir, 'staging', 'soldiers'))) {
      return res.status(403).json({ ok: false, error: 'Path escape rejected' });
    }
    try {
      const destDir  = sitePath(adminDir, 'soldiers', slug);
      await fsp.mkdir(destDir, { recursive: true });
      const destFile = path.join(destDir, `${slug}.md`);
      await fsp.writeFile(destFile, buildSoldierStub(slug, frontMatter), 'utf8');
      await fsp.unlink(stagingAbs).catch(() => {});
      res.json({ ok: true, written: path.relative(repoRoot(adminDir), destFile) });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/add-record/promote/event', async (req, res) => {
    const { stagingRel, slug, frontMatter } = req.body || {};
    if (!stagingRel || !slug || !frontMatter) {
      return res.status(400).json({ ok: false, error: 'stagingRel, slug, frontMatter required' });
    }
    const stagingAbs = path.resolve(intakePath(adminDir, 'staging', 'events-todo'), stagingRel);
    if (!stagingAbs.startsWith(intakePath(adminDir, 'staging', 'events-todo'))) {
      return res.status(403).json({ ok: false, error: 'Path escape rejected' });
    }
    try {
      const destDir = sitePath(adminDir, 'events', slug);
      await fsp.mkdir(destDir, { recursive: true });
      const destFile = path.join(destDir, 'index.md');
      await fsp.writeFile(destFile, buildFrontMatter({ slug, status: 'draft', ...frontMatter }) + '\n', 'utf8');
      await fsp.unlink(stagingAbs).catch(() => {});
      res.json({ ok: true, written: path.relative(repoRoot(adminDir), destFile) });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/add-record/new/soldier', async (req, res) => {
    const { slug, frontMatter } = req.body || {};
    if (!slug || !frontMatter) {
      return res.status(400).json({ ok: false, error: 'slug and frontMatter required' });
    }
    try {
      const destDir  = sitePath(adminDir, 'soldiers', slug);
      await fsp.mkdir(destDir, { recursive: true });
      const destFile = path.join(destDir, `${slug}.md`);
      try {
        await fsp.access(destFile);
        return res.status(409).json({ ok: false, error: 'Soldier already exists' });
      } catch { /* safe to create */ }
      await fsp.writeFile(destFile, buildSoldierStub(slug, frontMatter), 'utf8');
      res.json({ ok: true, written: path.relative(repoRoot(adminDir), destFile) });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/add-record/new/event', async (req, res) => {
    const { slug, frontMatter } = req.body || {};
    if (!slug || !frontMatter) {
      return res.status(400).json({ ok: false, error: 'slug and frontMatter required' });
    }
    try {
      const destDir  = sitePath(adminDir, 'events', slug);
      await fsp.mkdir(destDir, { recursive: true });
      const destFile = path.join(destDir, 'index.md');
      try {
        await fsp.access(destFile);
        return res.status(409).json({ ok: false, error: 'Event already exists' });
      } catch { /* safe */ }
      await fsp.writeFile(destFile, buildFrontMatter({ slug, status: 'draft', ...frontMatter }) + '\n', 'utf8');
      res.json({ ok: true, written: path.relative(repoRoot(adminDir), destFile) });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });
}
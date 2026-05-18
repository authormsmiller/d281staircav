// admin/lib/todo.js
// Tab 5 — Todo / Flags
// All endpoints and scan implementations for the todo system.
//
// Register with: import registerTodoRoutes from './lib/todo.js'
//                registerTodoRoutes(app)  in server.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TODO_PATH  = path.join(__dirname, '../data/todo.json');
const SITE_PATH  = path.join(__dirname, '../../site');

// ─── Helpers ────────────────────────────────────────────────────────────────

async function readTodo() {
  const raw = await fs.readFile(TODO_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function writeTodo(data) {
  const tmp = TODO_PATH + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmp, TODO_PATH);
}

function generateId(scope, type) {
  // Format: SCOPE-TYPE-YYYYMMDDHHmmssSSS
  const now  = new Date();
  const pad  = (n, len = 2) => String(n).padStart(len, '0');
  const ts   = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
    pad(now.getMilliseconds(), 3)
  ].join('');
  return `${scope.toUpperCase()}-${type.toUpperCase()}-${ts}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Scan Implementations ────────────────────────────────────────────────────
// Each scan returns an array of result objects: { slug, path, detail }
// Results are ephemeral — never written to disk.

async function scanDraftRecords() {
  const results = [];
  const files = await glob('**/*.md', { cwd: SITE_PATH, absolute: true });
  for (const file of files) {
    try {
      const raw     = await fs.readFile(file, 'utf-8');
      const { data } = matter(raw);
      if (data.status === 'draft') {
        const rel = path.relative(SITE_PATH, file);
        results.push({
          slug:   data.slug || path.basename(path.dirname(file)),
          path:   rel,
          detail: `type: ${data.layout || 'unknown'}`
        });
      }
    } catch (_) { /* skip unreadable files */ }
  }
  return results;
}

async function scanOpenQuestions() {
  const results = [];
  const files = await glob('**/*.md', { cwd: SITE_PATH, absolute: true });
  for (const file of files) {
    try {
      const raw     = await fs.readFile(file, 'utf-8');
      const { data } = matter(raw);
      if (data.open_questions && Array.isArray(data.open_questions) && data.open_questions.length > 0) {
        const rel = path.relative(SITE_PATH, file);
        results.push({
          slug:   data.slug || path.basename(path.dirname(file)),
          path:   rel,
          detail: data.open_questions.map(q => `• ${q}`).join('\n')
        });
      }
    } catch (_) { /* skip */ }
  }
  return results;
}

async function scanMissingFirstName() {
  const results = [];
  const files = await glob('soldiers/**/index.md', { cwd: SITE_PATH, absolute: true });
  for (const file of files) {
    try {
      const raw     = await fs.readFile(file, 'utf-8');
      const { data } = matter(raw);
      if (data.status === 'researching' && !data.first_name) {
        const rel = path.relative(SITE_PATH, file);
        results.push({
          slug:   data.slug || path.basename(path.dirname(file)),
          path:   rel,
          detail: `last_name: ${data.last_name || '(none)'}`
        });
      }
    } catch (_) { /* skip */ }
  }
  return results;
}

async function scanBrokenSlugRefs() {
  const results  = [];
  const soldiers = new Set();

  // Build known soldier slugs
  const soldierDirs = await glob('soldiers/*/index.md', { cwd: SITE_PATH, absolute: true });
  for (const f of soldierDirs) {
    soldiers.add(path.basename(path.dirname(f)));
  }

  // Check contains + tagged on all records
  const allFiles = await glob('**/*.md', { cwd: SITE_PATH, absolute: true });
  for (const file of allFiles) {
    try {
      const raw     = await fs.readFile(file, 'utf-8');
      const { data } = matter(raw);
      const rel      = path.relative(SITE_PATH, file);

      const checkSlugs = (field, values) => {
        if (!Array.isArray(values)) return;
        for (const v of values) {
          const slug = typeof v === 'string' ? v : v?.slug;
          if (slug && !soldiers.has(slug)) {
            results.push({
              slug:   slug,
              path:   rel,
              detail: `referenced in ${field}: — no matching file in soldiers/`
            });
          }
        }
      };

      checkSlugs('contains', data.contains);
      checkSlugs('tagged',   data.tagged);

    } catch (_) { /* skip */ }
  }
  return results;
}

async function scanNameDuplicates() {
  const results = [];
  const seen    = {};  // normalized name → { slug, path }
  const files   = await glob('soldiers/*/index.md', { cwd: SITE_PATH, absolute: true });

  for (const file of files) {
    try {
      const raw     = await fs.readFile(file, 'utf-8');
      const { data } = matter(raw);
      if (!data.first_name && !data.last_name) continue;

      const normalized = `${(data.first_name || '').toLowerCase().trim()} ${(data.last_name || '').toLowerCase().trim()}`.trim();
      const rel        = path.relative(SITE_PATH, file);

      if (seen[normalized]) {
        results.push({
          slug:   data.slug || path.basename(path.dirname(file)),
          path:   rel,
          detail: `duplicate of ${seen[normalized].slug} (${seen[normalized].path})`
        });
      } else {
        seen[normalized] = { slug: data.slug || path.basename(path.dirname(file)), path: rel };
      }
    } catch (_) { /* skip */ }
  }
  return results;
}

async function scanFrontMatterHealth() {
  // Flag soldier slugs that are referenced inconsistently across records —
  // e.g. a soldier named "Miller Marvin" in one place and "Marvin Miller" in another.
  // Simple check: look for any slug in contains/tagged that does not match
  // the pattern [last]-[first] (all lowercase, hyphen-separated).
  const results = [];
  const BAD_SLUG = /[^a-z0-9-]/;
  const files    = await glob('**/*.md', { cwd: SITE_PATH, absolute: true });

  for (const file of files) {
    try {
      const raw     = await fs.readFile(file, 'utf-8');
      const { data } = matter(raw);
      const rel      = path.relative(SITE_PATH, file);

      const checkFormat = (field, values) => {
        if (!Array.isArray(values)) return;
        for (const v of values) {
          const slug = typeof v === 'string' ? v : v?.slug;
          if (slug && BAD_SLUG.test(slug)) {
            results.push({
              slug,
              path:   rel,
              detail: `${field}: contains malformed slug "${slug}"`
            });
          }
        }
      };

      checkFormat('contains',   data.contains);
      checkFormat('tagged',     data.tagged);
      checkFormat('casualties', data.casualties);

    } catch (_) { /* skip */ }
  }
  return results;
}

const SCAN_FNS = {
  draft_records:       scanDraftRecords,
  open_questions:      scanOpenQuestions,
  missing_first_name:  scanMissingFirstName,
  broken_slug_refs:    scanBrokenSlugRefs,
  name_duplicates:     scanNameDuplicates,
  front_matter_health: scanFrontMatterHealth
};

// ─── Route Registration ──────────────────────────────────────────────────────

export default function registerTodoRoutes(app) {

  // GET /api/todo/items — return all items
  app.get('/api/todo/items', async (req, res) => {
    try {
      const data = await readTodo();
      res.json(data.items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/todo/items — create a new hand-entered item
  app.post('/api/todo/items', async (req, res) => {
    try {
      const { type, scope, title, notes, parent_id, relates_to } = req.body;
      if (!type || !scope || !title) {
        return res.status(400).json({ error: 'type, scope, and title are required' });
      }

      const data   = await readTodo();
      const item   = {
        id:            generateId(scope, type),
        parent_id:     parent_id   || null,
        relates_to:    relates_to  || [],
        type,
        scope,
        status:        'open',
        title,
        notes:         notes || '',
        created:       today(),
        completed:     null,
        promoted_from: null
      };

      data.items.push(item);
      await writeTodo(data);
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH /api/todo/items/:id — update an item (complete, edit notes/title)
  app.patch('/api/todo/items/:id', async (req, res) => {
    try {
      const data = await readTodo();
      const idx  = data.items.findIndex(i => i.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Item not found' });

      const item    = data.items[idx];
      const allowed = ['status', 'title', 'notes', 'parent_id', 'relates_to', 'scope'];
      for (const key of allowed) {
        if (req.body[key] !== undefined) item[key] = req.body[key];
      }

      // Auto-set completed date when marking complete
      if (req.body.status === 'complete' && !item.completed) {
        item.completed = today();
      }
      // Auto-clear completed date if re-opened
      if (req.body.status === 'open') {
        item.completed = null;
      }

      data.items[idx] = item;
      await writeTodo(data);
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/todo/items/:id — hard delete (admin cleanup only, no UI action)
  app.delete('/api/todo/items/:id', async (req, res) => {
    try {
      const data    = await readTodo();
      const before  = data.items.length;
      data.items    = data.items.filter(i => i.id !== req.params.id);
      if (data.items.length === before) return res.status(404).json({ error: 'Item not found' });
      await writeTodo(data);
      res.json({ deleted: req.params.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/todo/scans — return scan log metadata
  app.get('/api/todo/scans', async (req, res) => {
    try {
      const data = await readTodo();
      res.json(data.scans);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/todo/scans/:scanKey/run — run a scan, return results, update metadata
  app.post('/api/todo/scans/:scanKey/run', async (req, res) => {
    const { scanKey } = req.params;
    const fn          = SCAN_FNS[scanKey];
    if (!fn) return res.status(404).json({ error: `Unknown scan: ${scanKey}` });

    try {
      const results = await fn();
      const data    = await readTodo();

      data.scans[scanKey] = {
        last_run:     today(),
        result_count: results.length
      };

      await writeTodo(data);
      res.json({ scanKey, results });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/todo/promote — convert a scan result to a task item
  app.post('/api/todo/promote', async (req, res) => {
    try {
      const { scanKey, slug, detail, type, scope, title, notes } = req.body;
      if (!scanKey || !type || !scope || !title) {
        return res.status(400).json({ error: 'scanKey, type, scope, and title are required' });
      }

      const data = await readTodo();
      const item = {
        id:            generateId(scope, type),
        parent_id:     null,
        relates_to:    [],
        type,
        scope,
        status:        'open',
        title,
        notes:         notes || detail || '',
        created:       today(),
        completed:     null,
        promoted_from: { scanKey, slug: slug || null, detail: detail || null }
      };

      data.items.push(item);
      await writeTodo(data);
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/todo/counts — open item counts by scope (for tab badge)
  app.get('/api/todo/counts', async (req, res) => {
    try {
      const data  = await readTodo();
      const open  = data.items.filter(i => i.status === 'open');
      const total = open.length;
      const bugs  = open.filter(i => i.type === 'bug').length;
      res.json({ total, bugs });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

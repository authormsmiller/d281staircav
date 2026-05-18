/**
 * server.js
 * Admin tool API server.
 * Run from the repo root: node admin/server.js
 * Serves the UI at http://localhost:3001
 * API at http://localhost:3001/api/*
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { resolvePath, listSlugs } from './lib/records.js';
import { readRecord, attachValue, detachValue, writeRecord, isArrayField, isReadonlyField } from './lib/frontmatter.js';
import { sessionStatus, ensureWorkingBranch, commitChanges, pushBranch } from './lib/session.js';
import { registerPhotosRoutes } from './lib/photos.js';
import registerTodoRoutes from './lib/todo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Serve the admin UI static files from admin/
app.use(express.static(__dirname));

// ─── session endpoints ────────────────────────────────────────────────────────

/**
 * GET /api/session
 * Returns current branch, pending changes, last commit.
 * Also ensures we're on a working branch (creates one if needed).
 */
app.get('/api/session', async (req, res) => {
  try {
    const branchResult = await ensureWorkingBranch();
    const status = await sessionStatus();
    res.json({ ...status, branchCreated: branchResult.created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/session/commit
 * Body: { message: string }
 * Stages and commits all pending changes.
 */
app.post('/api/session/commit', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Commit message is required.' });
    }
    const hash = await commitChanges(message.trim());
    res.json({ ok: true, hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/session/push
 * Pushes the current branch to origin.
 */
app.post('/api/session/push', async (req, res) => {
  try {
    const branch = await pushBranch();
    res.json({ ok: true, branch });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── record endpoints ─────────────────────────────────────────────────────────

/**
 * GET /api/slugs?type=document
 * Returns all known slugs for a content type.
 */
app.get('/api/slugs', async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) return res.status(400).json({ error: 'type is required' });
    const slugs = await listSlugs(type);
    res.json(slugs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/record?type=document&slug=dillon-stan-account-042071
 * Returns the front matter of a record.
 */
app.get('/api/record', async (req, res) => {
  try {
    const { type, slug } = req.query;
    if (!type || !slug) return res.status(400).json({ error: 'type and slug are required' });

    const filePath = await resolvePath(type, slug);
    if (!filePath) return res.status(404).json({ error: `No file found for ${type}:${slug}` });

    const { data } = await readRecord(filePath);
    res.json({ slug, type, filePath, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/attach
 * Body: { type, slug, field, value }
 * Appends or sets a value on a front matter field.
 *
 * This is the core Tab 1 action.
 */
app.post('/api/attach', async (req, res) => {
  try {
    const { type, slug, field, value } = req.body;

    if (!type || !slug || !field || value === undefined) {
      return res.status(400).json({ error: 'type, slug, field, and value are required' });
    }

    if (isReadonlyField(field)) {
      return res.status(400).json({ error: `"${field}" is read-only and cannot be edited here.` });
    }

    const filePath = await resolvePath(type, slug);
    if (!filePath) return res.status(404).json({ error: `No file found for ${type}:${slug}` });

    const { data, content } = await readRecord(filePath);
    const beforeSnapshot = JSON.parse(JSON.stringify(data)); // deep copy for diff

    const result = attachValue(data, field, value);

    if (!result.changed) {
      return res.json({ ok: true, changed: false, message: 'Value already present — no change made.' });
    }

    await writeRecord(filePath, data, content);

    res.json({
      ok: true,
      changed: true,
      field,
      previousValue: result.previousValue,
      newValue: result.newValue,
      filePath,
      isArrayField: isArrayField(field),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/detach
 * Body: { type, slug, field, value }
 * Removes a value from a front matter field.
 */
app.post('/api/detach', async (req, res) => {
  try {
    const { type, slug, field, value } = req.body;

    if (!type || !slug || !field || value === undefined) {
      return res.status(400).json({ error: 'type, slug, field, and value are required' });
    }

    const filePath = await resolvePath(type, slug);
    if (!filePath) return res.status(404).json({ error: `No file found for ${type}:${slug}` });

    const { data, content } = await readRecord(filePath);
    const result = detachValue(data, field, value);

    if (!result.changed) {
      return res.json({ ok: true, changed: false, message: 'Value not present — no change made.' });
    }

    await writeRecord(filePath, data, content);
    res.json({ ok: true, changed: true, field, previousValue: result.previousValue, newValue: result.newValue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/edit
 * Body: { type, slug, field, value }
 * Sets a field to an exact value — scalar or full array replacement.
 * Unlike /api/attach which appends, this overwrites unconditionally.
 */
app.post('/api/edit', async (req, res) => {
  try {
    const { type, slug, field, value } = req.body;

    if (!type || !slug || !field || value === undefined) {
      return res.status(400).json({ error: 'type, slug, field, and value are required' });
    }

    if (isReadonlyField(field)) {
      return res.status(400).json({ error: `"${field}" is read-only and cannot be edited here.` });
    }

    const filePath = await resolvePath(type, slug);
    if (!filePath) return res.status(404).json({ error: `No file found for ${type}:${slug}` });

    const { data, content } = await readRecord(filePath);
    const previousValue = data[field];
    data[field] = value;
    await writeRecord(filePath, data, content);

    res.json({ ok: true, field, previousValue, newValue: value, filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/remove-from-array
 * Body: { type, slug, field, index }
 * Removes an item from an array field by index position.
 * Used by Edit Record to remove a specific entry from contains/tagged/etc.
 */
app.post('/api/remove-from-array', async (req, res) => {
  try {
    const { type, slug, field, index } = req.body;

    if (!type || !slug || !field || index === undefined) {
      return res.status(400).json({ error: 'type, slug, field, and index are required' });
    }

    const filePath = await resolvePath(type, slug);
    if (!filePath) return res.status(404).json({ error: `No file found for ${type}:${slug}` });

    const { data, content } = await readRecord(filePath);
    const arr = Array.isArray(data[field]) ? data[field] : [];
    if (index < 0 || index >= arr.length) {
      return res.status(400).json({ error: `Index ${index} out of range for ${field}` });
    }

    const previousValue = arr[index];
    data[field] = arr.filter((_, i) => i !== index);
    await writeRecord(filePath, data, content);

    res.json({ ok: true, field, removedValue: previousValue, newValue: data[field], filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── tab 4: photo intake ──────────────────────────────────────────────────────

registerPhotosRoutes(app);

// ─── tab 5: todo / flags ──────────────────────────────────────────────────────

registerTodoRoutes(app);

// ─── start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  D Co. Admin Tool`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  UI:  http://localhost:${PORT}`);
  console.log(`  API: http://localhost:${PORT}/api`);
  console.log(`\n  Ctrl+C to stop\n`);
});

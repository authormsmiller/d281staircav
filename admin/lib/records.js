/**
 * records.js
 * Resolves a content type + slug to an absolute filesystem path.
 * All paths are relative to the repo root (one level above /site/).
 *
 * Content type patterns:
 *   soldier   → site/soldiers/[slug]/[slug].md
 *   document  → site/documents/[author-slug]/[doc-slug]/[doc-slug].md
 *   event     → site/events/[slug]/index.md
 *   anecdote  → site/anecdotes/[soldier-slug]/[anecdote-slug]/index.md
 *
 * For documents and anecdotes the slug encodes the author/soldier prefix
 * using the convention that the first segment (up to the second hyphen-word
 * boundary matching a known author folder) is the author slug.  Because
 * the actual folder layout is the source of truth we resolve by scanning
 * rather than by string-splitting, so we don't have to hard-code name
 * lengths.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Repo root is two levels up from admin/lib/
export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const SITE_ROOT = path.join(REPO_ROOT, 'site');

// ─── public API ──────────────────────────────────────────────────────────────

/**
 * Resolve a slug to a file path.
 * Returns the absolute path string, or null if not found.
 */
export async function resolvePath(type, slug) {
  switch (type) {
    case 'soldier':  return resolveSoldier(slug);
    case 'document': return resolveDocument(slug);
    case 'event':    return resolveEvent(slug);
    case 'anecdote': return resolveAnecdote(slug);
    default:
      throw new Error(`Unknown content type: "${type}"`);
  }
}

/**
 * List all known slugs for a given type.
 * Returns an array of { slug, path } objects.
 */
export async function listSlugs(type) {
  switch (type) {
    case 'soldier':  return listSoldiers();
    case 'document': return listDocuments();
    case 'event':    return listEvents();
    case 'anecdote': return listAnecdotes();
    default:
      throw new Error(`Unknown content type: "${type}"`);
  }
}

// ─── soldiers ────────────────────────────────────────────────────────────────

async function resolveSoldier(slug) {
  const p = path.join(SITE_ROOT, 'soldiers', slug, `${slug}.md`);
  return await exists(p) ? p : null;
}

async function listSoldiers() {
  const base = path.join(SITE_ROOT, 'soldiers');
  const dirs = await subdirs(base);
  const results = [];
  for (const dir of dirs) {
    const slug = path.basename(dir);
    const p = path.join(dir, `${slug}.md`);
    if (await exists(p)) results.push({ slug, path: p });
  }
  return results;
}

// ─── documents ───────────────────────────────────────────────────────────────
// Layout: site/documents/[author-slug]/[doc-slug]/[doc-slug].md
// We scan all author subdirectories then all doc subdirectories within each.

async function resolveDocument(docSlug) {
  const base = path.join(SITE_ROOT, 'documents');
  const authorDirs = await subdirs(base);
  for (const authorDir of authorDirs) {
    const p = path.join(authorDir, docSlug, `${docSlug}.md`);
    if (await exists(p)) return p;
  }
  return null;
}

async function listDocuments() {
  const base = path.join(SITE_ROOT, 'documents');
  const authorDirs = await subdirs(base);
  const results = [];
  for (const authorDir of authorDirs) {
    const docDirs = await subdirs(authorDir);
    for (const docDir of docDirs) {
      const slug = path.basename(docDir);
      const p = path.join(docDir, `${slug}.md`);
      if (await exists(p)) results.push({ slug, path: p });
    }
  }
  return results;
}

// ─── events ──────────────────────────────────────────────────────────────────
// Layout: site/events/[slug]/index.md

async function resolveEvent(slug) {
  const p = path.join(SITE_ROOT, 'events', slug, 'index.md');
  return await exists(p) ? p : null;
}

async function listEvents() {
  const base = path.join(SITE_ROOT, 'events');
  const dirs = await subdirs(base);
  const results = [];
  for (const dir of dirs) {
    const slug = path.basename(dir);
    const p = path.join(dir, 'index.md');
    if (await exists(p)) results.push({ slug, path: p });
  }
  return results;
}

// ─── anecdotes ───────────────────────────────────────────────────────────────
// Layout: site/anecdotes/[soldier-slug]/[anecdote-slug]/index.md

async function resolveAnecdote(anecdoteSlug) {
  const base = path.join(SITE_ROOT, 'anecdotes');
  const soldierDirs = await subdirs(base);
  for (const soldierDir of soldierDirs) {
    const p = path.join(soldierDir, anecdoteSlug, 'index.md');
    if (await exists(p)) return p;
  }
  return null;
}

async function listAnecdotes() {
  const base = path.join(SITE_ROOT, 'anecdotes');
  const soldierDirs = await subdirs(base);
  const results = [];
  for (const soldierDir of soldierDirs) {
    const anecdoteDirs = await subdirs(soldierDir);
    for (const anecdoteDir of anecdoteDirs) {
      const slug = path.basename(anecdoteDir);
      const p = path.join(anecdoteDir, 'index.md');
      if (await exists(p)) results.push({ slug, path: p });
    }
  }
  return results;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

async function exists(p) {
  try { await fs.access(p); return true; }
  catch { return false; }
}

/** Return immediate subdirectories of a path, ignoring _site and node_modules */
async function subdirs(base) {
  let entries;
  try {
    entries = await fs.readdir(base, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter(e => e.isDirectory()
      && !e.name.startsWith('_')
      && e.name !== 'node_modules')
    .map(e => path.join(base, e.name));
}

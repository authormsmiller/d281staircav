/**
 * frontmatter.js
 * Read, mutate, and write YAML front matter in .md files.
 * Uses gray-matter for parsing; writes back with js-yaml for clean output.
 *
 * Field type map — determines whether a field is a scalar or an array.
 * The tool needs this so it knows whether to SET a value or APPEND to a list.
 */

import { promises as fs } from 'fs';
import matter from 'gray-matter';
import yaml from 'js-yaml';

// ─── field type registry ─────────────────────────────────────────────────────

/**
 * Fields that are YAML arrays (appending is the default action).
 * Everything not listed here is treated as a scalar (set/overwrite).
 */
const ARRAY_FIELDS = new Set([
  'contains',
  'tagged',
  'casualties',
  'related_events',
  'accounts',
  'open_questions',
  'units',
  'platoons',
  'records',
  'images',
]);

/**
 * Fields that are read-only — the tool will not allow writing to these.
 * Layout, permalink, and slug are structural; they should be changed
 * only by hand or by the New Record scaffolder.
 */
const READONLY_FIELDS = new Set([
  'layout',
  'permalink',
  'slug',
  'archive_id',
]);

export function isArrayField(field) {
  return ARRAY_FIELDS.has(field);
}

export function isReadonlyField(field) {
  return READONLY_FIELDS.has(field);
}

// ─── public API ──────────────────────────────────────────────────────────────

/**
 * Read a file and return its parsed front matter as a plain object.
 * { data, content, raw }
 *   data    — the front matter as a JS object
 *   content — the markdown body (after the closing ---)
 *   raw     — the original file text (for reference / diffing)
 */
export async function readRecord(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const { data, content } = matter(raw);
  return { data, content, raw };
}

/**
 * Attach a value to a field in a record file.
 *
 * For array fields: appends the value if not already present.
 * For scalar fields: sets the value (overwrites).
 *
 * Returns { changed: bool, previousValue, newValue }
 * Throws if the field is read-only.
 *
 * Does NOT write to disk — call writeRecord() after reviewing.
 */
export function attachValue(data, field, value) {
  if (isReadonlyField(field)) {
    throw new Error(`Field "${field}" is read-only and cannot be edited via the admin tool.`);
  }

  const previousValue = data[field];

  if (isArrayField(field)) {
    const current = Array.isArray(data[field]) ? data[field] : (data[field] ? [data[field]] : []);
    if (current.includes(value)) {
      return { changed: false, previousValue, newValue: current };
    }
    const newValue = [...current, value];
    data[field] = newValue;
    return { changed: true, previousValue: current, newValue };
  } else {
    if (data[field] === value) {
      return { changed: false, previousValue, newValue: value };
    }
    data[field] = value;
    return { changed: true, previousValue, newValue: value };
  }
}

/**
 * Remove a value from a field.
 *
 * For array fields: removes the value if present.
 * For scalar fields: sets to empty string.
 */
export function detachValue(data, field, value) {
  if (isReadonlyField(field)) {
    throw new Error(`Field "${field}" is read-only.`);
  }

  const previousValue = data[field];

  if (isArrayField(field)) {
    const current = Array.isArray(data[field]) ? data[field] : [];
    const newValue = current.filter(v => v !== value);
    data[field] = newValue;
    return { changed: current.length !== newValue.length, previousValue: current, newValue };
  } else {
    data[field] = '';
    return { changed: previousValue !== '', previousValue, newValue: '' };
  }
}

/**
 * Write a (possibly mutated) record back to disk.
 * Reconstructs the file as: ---\n[yaml]\n---\n[body]
 *
 * Gray-matter stringify is intentionally NOT used here — it can reorder
 * keys and mangle multiline strings. We serialize the front matter with
 * js-yaml directly for clean, predictable output.
 */
export async function writeRecord(filePath, data, content) {
  const frontMatter = yaml.dump(data, {
    lineWidth: -1,         // don't wrap long values
    quotingType: '"',      // consistent quoting
    forceQuotes: false,    // only quote when necessary
    noRefs: true,          // no YAML anchors
  });

  const output = `---\n${frontMatter}---\n${content}`;
  await fs.writeFile(filePath, output, 'utf8');
}

/**
 * Return a human-readable summary of what changed between two data objects.
 * Used to generate commit messages.
 */
export function describeDiff(before, after) {
  const lines = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of allKeys) {
    const bv = JSON.stringify(before[key]);
    const av = JSON.stringify(after[key]);
    if (bv !== av) {
      lines.push(`  ${key}: ${bv} → ${av}`);
    }
  }
  return lines.join('\n');
}

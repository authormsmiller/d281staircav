// admin/lib/soldiers.js
// Standalone soldier stub creation — importable from any tab or workflow.
// Exports: buildSoldierStub(slug, fm) → markdown string
// Registers: POST /api/soldiers/create
//            GET  /api/soldiers/check?slugs=slug1,slug2,...

import fs from 'fs';
import path from 'path';

const SITE_SOLDIERS = path.resolve('..', 'site', 'soldiers');

// ---------------------------------------------------------------------------
// buildSoldierStub(slug, fm)
// Produces the full canonical soldier stub matching the established template.
// name is split on the last space: "Wolf Kutter" → first=Wolf, last=Kutter.
// Middle names/particles stay in first_name: "Marvin Dale" → first=Marvin Dale, last=Miller.
// ---------------------------------------------------------------------------
export function buildSoldierStub(slug, fm) {
  const fullName = fm.name || '';
  const parts    = fullName.trim().split(/\s+/);
  const lastName  = parts.length > 1 ? parts[parts.length - 1] : fullName;
  const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
  const rank      = fm.rank || '';
  const title     = rank ? `${rank} ${fullName}` : fullName;
  const status    = fm.status || 'researching';

  return [
    '---',
    'layout: layouts/soldier.njk',
    `title: ${title}`,
    `slug: ${slug}`,
    `breadcrumb: ${fullName}`,
    `permalink: /soldiers/${slug}/`,
    'tags:',
    '  - soldier',
    '',
    '# ── IDENTITY ──────────────────────────────────────',
    `first_name: ${firstName}`,
    `last_name: ${lastName}`,
    'nickname: ',
    'middle_name: ',
    `rank: ${rank}`,
    'mos: ',
    `platoon: ${fm.platoon || ''}`,
    '',
    '# ── SERVICE ───────────────────────────────────────',
    'arrived:',
    'departed:',
    `hometown: ${fm.hometown || ''}`,
    'character_of_service: Honorable',
    `status: ${status}`,
    '',
    '# ── PROFILE PHOTO ─────────────────────────────────',
    'profile_photo:',
    '',
    '# ── DECORATIONS ───────────────────────────────────',
    'decorations:',
    '',
    'distinguished_decorations:',
    '',
    '# ── FAMILY CONTACT ────────────────────────────────',
    'family_contact: false',
    '',
    '# ── TIMELINE SOURCE NOTE ──────────────────────────',
    'timeline_source: >',
    `  Service timeline not yet compiled. If you served with or knew ${fullName}, please use the contribute form to share what you remember.`,
    '',
    '# ── SERVICE TIMELINE ──────────────────────────────',
    'timeline:',
    '',
    '# ── PHOTOS ────────────────────────────────────────',
    'photo_intro: >',
    '  Photographs pending.',
    '',
    'wartime_content_notice: false',
    '',
    'photos:',
    '',
    '# ── DOCUMENTS ─────────────────────────────────────',
    'documents:',
    '',
    '# ── BROTHERS IN ARMS ──────────────────────────────',
    'brothers:',
    '',
    '---',
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// soldierExists(slug) → boolean
// ---------------------------------------------------------------------------
function soldierExists(slug) {
  return fs.existsSync(path.join(SITE_SOLDIERS, slug));
}

// ---------------------------------------------------------------------------
// registerSoldiersRoutes(app)
// Call from server.js after importing this module.
// ---------------------------------------------------------------------------
export function registerSoldiersRoutes(app) {

  // GET /api/soldiers/check?slugs=bacon-wg,neal-bill,...
  // Returns { missing: [...], present: [...] }
  app.get('/api/soldiers/check', (req, res) => {
    const raw = req.query.slugs || '';
    if (!raw.trim()) return res.json({ missing: [], present: [] });
    const slugs   = raw.split(',').map(s => s.trim()).filter(Boolean);
    const missing = slugs.filter(s => !soldierExists(s));
    const present = slugs.filter(s =>  soldierExists(s));
    res.json({ missing, present });
  });

  // POST /api/soldiers/create
  // Body: { slug, name?, rank?, status?, platoon?, mos?, hometown? }
  // Creates site/soldiers/[slug]/[slug].md and photo stub dirs.
  // Returns { ok: true, path } or { ok: false, error, alreadyExists? }
  app.post('/api/soldiers/create', (req, res) => {
    if (!req.body) req.body = {};
    const { slug, ...fm } = req.body;

    if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ ok: false, error: 'Invalid or missing slug.' });
    }

    if (soldierExists(slug)) {
      return res.status(409).json({ ok: false, alreadyExists: true,
        error: `Soldier "${slug}" already exists.` });
    }

    try {
      const soldierDir = path.join(SITE_SOLDIERS, slug);
      fs.mkdirSync(path.join(soldierDir, 'photos', 'profile'), { recursive: true });
      fs.mkdirSync(path.join(soldierDir, 'photos', 'field'),   { recursive: true });
      fs.writeFileSync(path.join(soldierDir, 'photos', 'profile', '.gitkeep'), '');
      fs.writeFileSync(path.join(soldierDir, 'photos', 'field',   '.gitkeep'), '');

      const filePath = path.join(soldierDir, `${slug}.md`);
      fs.writeFileSync(filePath, buildSoldierStub(slug, fm), 'utf8');

      res.json({ ok: true, path: filePath.replace(/\\/g, '/') });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });
}
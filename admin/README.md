# D Co. 2/8 CAV — Admin Tool

Local admin tool for editing archive front matter without touching code.
Runs in Codespaces alongside the Eleventy dev server.

## Setup

```bash
# From the repo root
cd admin
npm install
npm start
```

Open http://localhost:3001 in your Codespaces browser preview.

## Workflow

1. **Start the tool** — it auto-creates a working branch (`admin/YYYY-MM-DD`) if you're on main.
2. **Make changes** — use Tab 1 (Attach Record) to add `contains:`, `tagged:`, `author:`, `event:` etc. to any record.
3. **Preview locally** — changes write to disk immediately. Your Eleventy dev server picks them up on next build.
4. **Commit** — use the Commit button in the session bar. Review the change list, write a message, commit.
5. **Push** — once you're satisfied, push the branch with the Push button.
6. **Merge to main** — do this in GitHub (PR or direct merge). Cloudflare Pages detects the push and deploys.

## Architecture

```
admin/
  server.js          Express server (port 3001)
  index.html         The admin UI
  package.json
  lib/
    records.js       Slug → filepath resolver for all content types
    frontmatter.js   Read/mutate/write front matter (gray-matter + js-yaml)
    session.js       Git branch management (simple-git)
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/session | Current branch, pending changes, last commit |
| POST | /api/session/commit | Stage and commit pending changes |
| POST | /api/session/push | Push current branch to origin |
| GET | /api/slugs?type= | All known slugs for a content type |
| GET | /api/record?type=&slug= | Front matter for a specific record |
| POST | /api/attach | Append or set a value on a field |
| POST | /api/detach | Remove a value from a field |

## Content types

| Type | Path pattern |
|------|-------------|
| soldier | `site/soldiers/[slug]/[slug].md` |
| document | `site/documents/[author-slug]/[doc-slug]/[doc-slug].md` |
| event | `site/events/[slug]/index.md` |
| anecdote | `site/anecdotes/[soldier-slug]/[anecdote-slug]/index.md` |

## First test case

Add Bacon deposition via Tab 2 (Edit Record) once it's built.
Tab 1 first test: Dillon document → add `cardwell-james` to `contains`.

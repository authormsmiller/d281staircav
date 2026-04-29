# D Co. 2/8 CAV Archive — Deployment Guide

## What this does

Netlify watches your GitHub repo. Every time you push a change, it builds
the site automatically and updates the live URL. You never touch a command
line after the initial setup.

The admin panel at /admin lets you add new soldier profiles through a web
form — no code editing required.

---

## Step 1 — Add these files to your GitHub repo

Copy the entire contents of this folder into your repo, maintaining the
structure. The site/ folder should sit at the root of your repo:

```
D28FirstAirCav/
├── netlify.toml          ← copy here
└── site/
    ├── .eleventy.js
    ├── package.json
    ├── admin/
    │   ├── index.html
    │   └── config.yml
    ├── _data/
    │   └── site.json
    ├── _includes/
    │   ├── base.njk
    │   └── soldier.njk
    ├── soldiers/
    │   └── miller-marvin-dale/
    │       ├── miller-marvin-dale.md
    │       └── photos/
    │           ├── bill-small.jpg
    │           ├── 042471-hueycrash3.jpg
    │           └── [all other Marvin photos]
    ├── assets/
    │   ├── css/main.css
    │   └── js/main.js
    ├── index.njk
    ├── roster.njk
    └── contribute.njk
```

Commit and push all of this to your main branch.

---

## Step 2 — Connect to Netlify

1. Go to https://netlify.com and sign up (free) with your GitHub account
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub → select D28FirstAirCav
4. Netlify will read netlify.toml and auto-fill:
   - Base directory: site
   - Build command: npm run build
   - Publish directory: _site
5. Click "Deploy site"

Netlify installs Eleventy on its own servers and builds the site.
First build takes about 2 minutes. After that, rebuilds take ~30 seconds.

Your site will be live at a URL like: https://d28firstaircav.netlify.app
You can set a custom domain later for free.

---

## Step 3 — Enable Netlify Identity (for /admin login)

1. In your Netlify dashboard, go to Site Settings → Identity
2. Click "Enable Identity"
3. Under Registration, set to "Invite only" (you don't want random people
   creating profiles)
4. Under Services → Git Gateway, click "Enable Git Gateway"
5. Go to Identity tab → Invite users → invite your own email address
6. You'll get an email — click the link, set a password
7. Visit https://yoursite.netlify.app/admin — log in with that email/password

That's it. The admin panel is live.

---

## Step 4 — Add your first profile through the admin

1. Go to https://yoursite.netlify.app/admin
2. Log in
3. Click "Soldier Profiles" → "New Soldier Profile"
4. Fill out the form — every field has a hint explaining what goes there
5. Upload photos using the media uploader
6. Click "Publish"

Netlify commits the data file to your GitHub repo automatically and
triggers a rebuild. The new profile is live within ~60 seconds.

---

## Adding a soldier without the admin panel

If you prefer to add soldiers by editing files directly (faster for
someone comfortable with text files), copy the Miller data file:

  site/soldiers/miller-marvin-dale/miller-marvin-dale.md

Rename the folder and file to match the new soldier:

  site/soldiers/smith-john-henry/smith-john-henry.md

Edit the fields at the top of the file. Add photos to:

  site/soldiers/smith-john-henry/photos/

Commit and push. Netlify rebuilds automatically.

---

## How the profile photo works

In each soldier's data file, there is a field:

  profile_photo: bill-small.jpg

Set this to the filename of whichever photo should appear in the hero.
The file must exist in that soldier's photos/ folder.
If left blank, the hero shows the soldier's initials instead.

---

## Forms

The Contribute page forms (/contribute/) are handled by Netlify Forms.
Submissions appear in your Netlify dashboard under Forms.
You'll get an email notification for each submission.
No backend, no server, no database needed.

---

## Updating the site later

To change anything on the site:
- Content changes → use the /admin panel (no code)
- Style changes → edit site/assets/css/main.css and push to GitHub
- Template changes → edit the .njk files and push to GitHub

Netlify rebuilds automatically every time you push.

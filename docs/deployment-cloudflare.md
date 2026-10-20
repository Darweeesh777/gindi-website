# Staging preview on Cloudflare Pages (free)

This is the **preview deployment** in use: free, with no payment card, from
the private GitHub repository `gindi-website`, branch `main`. Every push to
`main` rebuilds and redeploys it automatically.

## How it works

Every page of the site is fixed content. The views make no database queries
and accept no form submissions (the enquiry form posts to an external
service once one is connected). So the preview is the Django site **exported
as static files**:

1. Cloudflare's build machine installs the Python packages.
2. `manage.py export_static` renders **every page through the normal Django
   views and templates** and saves the result:
   - all 26 English and Arabic pages;
   - the branded 404 pages;
   - `robots.txt`, redirects and headers;
   - the static files, with content-hashed names.
3. Cloudflare serves the `dist/` folder from its global network over HTTPS.

The Django code is unchanged. The same repository still runs as a normal
Django server (Gunicorn + WhiteNoise, `render.yaml`) when a server host is
chosen later. See [deployment-render.md](deployment-render.md).

## Cloudflare Workers settings (the dashboard's default "Create" flow)

Cloudflare's dashboard now creates a **Worker** when importing a Git
repository. That works too: `wrangler.jsonc` makes it an assets-only Worker
that serves `dist/` with the same `_headers`, `_redirects` and nearest
`404.html` rules. Requests to static assets are free and unlimited.

| Setting | Value |
|---|---|
| Project (Worker) name | `gindi-website` (must match `name` in `wrangler.jsonc`) |
| Build command | `bash cloudflare-build.sh` |
| Deploy command | `npx wrangler deploy` |
| Non-production branch deploy command | `npx wrangler versions upload` (default) |
| Root directory | `/` |

**Live preview:** https://gindi-website.ah-darwesh.workers.dev (Arabic: `/ar/`).
This is the default `SITE_URL` in `cloudflare-build.sh`. Change it there, or
set `SITE_URL` under Settings > Build > Variables and secrets, if the
address changes.

## Form backend (Worker + Resend + Turnstile)

`worker/index.js` runs **only for `/api/*`** (`run_worker_first` in
`wrangler.jsonc`); every page and file is still a free static asset. It
receives the quotation form, the Contact page form and the enquiry drawer
(`POST /api/contact`):

- the same site only (Origin check), JSON up to 32 KB;
- a hidden honeypot field, and a Cloudflare Turnstile check;
- the same field rules as the forms;
- an email to the studio with every detail: reply-to is the client, plus a
  "Chat on WhatsApp" link when the client prefers WhatsApp;
- a confirmation email to the client, when they gave an email address.

It only works on the **Workers** deployment above (Cloudflare Pages ignores
`worker/`). Until both build variables are set (`CONTACT_API_URL` and
`TURNSTILE_SITE_KEY`, see below), the forms work as before.

**Worker secrets** (Workers & Pages > gindi-website > Settings > Variables
and Secrets, type **Secret**; kept across deploys, never in the repository):

| Secret | Value |
|---|---|
| `RESEND_API_KEY` | Resend API key (`re_…`), "Sending access" |
| `TURNSTILE_SECRET_KEY` | The Turnstile widget's **secret** key |
| `CONTACT_TO_EMAIL` | Where requests go. With the test sender: the email of your Resend account |

**Worker variables** are in `wrangler.jsonc` (`vars`): `MAIL_FROM`,
`DEFAULT_COUNTRY_CODE` (`20`: a local `010…` number becomes `+20 10…` in the
WhatsApp link), `TIME_ZONE`.

**Testing without a domain.** `MAIL_FROM` is Resend's test sender
`onboarding@resend.dev`, which only delivers to your Resend account's own
address. So while it is set, the client's confirmation also goes to
`CONTACT_TO_EMAIL`, with the subject starting `[TEST — for client@…]`.

**With your own domain:** verify it in Resend (Domains), then set `MAIL_FROM`
in `wrangler.jsonc` to e.g. `Gindi Innovations <hello@your-domain>` and push.
Confirmations then go to the clients. Add the domain to the Turnstile
widget's hostnames too.

**Free plan limits:** Workers 100,000 requests a day (only `/api/*` counts);
Resend free 100 emails a day and 3,000 a month (each request uses 2 when the
client gives an email); Turnstile free.

**Logs:** Workers & Pages > gindi-website > Logs (failed sends are logged
there, never the keys).

**Tests:** `node --test worker/index.test.mjs` (Turnstile and Resend mocked).

## Cloudflare Pages settings (exact values)

| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `bash cloudflare-build.sh` |
| Build output directory | `dist` |
| Root directory | *(empty)* |
| Python | 3.13.3, from `.python-version` (preinstalled on Cloudflare's build image) |

`cloudflare-build.sh` runs:

```bash
pip install --quiet -r requirements.txt
DJANGO_SETTINGS_MODULE=config.settings.static_export python manage.py export_static --output dist
```

## Environment variables (Pages > Settings > Variables and Secrets)

None are required for the preview. Optional:

| Variable | Default | Effect |
|---|---|---|
| `SITE_URL` | `https://gindi-website.ah-darwesh.workers.dev` | Public address used in links between the English and Arabic pages. Set it if Cloudflare gives the project a different `*.pages.dev` name, or for a custom domain |
| `SITE_NOINDEX` | `true` | `false` only at the official launch |
| `ENQUIRY_FORM_ACTION` | *(empty)* | Enquiry form endpoint (a form service URL). Empty: the form says it is not connected |
| `WHATSAPP_NUMBER` | *(empty)* | Shows the WhatsApp button and enables "Submit via WhatsApp" in the quotation form (digits, international format) |
| `QUOTATION_EMAIL` | *(empty)* | Enables "Submit via Email" in the quotation form (opens the visitor's email app addressed to it) |
| `CONTACT_API_URL` | *(empty)* | `/api/contact`: all three forms send to the form backend ("Send Request"). Needs `TURNSTILE_SITE_KEY` too |
| `TURNSTILE_SITE_KEY` | *(empty)* | The Turnstile widget's **site** key (public). The secret key is a Worker secret, never here |
| `FREE_TOOL_WIRE_SCRIPT_URL`, `…_TILES_…`, `…_BRICKS_…`, `…_CEMENT_…` | *(empty)* | Loads that tool's agent. Empty: "Coming soon" |

The values are built into the pages, so **after changing a variable, open
Deployments and choose "Retry deployment"** on the latest one. The build
makes a random Django secret key each time; the exported files use none.
Never put real secrets in these variables or in the repository: the
exported pages are public.

## What the preview includes

- All pages, images, navigation, English/Arabic switching and responsive
  layouts, exactly as rendered by Django.
- **Branded 404 pages:** `/ar/…` gets the Arabic one. Cloudflare serves the
  nearest `404.html` with status 404.
- **Redirects** (`_redirects`):
  - `/free-estimate/` → `/free-tools/` (301), in both languages;
  - `/favicon.ico` → the brand icon.
- **Headers** (`_headers`), on every page and file:
  - `X-Robots-Tag: noindex, nofollow`;
  - `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`,
    `Cross-Origin-Opener-Policy`;
  - static files cached for a year, which is safe because their names
    change with their content.
- HTTPS: browsers always use HTTPS on `*.workers.dev` and `*.pages.dev`,
  because the whole `.dev` domain is on the browsers' built-in HTTPS-only
  (HSTS preload) list. A non-browser client that asks for plain `http://` on
  `workers.dev` gets the page without a redirect. With a custom domain,
  turn on Cloudflare's "Always Use HTTPS".
- "Illustrative image" labels on generated images, the not-available
  enquiry form and "Coming soon" tools, all unchanged. The Projects pages are
  exported while `apps/core/projects.py` has `PUBLISHED = True` (the default).

## What a static host does not include

- **`/admin/`:** there is no Django server running. Nothing uses the admin
  today; it returns when the site moves to a server host.
- **The branded 500 page:** a static host has no server errors to show.
  `templates/500.html` stays for the server deployment.
- **Server-side features added later:** for example, saving enquiries in a
  database. (Sending the forms by email is done by the Worker, above.) They
  need a server host such as Render, a VPS or PythonAnywhere. The repository is ready for that (`render.yaml`,
  `build.sh`, `gunicorn.conf.py`).

## Search engines and access

- Every response says `noindex, nofollow`, and so does every page's robots
  meta tag. `robots.txt` deliberately allows crawling, so crawlers can see
  that rule.
- **The preview URL is still public.** Anyone with the link can open it;
  noindex only keeps it out of search results. Cloudflare Access can add a
  login, as a separate, optional step.

## Free plan limits (Cloudflare, checked 2026-10-15)

- 500 builds a month, one at a time; each build may take up to 20 minutes
  (this one takes about a minute).
- Up to 20,000 files per site, each up to 25 MiB (this site: about 85 files,
  4.3 MB).
- No sleeping or cold starts. Pages are served from Cloudflare's network.

## Publishing updates

```powershell
git add -A
git commit -m "Describe the change"
git push
```

Cloudflare rebuilds `main` automatically. Pages > gindi-website >
**Deployments** shows progress. If a build fails, the previous version stays
live. Each push to another branch gets its own preview address.

## Check an export locally

```powershell
$env:DJANGO_SECRET_KEY = "any-local-value"
$env:DJANGO_SETTINGS_MODULE = "config.settings.static_export"
.venv\Scripts\python.exe manage.py export_static --output dist
```

`dist/` is git-ignored. Locally it also contains the source image masters,
because they sit in `static/images/`; the repository and Cloudflare do not
have them.

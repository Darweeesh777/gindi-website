# Gindi Innovations

Website for Gindi Innovations, a premium interior design studio serving
clients in Egypt and internationally.

**Current status: Phase 1 — static bilingual homepage.** English at `/`,
Arabic (RTL) at `/ar/`. Content is static and largely placeholder; there are
no models, forms or backend features. See
[docs/content-placeholders.md](docs/content-placeholders.md).

## Stack

- Python 3.13 · Django 5.2 LTS · Django Templates
- HTML5, CSS3, vanilla JavaScript (no frontend framework); GSAP 3.13 + ScrollTrigger
  for the Geometric G reveal in the Gindi Innovations (About) section only, vendored in
  `static/vendor/gsap/` (GreenSock standard no-charge licence)
- SQLite for local development · production database from `DATABASE_URL` (SQLite on the Render preview; PostgreSQL supported)
- Preview: Cloudflare Pages (free), the site exported as static files by `manage.py export_static`; see [docs/deployment-cloudflare.md](docs/deployment-cloudflare.md)
- Server deployment (ready, not in use): Gunicorn + WhiteNoise, Render Blueprint; see [docs/deployment-render.md](docs/deployment-render.md)

## Required tools

| Tool | Version verified at setup | Notes |
|---|---|---|
| Python | 3.13.15 | Installed via `winget install --id Python.Python.3.13`; use the `py` launcher |
| Git | 2.55.0 | Installed via `winget install --id Git.Git` |
| VS Code | — | Recommended extension: Microsoft Python (`ms-python.python`), not yet installed |

On this machine, `python` on its own points to a Microsoft Store shortcut.
Use `py` (outside the venv) or `.venv\Scripts\python.exe` instead.

## Setup (Windows, PowerShell)

Run these from the project root, `C:\Gindi-website`.

### 1. Create the virtual environment (first time only)

```powershell
py -3.13 -m venv .venv
```

### 2. Install dependencies

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 3. Configure environment variables

```powershell
Copy-Item .env.example .env
```

Then generate a secret key and put it in `.env` as `DJANGO_SECRET_KEY`:

```powershell
.venv\Scripts\python.exe -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

`.env` is git-ignored. Never commit it, and never put real secrets in `.env.example`.

### 4. Apply Django's built-in migrations (local SQLite)

```powershell
.venv\Scripts\python.exe manage.py migrate
```

### 5. Run the development server

```powershell
.venv\Scripts\python.exe manage.py runserver
```

Open http://127.0.0.1:8000/ (English) or http://127.0.0.1:8000/ar/ (Arabic).

### 6. Run the tests

```powershell
.venv\Scripts\python.exe manage.py test apps.core
```

### Optional: activating the virtual environment

Calling `.venv\Scripts\python.exe` directly always works. To use plain
`python` instead, activate the venv:

```powershell
.venv\Scripts\Activate.ps1
```

If PowerShell refuses with "running scripts is disabled on this system", your
execution policy is blocking it. Either keep using `.venv\Scripts\python.exe`,
or run `.venv\Scripts\activate.bat` from Command Prompt. This project's setup
did not change the execution policy.

Run `deactivate` to leave the venv.

## Useful commands

```powershell
.venv\Scripts\python.exe -m django --version    # installed Django version
.venv\Scripts\python.exe -m pip list            # installed packages
.venv\Scripts\python.exe manage.py check        # Django system checks
```

## Settings

| Module | Used by | Database |
|---|---|---|
| `config.settings.development` | `manage.py` (default) | SQLite, `db.sqlite3` (local only) |
| `config.settings.production` | `wsgi.py`, `asgi.py` (default); Render | From `DATABASE_URL` (or `POSTGRES_*` variables) |

`config/settings/base.py` holds shared settings and loads `.env` with
python-dotenv. To use another module, set `DJANGO_SETTINGS_MODULE` or pass
`--settings`.

Production settings require `DJANGO_SECRET_KEY` and `DATABASE_URL`. On Render,
the `*.onrender.com` host is allowed automatically; elsewhere, set
`DJANGO_ALLOWED_HOSTS`. See `.env.example` for the full list and
[docs/deployment-render.md](docs/deployment-render.md) for the Render preview.

`SITE_NOINDEX` (independent of `DEBUG`, on by default) sends a noindex
header and meta tag to keep search engines out; set it to `false` only at
launch.

## Directory structure

```
config/              Django project configuration
  settings/          base.py, development.py, production.py
apps/
  core/              Homepage: views.py, urls.py, content.py (EN/AR copy),
                     images.py, projects.py (all project data: carousel, /projects/, project pages),
                     vision.py (design/reality comparison data),
                     services.py (services: homepage + /services/),
                     tools.py (free tools: /free-tools/ and their agents),
                     about.py (About page text and images),
                     emblem.py (Geometric G as SVG geometry)
templates/
  base.html          Document shell: lang/dir, fonts, CSS/JS
  core/home.html     Homepage; sections in core/sections/
  partials/          Header, footer, language switch, media, section head,
                     emblem_reveal (Gindi Innovations image area)
static/
  css/               tokens, base, layout (header/footer), sections, motion, emblem-reveal
  js/main.js         Header state, hero parallax, mobile menu, reveals (vanilla JS)
  js/projects-carousel.js  Featured projects carousel (vanilla JS)
  js/projects-page.js      Projects pages: film previews, photo gallery (vanilla JS)
  js/services-page.js      Services page: accordion, enquiry drawer (vanilla JS)
  js/about-page.js         About page: reveals, chapter line (vanilla JS)
  js/compare-slider.js     "From Vision to Reality" comparison slider (vanilla JS)
  js/emblem-reveal.js  Geometric G reveal in Gindi Innovations (GSAP ScrollTrigger)
  vendor/gsap/       GSAP + ScrollTrigger 3.13.0
  images/site/       Web images (WebP), see docs/content-placeholders.md
  images/brand/      Web logo derivatives (generated; originals in logo/)
media/               User uploads (git-ignored)
logo/                Original brand assets (do not modify)
docs/
  brand-guidelines.md
  content-placeholders.md
manage.py
requirements.txt     Pinned packages (Django, Gunicorn, WhiteNoise, psycopg…)
cloudflare-build.sh  Cloudflare Pages build: static export to dist/ (the preview)
render.yaml          Render Blueprint (server deployment, not in use)
build.sh             Render build: install, collectstatic, migrate
gunicorn.conf.py     Gunicorn settings
.env.example         Environment variables (placeholders only)
```

Planned apps, to be created when their phase starts: `projects`,
`services`, `inquiries`, `studio`, `journal`.

## Brand assets

The original files are in `logo/` and must stay unmodified:

- `Gindi-Innovations-Brand-Guide.svg`: the brand guide (colours, roles, logo structure)
- `Gindi Innovations — Navy & Gold Logo.png`: the full logo (584×633, opaque, on white)
- `Gindi-Logo-Elements.png`: logo elements reference sheet (1600×1050, opaque)

[docs/brand-guidelines.md](docs/brand-guidelines.md) covers what the guide
specifies, what it leaves out, the known asset limitations, and how the web
derivatives in `static/images/brand/` were produced.

## Verified at setup (2026-10-14)

- `manage.py check`: no issues
- `manage.py migrate`: Django's built-in apps (admin, auth, contenttypes, sessions) applied to local SQLite
- Development server: `/` and `/admin/login/` return HTTP 200
- `check --deploy` on the production security settings: 1 warning,
  `security.W004` (HSTS not enabled). This was run with the database swapped
  for Django's dummy backend, because `psycopg` is not installed.

## Known limitations and next steps

- HSTS is off (`DJANGO_SECURE_HSTS_SECONDS=0`). Enable it only after HTTPS works on the real domain.
- `SECURE_PROXY_SSL_HEADER` trusts `X-Forwarded-Proto` (correct on Render). Review it for any other host.
- No email or file storage is configured. Hosting: free Render preview only.
- Arabic/English is a URL-based switch (`/`, `/ar/`) with copy in `apps/core/content.py`.
  Django's gettext i18n (LANGUAGES, LocaleMiddleware, `.po` files) is not configured.
- Fonts load from Google Fonts (Cormorant Garamond, Manrope, Noto Naskh Arabic,
  IBM Plex Sans Arabic). Self-host them before launch if third-party requests are a concern.
- Vector logo files are needed from the designer for crisp large-size rendering.

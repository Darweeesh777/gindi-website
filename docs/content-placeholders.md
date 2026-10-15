# Homepage placeholders

Everything below is temporary and must be replaced with content confirmed by
the studio before launch. Placeholder copy is marked on the page with a dashed
"Placeholder" badge in every environment, including the Render preview. This
does not depend on `DEBUG`; turn it off with `SHOW_PLACEHOLDER_BADGES=false`
only when the copy is final. Image slots are always labelled.

All copy lives in `apps/core/content.py` (English and Arabic side by side).
Search that file for `PLACEHOLDER`.

| Section | Placeholder | How to replace |
|---|---|---|
| Hero | Headline and supporting line | Edit `hero.title` / `hero.lead` |
| Hero | Background photograph (desktop + vertical mobile) | **Illustrative AI image** — see "Images" below |
| Projects | Four projects ("Project 01"–"Project 04", "Scope of work to be added."), shown on the homepage, /projects/ and /projects/<slug>/ | Edit `PROJECTS` in `apps/core/projects.py` — see "Projects" below |
| Projects | Four images | **Illustrative AI images** — see "Images" below |
| Services | Four services: drafts of summaries and deliverables | Edit `SERVICES` in `apps/core/services.py` — see "Services page" below |
| Process | Five stages (**illustrative only**) | Edit `process.steps` |
| About | Homepage "Gindi Innovations" text (two paragraphs) and "More About Us" | Edit `about.paragraphs` / `about.more` in `content.py` |
| About (Gindi Innovations) | Studio image (materials still life), revealed through the emblem | **Illustrative AI image** (`gindi-about-studio-materials.png`); a real studio or founder photo is preferred — see "Gindi Innovations reveal" below |
| Contact / footer | Email, phone, address, social links | Edit `contact.details` / `contact.social`. Values render as plain text; turn them into `mailto:`/`tel:` links once real |
| Meta | Page title and description | Edit `meta` |

When a block is confirmed, also remove its `ph-badge` line in the template.

## Images

All current images are **AI-generated illustrations**, not studio work.
Every one is labelled on the page ("Illustrative image" / "صورة توضيحية"; the
hero says so in its bottom bar) and its alt text starts with the same words.

- **Masters:** the PNGs in `static/images/` (untouched).
- **Web files:** `static/images/site/<name>-<width>.webp`, two widths each,
  about 1.5 MB in total.
- **Registry:** `apps/core/images.py` (file names, sizes, widths and the
  `illustrative` flag). Alt text is in `content.py`, per language.

To replace one with real photography:

1. Export WebP files at the widths listed for that entry in `images.py`, named
   `<name>-<width>.webp`, into `static/images/site/`.
2. Update `size` if the dimensions changed, and set `illustrative` to `False`.
3. Update the `alt` text (EN and AR) in `content.py`, removing "Illustrative image".

The PNG masters are served from `static/` too; consider moving them out of
`static/` (e.g. to an `assets/` folder) before deployment so they are not
published.

## Image specifications

| Slot | Shape | Notes |
|---|---|---|
| Hero | Landscape, at least 2560 px wide | Text sits bottom-left (bottom-right in Arabic); a navy shade is applied |
| Projects (main image) | Landscape, ideally 16:9 and at least 1672 px wide | Cropped to 16:9 (4:3 on phones); set `focus` to keep the subject in frame |
| Projects (thumbnail) | Same image, or a separate crop | Optional; shown at about 13rem wide |
| About | 3:4 portrait | Cropped to an arch; shown through the emblem reveal |

## Projects (homepage carousel, Projects page, project pages)

All projects live in **`apps/core/projects.py`**, in the `PROJECTS` list, in
display order. The homepage carousel, the Projects page (`/projects/`) and
each project's page (`/projects/<slug>/`) all read from it; nothing is
duplicated. Page labels are in `content.py` (`projects` for the carousel,
`projects_page` for the new pages), per language.

| Field | What to put |
|---|---|
| `slug` | Unique, stable id used in URLs: `/projects/#<slug>` and `/projects/<slug>/`. Keep it once published |
| `name` | The project name (one string, or `{'en': ..., 'ar': ...}`) |
| `work` | The scope of work, one line |
| `description` | Longer text for the project's own page |
| `media` | Photos and films in display order (see below) |
| `thumbnail` | Optional images.py key for the homepage thumbnail |
| `focus` | Optional crop focal point for the homepage image, e.g. `'50% 60%'` |

`media` items:

- Photo: `{'image': '<images.py key>', 'alt': '...'}`
- Film: `{'video': 'videos/<file>.mp4', 'poster': '<images.py key>', 'title': '...'}`
  (put the MP4 in `static/videos/`; it plays only when pressed, with controls)
- Placeholder: `{'image': None}` shows "Photo to be added"

The first three items form the project's group on the Projects page (the
first is the large image); any further items appear as "+N Photos" there
and in full on the project's page, where photos open in a full-screen
gallery. The first photo is also the homepage carousel image.

To add a photo: export two WebP widths into `static/images/site/` named
`<name>-<width>.webp`, register them in `IMAGES` in `apps/core/images.py`
(name, size, widths, `illustrative`), then use the key in `media`.

The four current projects are placeholders ("Project 01"–"04", "Scope of
work to be added.") with one illustrative photo each and labelled
placeholders for their detail photos. `python manage.py test` checks the
list (unique slugs, known images, alt text, film files present).

## Services page, enquiry drawer and free tools

**Services** (homepage Services section, `/services/` and the enquiry form's
options) are edited in one place: **`apps/core/services.py`**, `SERVICES`:
2D Design, 3D Design, Interior Finishing, Fit-Out.

| Field | What to put |
|---|---|
| `slug` | Stable anchor: `/services/#<slug>` opens that service. Keep it once published |
| `name` | Service name (one string, or `{'en': ..., 'ar': ...}`) |
| `summary` | One-sentence description |
| `deliverables` | Short list of key deliverables |
| `projects` | Optional project slugs; adds "View Related Projects" |

The names are confirmed; the summaries and deliverables are **drafts to
confirm**. Page copy is in `content.py` under `services_page`.

**Enquiry drawer.** Each "Enquire About This Service" opens it with that
service selected. The site has no enquiry backend, so the form cannot be
sent yet and says so. To connect it, set `ENQUIRY_FORM_ACTION` (environment /
`.env`) to the URL that should receive the POST (fields `name`, `email`,
`phone`, `service`, `message`). Labels: `content.py` → `enquiry`. Markup:
`templates/partials/enquiry_drawer.html`.

**WhatsApp.** "Chat with Us on WhatsApp" appears under "Send enquiry" once
`WHATSAPP_NUMBER` is set (environment / `.env`, international format, e.g.
`20` followed by the number, no `+` or spaces needed). It opens WhatsApp with
"Hello, I’d like to enquire about <service>." (texts in `content.py` →
`enquiry`). **No number is configured yet**, so the button is hidden.

**Free tools** are listed in **`apps/core/tools.py`** (`TOOLS`): wire,
tiles, bricks, cement. Pages: `/free-tools/` (overview) and
`/free-tools/<slug>/`; `/free-estimate/` redirects to the overview. Each
tool has its own independent agent:

1. Set its script URL: `FREE_TOOL_WIRE_SCRIPT_URL`,
   `FREE_TOOL_TILES_SCRIPT_URL`, `FREE_TOOL_BRICKS_SCRIPT_URL` or
   `FREE_TOOL_CEMENT_SCRIPT_URL` (environment / `.env`). That tool's page
   then loads it; the others are unaffected.
2. The agent renders into `#tool-<slug>` (`[data-tool-root="<slug>"]`) and
   removes or replaces `[data-tool-placeholder]`, the "Coming soon" state.

Until then each page shows "Coming soon" and calculates nothing. Template:
`templates/core/free_tool.html`; copy: `content.py` → `tools_page`.

## About page

`/about/` (and `/ar/about/`): all text and image references are in
**`apps/core/about.py`** (`ABOUT`), English and Arabic side by side; the copy
is the studio's draft and freely editable there.

Images (WebP in `static/images/site/`, registered in `images.py`), made from
the files supplied in `static/images/`:

| Slot | images.py key | Source file |
|---|---|---|
| Opening hero | `about-hero` | `image-1` (linework turning into the finished interior) |
| Chapter 01 — Who We Are | `about-who` | `image-2` (drawings and material samples) |
| Chapter 02 — What We Do | `about-what` | `image-3` (stone, slatted timber, lighting) |
| Chapter 03 — How We Work | `about-how` | `image-4` (portrait, hand on an oak door) |
| Detail photos | `about-detail-1`, `about-detail-2` | `image-5`, `image-6` |

To replace one: export new WebPs with the same names and widths (see
`images.py`), or register a new entry and change the key in `about.py`.
`hero about` is an identical copy of `image-3` and is not used.

Chapter 02's service items come from `services.py` and link to their
accordion items. "Discuss Your Project" opens the shared enquiry drawer;
"Chat on WhatsApp" appears once `WHATSAPP_NUMBER` is set. Motion:
`static/js/about-page.js` (reveals, chapter line), `static/css/about-page.css`.

## From Vision to Reality

The design/reality comparison below Projects is edited in one place:
**`apps/core/vision.py`**, the `VISION` dictionary.

| Field | What to put |
|---|---|
| `project_name` | The project's name, shown at the top right (one string, or `{'en': ..., 'ar': ...}`) |
| `design.image` | The design visual's key in `apps/core/images.py` |
| `design.alt` | A description of the design visual |
| `reality.image` | The photograph's key in `apps/core/images.py` |
| `reality.alt` | A description of the photograph |
| `focus` | Optional crop focal point for both, e.g. `'50% 50%'` |

Currently: **KK Barbershop — Sheikh Zayed**, with `Render.png` (the design)
and `real.JPG` (the photograph) from `static/images/`, exported to
`static/images/site/kk-barbershop-{design,reality}-{960,1536}.webp` at
identical sizes and registered in `images.py` as `kk-design` / `kk-reality`.
If an image is set to `None`, its side shows a labelled placeholder drawing
("Placeholder: … to be added") instead.

To add the images: export the design and the photograph **from the same
viewpoint and at the same size** (16:9 landscape works best, at least 1672 px
wide), as two WebP widths each in `static/images/site/`; register both in
`images.py` (see "Images" above); then set their keys in `vision.py`.
`python manage.py test` warns if the two images have different proportions,
which would stop them lining up. The labels ("The Design", "Drag to
reveal" …) are in `content.py` under `vision`.

## Gindi Innovations reveal

The About section's image area (heading "Gindi Innovations") reveals its
photograph through the Gindi Geometric G as the page scrolls. The hero is not
animated by it.

- **Emblem geometry:** `apps/core/emblem.py`. No vector emblem exists (the
  brand guide SVG embeds it as a raster image), so the paths trace
  `static/images/brand/gindi-monogram.png`; rasterised, they cover the same
  gold pixels as the PNG (99.7% overlap, the rest is its 1 px edge halo).
  The AI-generated `gindi-monogram-transparent.png` is not used.
- **Markup:** `templates/partials/emblem_reveal.html`: a visible outline
  (`fill="none"`, thin bronze stroke drawn with dash offsets) and a separate
  mask (the filled emblem plus an arch window) that only controls where the
  photograph shows.
- **Motion:** `static/js/emblem-reveal.js`, one scrubbed ScrollTrigger on the
  image area; the page scrolls normally and scrolling up reverses it. A faint
  outline shows first; the stroke draws over it, the photograph rises into the
  emblem's body, then the openings fill as the arch window opens to the whole
  frame. The photograph never moves or scales.
- **Reduced motion / no JS:** the completed image is shown, with no animation.
- **Swapping the photo:** replace the `about` entry's files (see "Images"
  above); any 3:4 image works, landscape images are cover-cropped.

## Language notes

- English is served at `/`, Arabic at `/ar/`. This is a simple URL-based
  switch with copy from `content.py`; it is **not** Django's gettext
  internationalisation (`LocaleMiddleware`, `.po` files), which is not
  configured.
- Numbers are written with Western digits (01, 2026) in both languages.
- The Arabic copy is a professional draft and should be reviewed by a native
  copywriter alongside the final English copy.

# Content still to confirm

Visitors see no editorial labels ("Placeholder", "to be added", "temporary").
Unfinished content is handled in one of three ways instead:

- **Hidden until real:** blocks that would only show dummy content are not
  rendered at all, and come back on their own once real content is added.
- **Disclosed:** AI-generated images keep a short "Illustrative image" label
  (and alt text starting with it), so they are never mistaken for studio work.
- **Honest availability:** unfinished features say so ("Coming soon", "Online
  enquiries are not available yet") and offer nothing that looks usable.

All copy lives in `apps/core/content.py` (English and Arabic side by side);
`PLACEHOLDER` comments there mark what still needs confirming.

| Section | Status | How to complete |
|---|---|---|
| Hero | Headline and supporting line: draft brand copy, shown | Confirm or edit `hero.title` / `hero.lead` |
| Hero | Background photograph: **illustrative AI image**, labelled | Replace with real photography — see "Images" below |
| Projects | **Project 01 is real: KK Barbershop - Sheikh Zayed** (six photos and a concept visualization). Projects 02–04 are still placeholders, shown at the studio's request ("Scope of work to be added.", illustrative AI images, "Photo to be added" on detail pages) | Replace the entries in `PROJECTS` in `apps/core/projects.py` with real projects. `PUBLISHED = False` there hides the section, the menu links and the `/projects/…` pages |
| Services | Four confirmed services; summaries and deliverables are **drafts to confirm**, shown without labels | Edit `SERVICES` in `apps/core/services.py` |
| About (Gindi Innovations) | Studio image: **illustrative AI image**, labelled | A real studio or founder photo is preferred — see "Gindi Innovations reveal" below |
| Contact / footer | **No details shown**: none confirmed yet; the Contact section keeps only its heading and invitation | Add real entries to `contact.details` (e.g. `{'label': 'Email', 'value': '…'}`) and `contact.social`; the details block appears in the section and the footer automatically |
| Meta | Page title and description | Edit `meta` |

Confirmed: the homepage Process section, "From Our First Call to After
Handover", with six steps, the studio's actual workflow (`process` in
`content.py`, English and Arabic).

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
| `tiles` | Optional: which `media` items (by index) form the Projects page group, in order. Default: the first three |
| `concept` | Optional `{'image', 'alt', 'caption'}`: a concept visualization, on its own tab of the interactive page |
| `thumbnail` | Optional images.py key for the homepage thumbnail |
| `focus` | Optional crop focal point for the homepage image, e.g. `'50% 60%'` |

`media` items:

- Photo: `{'image': '<images.py key>', 'alt': '...'}`
- Film: `{'video': 'videos/<file>.mp4', 'poster': '<images.py key>', 'title': '...'}`
  (put the MP4 in `static/videos/`; it plays only when pressed, with controls)
- Placeholder: `{'image': None}` shows "Photo to be added"

When **every** item is a photo with a `caption` (a short title, e.g.
`{'en': 'Overview', 'ar': 'نظرة عامة'}`), the project's page becomes the
interactive gallery: one large photo with its caption and counter, a full
screen button, thumbnails of every photo, and tabs for Completed / Concept
Visualization (when `concept` is set). The first photo can carry
`'hotspots'`: numbered markers, each `{'target': <index of the photo it
opens>, 'x': <% of the photo's width>, 'y': <% of its height>}`; their labels
are the target photos' captions.

The first three items form the project's group on the Projects page (the
first is the large image); any further items appear as "+N Photos" there
and in full on the project's page, where photos open in a full-screen
gallery. The first photo is also the homepage carousel image.

To add a photo: export two WebP widths into `static/images/site/` named
`<name>-<width>.webp`, register them in `IMAGES` in `apps/core/images.py`
(name, size, widths, `illustrative`), then use the key in `media`.

**Project 01 is KK Barbershop - Sheikh Zayed** (slug `project-1`, kept so
existing links work). Its photos are `static/images/KK/IMG_8891.JPG` …
`IMG_8896.JPG` (2048 × 1365), exported as `kk-img-8891-{480,960,1536,2048}.webp`
… `kk-img-8896-…`, and the concept visualization `static/images/KK/Render 2.png`
(1536 × 1024) as `kk-render-2-{480,960,1536}.webp`; the originals are kept as
they are. The Projects page shows 8891 (large), 8894 and 8896. The overview's
three markers open the coffee counter (8894), the styling area (8893) and the
waiting & display area (8895). The concept image is an illustration of the
space, not the original design; its caption says its details differ from
the completed interior.

Projects 02–04 are still placeholders ("Project 02"–"04", "Scope of work to
be added.") with one illustrative photo each and labelled placeholders for
their detail photos. They are shown (`PUBLISHED = True`) at the studio's
request until real projects replace them; `PUBLISHED = False` hides every
Projects entry point.
`python manage.py test` checks the list (unique slugs, known images, alt
text, film files present, `tiles` indexes, hotspot targets and positions,
the concept image).

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

**Quotation form** ("Get Quotation" on the homepage hero, the Services page and
the Projects pages): `templates/partials/quote_drawer.html`,
`static/js/quote-form.js`, copy in `content.py` → `quote` (both languages). The
site has no server-side email, so the visitor sends the request from their own
app: "Submit via Email" opens their email app addressed to `QUOTATION_EMAIL`,
"Submit via WhatsApp" opens WhatsApp to `WHATSAPP_NUMBER`, each with the whole
request filled in. **Neither is configured yet**, so both buttons are disabled
and say so.

**Free calculators** are listed in **`apps/core/tools.py`** (`TOOLS`):
wire, tiles, bricks, paint. Pages: `/free-tools/` (overview) and
`/free-tools/<slug>/`; `/free-estimate/` redirects to the overview and the
earlier `/free-tools/cement/` page to it as well. They run entirely in the
browser:

- `static/js/tools/<slug>-calc.js` — the arithmetic, data and constants,
  taken unchanged from the originals kept in `static/Tools/*.txt` (reference
  copies; never edited).
- `static/js/tools/<slug>.js` — the page and its English / Arabic wording, on
  the shared frame `static/js/tools/calc-ui.js`; styles `css/calculator.css`.
- `tools/calc-tests/` — regression checks: every scenario is run on the
  original and on the new page (English and Arabic) and every figure compared
  (`python tools/calc-tests/run.py check`; see that folder's README).

Template: `templates/core/free_tool.html`; copy: `content.py` → `tools_page`.

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

The design/reality comparisons below Projects are edited in one place:
**`apps/core/vision.py`**, the `VISIONS` list (one entry per project, in
display order). One project is shown at a time; the keystone handle compares
its design with the finished space, and the arrows and dots below change the
project.

| Field | What to put |
|---|---|
| `id` | A stable, unique id: lowercase letters, digits and hyphens (`kk-barbershop`) |
| `project_name` | The project's name, shown at the top right (one string, or `{'en': ..., 'ar': ...}`) |
| `design.image` | The design visual's key in `apps/core/images.py` |
| `design.alt` | A description of the design visual (say if it is the original render) |
| `reality.image` | The photograph's key in `apps/core/images.py` |
| `reality.alt` | A description of the photograph |
| `focus` | Optional crop focal point for both, e.g. `'50% 50%'` |

Currently one entry: **KK Barbershop — Sheikh Zayed**, with `Render.png`
(the design) and `real.JPG` (the photograph) from `static/images/`, exported
to `static/images/site/kk-barbershop-{design,reality}-{960,1536}.webp` at
identical sizes and registered in `images.py` as `kk-design` / `kk-reality`.

Only complete entries (both images registered) are shown. The counter
("01 / 02"), the dots, the arrows and "Choose project" follow the number of
complete entries and appear only from two; with one, the section shows just
that comparison. If an image fails to load in the browser, neither image of
that pair is shown (a short notice instead), so a design is never paired
with the wrong photograph.

To add a project: export its design render and the photograph of the
finished space **from the same viewpoint and at the same size** (3:2 or 16:9
landscape, at least 1536 px wide), as two WebP widths each in
`static/images/site/`; register both in `images.py` (see "Images" above); then
add an entry to `VISIONS`. `python manage.py test` reports a duplicate id, a
missing image or alt text, the same image used twice, or two images with
different proportions (which would stop them lining up). Never pair unrelated
images or reuse one project's images for another. The labels ("The Design",
"Drag to compare", "Choose project" …) are in `content.py` under `vision`.

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

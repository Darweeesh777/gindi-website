"""
Projects — the one place to add or edit them. Used by the homepage carousel,
the Projects page (/projects/) and each project's page (/projects/<slug>/).

Each project:

    'slug'        unique, stable id used in URLs and anchors, e.g. 'villa-maadi'
                  (lowercase letters, digits and hyphens; don't change it once
                  published, links point to it)
    'name'        project name
    'work'        the scope of work, one line (under the name everywhere)
    'description' longer text for the project's own page (optional)
    'media'       photos and films, in display order. The first three form the
                  editorial group on the Projects page (the first is the large
                  one, and the first photo is also the homepage image):
                    {'image': '<images.py key>', 'alt': '...'}        a photo
                    {'video': 'videos/<file>.mp4', 'poster': '<images.py key>',
                     'title': '...'}                                   a film
                    {'image': None}                  a labelled "photo to be
                                                     added" placeholder
    'thumbnail'   optional images.py key for the homepage thumbnail
    'focus'       optional crop focal point (CSS object-position) for the
                  homepage image

Photos: WebP files in static/images/site/, registered in images.py.
Films: MP4 (H.264) files in static/videos/, with a poster photo.

Text fields take one string (both languages) or {'en': ..., 'ar': ...}; a
missing 'ar' falls back to English.

The entries below are TEMPORARY: their photos are illustrative, AI-generated
interiors (labelled as such on the page), not studio projects, and the
detail photos are placeholders.

PUBLISHED switches the homepage Projects section, the "Projects" menu links
and the /projects/ pages on or off (off: the pages return 404 and are not
exported). It is on at the studio's request, with these placeholder entries,
until real projects replace them.
"""
import re

from django.contrib.staticfiles import finders
from django.templatetags.static import static
from django.urls import reverse

from .images import IMAGES, resolve

# Shown on the site (see above). False hides every Projects entry point.
PUBLISHED = True

PLACEHOLDER_SCOPE = {'en': 'Scope of work to be added.', 'ar': 'سيُضاف نطاق العمل لاحقًا.'}
PLACEHOLDER_DESCRIPTION = {
    'en': 'Project description to be added.',
    'ar': 'سيُضاف وصف المشروع لاحقًا.',
}

PROJECTS = [
    {
        'slug': 'project-1',
        'name': {'en': 'Project 01', 'ar': 'المشروع 01'},
        'work': PLACEHOLDER_SCOPE,
        'description': PLACEHOLDER_DESCRIPTION,
        'media': [
            {'image': 'project-1', 'alt': {
                'en': 'Illustrative image: a living room with an ivory sofa, a cognac leather armchair and a '
                      'travertine coffee table in warm afternoon light.',
                'ar': 'صورة توضيحية: غرفة معيشة بأريكة بلون العاج ومقعد من الجلد البني وطاولة قهوة من الترافرتين '
                      'في ضوء العصر الدافئ.'}},
            {'image': None},
            {'image': None},
        ],
        'thumbnail': None,
        'focus': '50% 55%',
    },
    {
        'slug': 'project-2',
        'name': {'en': 'Project 02', 'ar': 'المشروع 02'},
        'work': PLACEHOLDER_SCOPE,
        'description': PLACEHOLDER_DESCRIPTION,
        'media': [
            {'image': 'project-2', 'alt': {
                'en': 'Illustrative image: a curved plaster staircase with a brass handrail and a wooden bench '
                      'at its base.',
                'ar': 'صورة توضيحية: درج منحنٍ من الجص بدرابزين نحاسي ومقعد خشبي عند قاعدته.'}},
            {'image': None},
            {'image': None},
        ],
        'thumbnail': None,
        # Portrait original: keep the curve of the stair in the landscape crop.
        'focus': '50% 62%',
    },
    {
        'slug': 'project-3',
        'name': {'en': 'Project 03', 'ar': 'المشروع 03'},
        'work': PLACEHOLDER_SCOPE,
        'description': PLACEHOLDER_DESCRIPTION,
        'media': [
            {'image': 'project-3', 'alt': {
                'en': 'Illustrative image: an open kitchen with a travertine island, walnut cabinetry and brass '
                      'pendant lights.',
                'ar': 'صورة توضيحية: مطبخ مفتوح بجزيرة من الترافرتين وخزائن من خشب الجوز وإضاءة معلّقة نحاسية.'}},
            {'image': None},
            {'image': None},
        ],
        'thumbnail': None,
        'focus': '50% 50%',
    },
    {
        'slug': 'project-4',
        'name': {'en': 'Project 04', 'ar': 'المشروع 04'},
        'work': PLACEHOLDER_SCOPE,
        'description': PLACEHOLDER_DESCRIPTION,
        'media': [
            {'image': 'project-4', 'alt': {
                'en': 'Illustrative image: a warm interior with an arched doorway, a travertine floor in low '
                      'sunlight, an ivory sofa and a walnut console.',
                'ar': 'صورة توضيحية: مساحة داخلية دافئة بمدخل مقوّس وأرضية من الترافرتين في ضوء الشمس المنخفض، '
                      'وأريكة بلون العاج وطاولة جانبية من خشب الجوز.'}},
            {'image': None},
            {'image': None},
        ],
        'thumbnail': None,
        'focus': '50% 50%',
    },
]

TILES = 3  # media shown in each project's group on the Projects page

_SLUG = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


def _text(value, lang):
    if isinstance(value, dict):
        return value.get(lang) or value.get('en', '')
    return value or ''


def _suffix(lang):
    return '_ar' if lang == 'ar' else ''


def index_url(slug, lang):
    """The project's place on the Projects page."""
    return f"{reverse('core:projects' + _suffix(lang))}#{slug}"


def detail_url(slug, lang):
    return reverse('core:project' + _suffix(lang), kwargs={'slug': slug})


def _media(item, lang):
    if item.get('video'):
        poster = item.get('poster')
        return {'kind': 'video', 'src': static(item['video']), 'title': _text(item.get('title'), lang),
                'poster': resolve(poster) if poster else None}
    if item.get('image'):
        return {'kind': 'photo', 'image': resolve(item['image'], _text(item.get('alt'), lang))}
    return {'kind': 'placeholder'}


def _build(project, number, lang):
    media = [_media(item, lang) for item in project.get('media', [])]
    photos = [m for m in media if m['kind'] == 'photo']
    tiles = (media + [{'kind': 'placeholder'}] * TILES)[:TILES]
    first = next((item for item in project.get('media', []) if item.get('image')), None)
    thumb_key = project.get('thumbnail') or (first or {}).get('image')
    for i, photo in enumerate(photos):
        photo['index'] = i  # position in the photo gallery
    return {
        'slug': project['slug'],
        'number': f'{number:02d}',
        'name': _text(project['name'], lang),
        'work': _text(project.get('work'), lang),
        'description': _text(project.get('description'), lang),
        'focus': project.get('focus') or '50% 50%',
        # Homepage carousel.
        'image': photos[0]['image'] if photos else None,
        'thumbnail': resolve(thumb_key) if thumb_key else None,
        # Projects page and project page.
        'media': media,
        'photos': photos,
        'tiles': tiles,
        'more': max(0, len([m for m in media if m['kind'] != 'placeholder'])
                    - len([t for t in tiles if t['kind'] != 'placeholder'])),
        'index_url': index_url(project['slug'], lang),
        'detail_url': detail_url(project['slug'], lang),
    }


def for_language(lang):
    """Template-ready projects for one language."""
    return [_build(project, number, lang) for number, project in enumerate(PROJECTS, start=1)]


def get(slug, lang):
    """One project by slug, or None."""
    for number, project in enumerate(PROJECTS, start=1):
        if project['slug'] == slug:
            return _build(project, number, lang)
    return None


def validate():
    """Problems in PROJECTS, as messages (checked by the test suite)."""
    problems, seen = [], set()
    for project in PROJECTS:
        slug = project.get('slug', '')
        if not _SLUG.match(slug):
            problems.append(f'{slug!r}: slug must be lowercase letters, digits and hyphens')
        if slug in seen:
            problems.append(f'{slug!r}: duplicate slug')
        seen.add(slug)
        if not _text(project.get('name'), 'en'):
            problems.append(f'{slug!r}: missing name')
        if project.get('thumbnail') and project['thumbnail'] not in IMAGES:
            problems.append(f"{slug!r}: thumbnail {project['thumbnail']!r} is not in images.py")
        for item in project.get('media', []):
            if item.get('video'):
                if not finders.find(item['video']):
                    problems.append(f"{slug!r}: video {item['video']!r} not found in static/")
                if item.get('poster') and item['poster'] not in IMAGES:
                    problems.append(f"{slug!r}: poster {item['poster']!r} is not in images.py")
            elif item.get('image'):
                if item['image'] not in IMAGES:
                    problems.append(f"{slug!r}: image {item['image']!r} is not in images.py")
                if not _text(item.get('alt'), 'en'):
                    problems.append(f"{slug!r}: image {item['image']!r} without alt text")
    return problems

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
                  A photo may also have a 'caption' (a short title). When every
                  medium is a captioned photo, the project page shows the
                  interactive gallery: one large photo, caption and counter,
                  thumbnails and full screen. Any photo may carry
                  'hotspots': markers linking to other views, each {'to':
                  <the destination photo's image key>, 'x': .., 'y': ..} (its
                  point on this photo, in % of the photo's width and height).
    'tiles'       optional: which media (indexes) form the Projects page group,
                  in order; otherwise the first three
    'concept'     optional {'note', 'images': [{'image', 'caption', 'alt'}, ...]}:
                  concept visualizations, a gallery on its own tab of the
                  interactive project page, with one note under it
    'thumbnail'   optional images.py key for the homepage thumbnail
    'focus'       optional crop focal point (CSS object-position) for the
                  homepage image

Photos: WebP files in static/images/site/, registered in images.py.
Films: MP4 (H.264) files in static/videos/, with a poster photo.

Text fields take one string (both languages) or {'en': ..., 'ar': ...}; a
missing 'ar' falls back to English.

Project 01 is the studio's real KK Barbershop. Projects 02-04 are TEMPORARY:
their photos are illustrative, AI-generated interiors (labelled as such on
the page), not studio projects, and the detail photos are placeholders.

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
        # KK Barbershop, Sheikh Zayed: the real photographs (static/images/KK/).
        # Its slug stays 'project-1' so existing links keep working.
        'slug': 'project-1',
        'name': {'en': 'KK Barbershop - Sheikh Zayed', 'ar': 'صالون KK - الشيخ زايد'},
        'work': {'en': 'Explore the completed space and its different views.',
                 'ar': 'استكشف المساحة بعد التنفيذ من زوايا مختلفة.'},
        # Projects page group: the overview large, then the coffee counter and the front view.
        'tiles': [0, 3, 5],
        'media': [
            {'image': 'kk-img-8891', 'caption': {'en': 'Overview', 'ar': 'نظرة عامة'}, 'alt': {
                'en': 'The main hall of KK Barbershop: olive-green leather sofas around a wooden coffee table, a '
                      'wood-clad coffee counter beneath a wall screen, and black barber chairs facing mirrors on the '
                      'right, under a dark timber ceiling with linear lights.',
                'ar': 'الصالة الرئيسية في صالون KK: أرائك من الجلد الزيتوني حول طاولة قهوة خشبية، وركن قهوة مكسو '
                      'بالخشب أسفل شاشة على الحائط، وكراسي حلاقة سوداء أمام المرايا على اليمين، تحت سقف خشبي داكن '
                      'بإضاءة خطية.'},
             # Markers linking to the other views: 'to' is the destination photo's
             # image key; x and y are the marker's point on THIS photo, in % of its
             # width and height. Overview is reached from every view through the
             # gallery's own Overview button, so no marker points back to it.
             'hotspots': [
                 {'to': 'kk-img-8894', 'x': 27, 'y': 58},    # the wooden coffee counter, left of centre
                 {'to': 'kk-img-8893', 'x': 85, 'y': 60},    # the barber chairs on the right
                 {'to': 'kk-img-8895', 'x': 58, 'y': 80},    # the olive-green sofa in the foreground
             ]},
            {'image': 'kk-img-8892', 'caption': {'en': 'Along the Stations', 'ar': 'امتداد محطات الحلاقة'}, 'alt': {
                'en': 'A row of black barber chairs and mobile trolleys along black-framed mirrors, with olive-green '
                      'sofas on the right and two large black figure sculptures by the glass front.',
                'ar': 'صف من كراسي الحلاقة السوداء والعربات المتحركة بجانب مرايا بإطارات سوداء، وأرائك زيتونية على '
                      'اليمين، وتمثالان أسودان كبيران بجوار الواجهة الزجاجية.'},
             'hotspots': [
                 {'to': 'kk-img-8893', 'x': 55, 'y': 62},    # the row of chairs at the stations
                 {'to': 'kk-img-8896', 'x': 86, 'y': 72},    # the lounge on the right, where the front view is seen from
             ]},
            {'image': 'kk-img-8893', 'caption': {'en': 'Styling Area', 'ar': 'منطقة الحلاقة'}, 'alt': {
                'en': 'Black barber chairs facing tall black-framed mirrors under square light frames, with the '
                      'coffee counter and a wall screen on the left.',
                'ar': 'كراسي حلاقة سوداء أمام مرايا طويلة بإطارات سوداء تحت إطارات إضاءة مربعة، وركن القهوة وشاشة '
                      'على الحائط إلى اليسار.'},
             'hotspots': [
                 {'to': 'kk-img-8892', 'x': 30, 'y': 60},    # the chairs further along the stations
                 {'to': 'kk-img-8896', 'x': 8, 'y': 70},     # the olive sofa in the lounge, left
             ]},
            {'image': 'kk-img-8894', 'caption': {'en': 'Coffee Counter', 'ar': 'ركن القهوة'}, 'alt': {
                'en': 'The wood-clad coffee counter with an espresso machine and a grinder below a wall screen, an '
                      'olive-green sofa in the foreground and barber chairs to the right.',
                'ar': 'ركن القهوة المكسو بالخشب وعليه ماكينة إسبريسو ومطحنة أسفل شاشة على الحائط، وأريكة زيتونية في '
                      'المقدمة وكراسي حلاقة إلى اليمين.'},
             'hotspots': [
                 {'to': 'kk-img-8895', 'x': 64, 'y': 82},    # the olive sofa in the foreground
             ]},
            {'image': 'kk-img-8895', 'caption': {'en': 'Waiting & Display', 'ar': 'الانتظار وعرض المنتجات'}, 'alt': {
                'en': 'The waiting area: olive-green sofas and a wooden coffee table facing the coffee counter, with '
                      'product shelves and hair-washing chairs on the left and barber chairs on the right.',
                'ar': 'منطقة الانتظار: أرائك زيتونية وطاولة قهوة خشبية في مواجهة ركن القهوة، ورفوف المنتجات '
                      'وكراسي غسيل الشعر على اليسار وكراسي الحلاقة على اليمين.'},
             'hotspots': [
                 {'to': 'kk-img-8894', 'x': 52, 'y': 51},    # the coffee counter behind the sofas
                 {'to': 'kk-img-8896', 'x': 76, 'y': 60},    # the barber stations on the right
             ]},
            {'image': 'kk-img-8896', 'caption': {'en': 'Front View', 'ar': 'منظر أمامي لمحطات الحلاقة'}, 'alt': {
                'en': 'Front view of the barber stations: black barber chairs and trolleys facing the mirrors, seen '
                      'between two olive-green sofas and a long wooden coffee table.',
                'ar': 'منظر أمامي لمحطات الحلاقة: كراسي حلاقة سوداء وعربات أمام المرايا، بين أريكتين زيتونيتين '
                      'وطاولة قهوة خشبية طويلة.'},
             'hotspots': [
                 {'to': 'kk-img-8893', 'x': 77, 'y': 57},    # the barber chairs at the mirrors
                 {'to': 'kk-img-8895', 'x': 20, 'y': 80},    # the olive sofa in the foreground, left
             ]},
        ],
        # Concept Visualization tab, separate from the photographs: AI-generated
        # illustrations of the same views (static/images/KK/Render 2.png and
        # static/images/KK/render/), in the photographs' order. Not the original
        # design documents: their details differ from the finished space.
        'concept': {
            'note': {'en': 'Illustrative visualizations based on the space — not original pre-construction design '
                           'documents. Their details differ from the completed interior.',
                     'ar': 'تصورات توضيحية مستوحاة من المكان، وليست مستندات تصميم أصلية من قبل التنفيذ. وتختلف بعض '
                           'تفاصيلها عن التنفيذ النهائي.'},
            'images': [
                {'image': 'kk-render-2', 'caption': {'en': 'Overview', 'ar': 'نظرة عامة'}, 'alt': {
                    'en': 'Concept visualization of the main hall: olive-green leather sofas around a coffee table, '
                          'barber chairs facing mirrored walls and a dark ceiling with linear lights.',
                    'ar': 'تصوّر للصالة الرئيسية: أرائك من الجلد الزيتوني حول طاولة قهوة، وكراسي حلاقة أمام جدران من '
                          'المرايا، وسقف داكن بإضاءة خطية.'}},
                {'image': 'kk-concept-stations', 'caption': {'en': 'Along the Stations', 'ar': 'امتداد محطات الحلاقة'}, 'alt': {
                    'en': 'Concept visualization along the barber stations: black chairs and trolleys by framed mirrors, '
                          'olive sofas and a coffee table on the right, and black figure sculptures by the glass front.',
                    'ar': 'تصوّر على امتداد محطات الحلاقة: كراسٍ سوداء وعربات بجانب مرايا بإطارات، وأرائك زيتونية '
                          'وطاولة قهوة على اليمين، وتماثيل سوداء بجوار الواجهة الزجاجية.'}},
                {'image': 'kk-concept-styling', 'caption': {'en': 'Styling Area', 'ar': 'منطقة الحلاقة'}, 'alt': {
                    'en': 'Concept visualization of the styling area: black barber chairs facing tall framed mirrors under '
                          'square light frames, with the coffee counter on the left.',
                    'ar': 'تصوّر لمنطقة الحلاقة: كراسي حلاقة سوداء أمام مرايا طويلة بإطارات تحت إطارات إضاءة مربعة، '
                          'وركن القهوة على اليسار.'}},
                {'image': 'kk-concept-coffee', 'caption': {'en': 'Coffee Counter', 'ar': 'ركن القهوة'}, 'alt': {
                    'en': 'Concept visualization of the coffee counter: a wood-clad counter with an espresso machine '
                          'below a wall screen, an olive sofa in front and barber chairs to the right.',
                    'ar': 'تصوّر لركن القهوة: ركن مكسو بالخشب عليه ماكينة إسبريسو أسفل شاشة على الحائط، وأريكة '
                          'زيتونية في المقدمة وكراسي حلاقة إلى اليمين.'}},
                {'image': 'kk-concept-waiting', 'caption': {'en': 'Waiting & Display', 'ar': 'الانتظار وعرض المنتجات'}, 'alt': {
                    'en': 'Concept visualization of the waiting area: grey sofas and a stone-topped table facing the '
                          'coffee counter, with lit shelves and hair-washing chairs on the left and barber chairs on the right.',
                    'ar': 'تصوّر لمنطقة الانتظار: أرائك رمادية وطاولة بسطح حجري في مواجهة ركن القهوة، ورفوف مضاءة '
                          'وكراسي غسيل الشعر على اليسار وكراسي الحلاقة على اليمين.'}},
                {'image': 'kk-concept-front', 'caption': {'en': 'Front View', 'ar': 'منظر أمامي لمحطات الحلاقة'}, 'alt': {
                    'en': 'Concept visualization of the barber stations from the front, between two olive sofas and a '
                          'stone-topped coffee table.',
                    'ar': 'تصوّر لمحطات الحلاقة من الأمام، بين أريكتين زيتونيتين وطاولة قهوة بسطح حجري.'}},
            ],
        },
        'thumbnail': None,
        'focus': '50% 62%',
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
        return {'kind': 'photo', 'image': resolve(item['image'], _text(item.get('alt'), lang)),
                'caption': _text(item.get('caption'), lang)}
    return {'kind': 'placeholder'}


def _build(project, number, lang):
    media = [_media(item, lang) for item in project.get('media', [])]
    photos = [m for m in media if m['kind'] == 'photo']
    if project.get('tiles'):
        tiles = [media[i] for i in project['tiles']][:TILES]
    else:
        tiles = (media + [{'kind': 'placeholder'}] * TILES)[:TILES]
    first = next((item for item in project.get('media', []) if item.get('image')), None)
    thumb_key = project.get('thumbnail') or (first or {}).get('image')
    for i, photo in enumerate(photos):
        photo['index'] = i  # position in the photo gallery
        photo['number'] = f'{i + 1:02d}'
    # The interactive gallery: every medium a captioned photo.
    interactive = bool(photos) and len(photos) == len(media) and all(p['caption'] for p in photos)
    if interactive:
        position = {item['image']: i for i, item in enumerate(project['media'])}
        for photo, item in zip(photos, project['media']):
            # 'edge': near the left or right edge the label opens inwards.
            photo['hotspots'] = [{'target': position[spot['to']], 'x': spot['x'], 'y': spot['y'],
                                  'label': photos[position[spot['to']]]['caption'],
                                  'edge': 'right' if spot['x'] > 70 else 'left' if spot['x'] < 30 else ''}
                                 for spot in item.get('hotspots', [])]
    concept = project.get('concept') if interactive else None
    return {
        'slug': project['slug'],
        'number': f'{number:02d}',
        'name': _text(project['name'], lang),
        # For headings: " - " never starts a line ("KK Barbershop -" / "Sheikh Zayed").
        'title': _text(project['name'], lang).replace(' - ', ' - '),
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
        'interactive': interactive,
        'concept': {'note': _text(concept.get('note'), lang),
                    'images': [{'image': resolve(item['image'], _text(item.get('alt'), lang)),
                                'caption': _text(item.get('caption'), lang), 'index': i, 'number': f'{i + 1:02d}'}
                               for i, item in enumerate(concept['images'])]} if concept else None,
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
        media = project.get('media', [])
        for i in project.get('tiles') or []:
            if not 0 <= i < len(media):
                problems.append(f'{slug!r}: tiles index {i} is out of range')
        keys = [item.get('image') for item in media]
        for item in media:
            for spot in item.get('hotspots', []):
                if not (spot.get('to') in keys and spot['to'] != item.get('image') and 0 <= spot.get('x', -1) <= 100
                        and 0 <= spot.get('y', -1) <= 100):
                    problems.append(f'{slug!r}: hotspot {spot!r} has a bad destination or position')
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
        concept = project.get('concept')
        if concept:
            if not concept.get('images'):
                problems.append(f'{slug!r}: concept without images')
            for item in concept.get('images', []):
                if item.get('image') not in IMAGES or not _text(item.get('alt'), 'en') or not _text(item.get('caption'), 'en'):
                    problems.append(f"{slug!r}: concept image {item.get('image')!r} not in images.py, or without alt text or caption")
            used = [item['image'] for item in media if item.get('image')]
            if any(item.get('image') in used for item in concept.get('images', [])):
                problems.append(f'{slug!r}: a concept image is also one of the photographs')
    return problems

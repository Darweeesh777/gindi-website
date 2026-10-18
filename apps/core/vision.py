"""
"From Vision to Reality" — design/reality comparisons below Projects, one
project at a time (arrows and dots switch between them). The one place to
edit them: VISIONS, in display order.

Each entry:

    'id'            stable, unique id (letters, digits, hyphens)
    'project_name'  shown at the top right of the section
    'design'        the design visual (the original render or drawing)
    'reality'       the photograph of the finished space
        'image'     key of the image in images.py (WebP files in
                    static/images/site/)
        'alt'       description of the image for screen readers
    'focus'         crop focal point for both images, as CSS object-position

Both images of an entry are shown in the same frame with the same cropping,
so they line up only if they share the same framing and proportions: export
them from the same viewpoint, at the same size (16:9 or 3:2 landscape).

Only complete entries (both images registered) are shown; the counter and
dots follow their number, and appear only when there are two or more. Never
pair unrelated images or reuse one project's images for another.

Text fields take one string (both languages) or a dict with 'en' and 'ar';
a missing 'ar' falls back to English.
"""
import re

from .images import IMAGES, resolve

VISIONS = [
    {
        'id': 'kk-barbershop',
        'project_name': {'en': 'KK Barbershop — Sheikh Zayed', 'ar': 'KK Barbershop — الشيخ زايد'},
        'design': {
            'image': 'kk-design',
            'alt': {
                'en': 'Design render of KK Barbershop, Sheikh Zayed: a waiting lounge with two olive-green leather '
                      'sofas around a coffee table, barber chairs facing mirrored walls, and a dark ceiling with '
                      'linear lights.',
                'ar': 'التصميم المقترح لـ KK Barbershop في الشيخ زايد: صالة انتظار بأريكتين من الجلد الزيتوني حول '
                      'طاولة قهوة، وكراسي حلاقة أمام جدران من المرايا، وسقف داكن بإضاءة خطية.',
            },
        },
        'reality': {
            'image': 'kk-reality',
            'alt': {
                'en': 'KK Barbershop, Sheikh Zayed, as built: olive-green leather sofas around a wooden coffee '
                      'table, barber chairs facing mirrored walls, and a dark timber-board ceiling with square and '
                      'linear lights.',
                'ar': 'KK Barbershop في الشيخ زايد بعد التنفيذ: أرائك من الجلد الزيتوني حول طاولة قهوة خشبية، '
                      'وكراسي حلاقة أمام جدران من المرايا، وسقف داكن من ألواح الخشب بإضاءة مربعة وخطية.',
            },
        },
        # Slightly below centre: keeps the lounge and chairs when the frame is
        # wider than the 3:2 images (desktop), trimming more ceiling than floor.
        'focus': '50% 62%',
    },
    # TEMPORARY sample, at the studio's request, until the second real
    # project's design render and photograph arrive: computer-generated images
    # of one room, empty and furnished (the furnished one is the hero image).
    # Not a studio project: replace this whole entry with the real one.
    {
        'id': 'sample-arched-hall',
        'project_name': {'en': 'Sample Project — Arched Hall', 'ar': 'مشروع نموذجي — القاعة المقوّسة'},
        'design': {
            'image': 'sample-hall-empty',
            'alt': {
                'en': 'Computer-generated image of an empty hall with a stone floor, plastered walls, framed '
                      'artwork and an arched doorway onto a dining area.',
                'ar': 'صورة مولّدة بالحاسوب لقاعة فارغة بأرضية حجرية وجدران مكسوّة بالجص ولوحات معلّقة، '
                      'وباب مقوّس يطل على منطقة طعام.',
            },
        },
        'reality': {
            'image': 'hero-desktop',
            'alt': {
                'en': 'Computer-generated image of the same hall furnished, with a curved cream sofa, a timber '
                      'side table with a brass lamp, a woven rug and a timber console with olive branches.',
                'ar': 'صورة مولّدة بالحاسوب للقاعة نفسها بعد التأثيث، بأريكة منحنية بلون كريمي، وطاولة '
                      'جانبية خشبية عليها مصباح نحاسي، وسجادة منسوجة، وكونسول خشبي عليه أغصان زيتون.',
            },
        },
    },
    # The second real project: replace the sample above with its entry, with
    # its own design render and the photograph of the finished space.
]

_ID = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


def _text(value, lang):
    if isinstance(value, dict):
        return value.get(lang) or value.get('en', '')
    return value or ''


def _complete(entry):
    return all(entry.get(side, {}).get('image') in IMAGES for side in ('design', 'reality'))


def for_language(lang):
    """Template-ready entries for one language: the complete ones, in order."""
    def side(entry, key):
        data = entry[key]
        alt = _text(data.get('alt'), lang)
        return {'image': resolve(data['image'], alt) if data.get('image') else None, 'alt': alt}

    return [{
        'id': entry['id'],
        'project_name': _text(entry['project_name'], lang),
        'design': side(entry, 'design'),
        'reality': side(entry, 'reality'),
        'focus': entry.get('focus') or '50% 50%',
    } for entry in VISIONS if _complete(entry)]


def validate():
    """Problems in VISIONS, as messages (checked by the test suite)."""
    problems = []
    ids = [entry.get('id') for entry in VISIONS]
    if len(set(ids)) != len(ids):
        problems.append('duplicate ids')
    for entry in VISIONS:
        name = entry.get('id') or '?'
        if not _ID.match(entry.get('id') or ''):
            problems.append(f'{name}: invalid id')
        if not _text(entry.get('project_name'), 'en'):
            problems.append(f'{name}: missing project_name')
        keys = []
        for side in ('design', 'reality'):
            key = entry.get(side, {}).get('image')
            if not key or key not in IMAGES:
                problems.append(f'{name}: {side} image {key!r} is not in images.py')
            elif not _text(entry[side].get('alt'), 'en'):
                problems.append(f'{name}: {side} image without alt text')
            keys.append(key)
        if keys[0] == keys[1] and keys[0]:
            problems.append(f'{name}: design and reality are the same image')
        if all(k in IMAGES for k in keys) and IMAGES[keys[0]]['size'][0] * IMAGES[keys[1]]['size'][1] != \
                IMAGES[keys[1]]['size'][0] * IMAGES[keys[0]]['size'][1]:
            problems.append(f'{name}: design and reality images have different proportions, so they will not line up')
    images = [entry[side]['image'] for entry in VISIONS for side in ('design', 'reality') if entry.get(side, {}).get('image')]
    if len(set(images)) != len(images):
        problems.append('an image is used by more than one entry')
    return problems

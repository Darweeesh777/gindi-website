"""
"From Vision to Reality" — the design/reality comparison below Projects.
The one place to edit it.

    'project_name'  shown at the top right of the section
    'design'        the design visual (render or drawing)
    'reality'       the photograph of the finished space
        'image'     key of the image in images.py (WebP files in
                    static/images/site/), or None for the branded placeholder
        'alt'       description of the image for screen readers
    'focus'         crop focal point for both images, as CSS object-position

Both images are shown in the same frame with the same cropping, so they line
up only if they share the same framing and proportions: export them from the
same viewpoint, at the same size (16:9 landscape works best).

Text fields take one string (both languages) or a dict with 'en' and 'ar';
a missing 'ar' falls back to English.

Set an image to None to fall back to a labelled placeholder drawing.
"""
from .images import IMAGES, resolve

VISION = {
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
}


def _text(value, lang):
    if isinstance(value, dict):
        return value.get(lang) or value.get('en', '')
    return value or ''


def for_language(lang):
    """Template-ready data for one language."""
    def side(key):
        entry = VISION[key]
        alt = _text(entry.get('alt'), lang)
        return {'image': resolve(entry['image'], alt) if entry.get('image') else None, 'alt': alt}

    return {
        'project_name': _text(VISION['project_name'], lang),
        'design': side('design'),
        'reality': side('reality'),
        'focus': VISION.get('focus') or '50% 50%',
    }


def validate():
    """Problems in VISION, as messages (checked by the test suite)."""
    problems = []
    if not _text(VISION.get('project_name'), 'en'):
        problems.append('missing project_name')
    keys = []
    for side in ('design', 'reality'):
        key = VISION[side].get('image')
        if key and key not in IMAGES:
            problems.append(f'{side}: image {key!r} is not in images.py')
        if key and not _text(VISION[side].get('alt'), 'en'):
            problems.append(f'{side}: image without alt text')
        keys.append(key)
    if all(k in IMAGES for k in keys) and IMAGES[keys[0]]['size'][0] * IMAGES[keys[1]]['size'][1] != \
            IMAGES[keys[1]]['size'][0] * IMAGES[keys[0]]['size'][1]:
        problems.append('design and reality images have different proportions, so they will not line up')
    return problems

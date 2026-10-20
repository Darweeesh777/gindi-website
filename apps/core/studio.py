"""
GINDI Design Studio — the catalogue: three styles, each one fixed concept
image, with three material controls and three presets. The one place to
edit them. Page: templates/core/design_studio.html; compositor:
static/studio/compositor.js; image preparation: tools/studio/ (README).

The images are AI-generated concept visuals supplied by the studio (not
photographs of completed GINDI projects). Each has prepared maps for its
editable surfaces (static/studio/rooms/<style>/): mask.png, light.webp,
zone.png. The camera, architecture, furniture and lighting never change;
only the masked surfaces do.

Controls. Every style has three "slots", one per colour channel of its mask:
    'upholstery' (red)   fabric; one or two zones (e.g. sofa / armchairs)
    'stone'      (green) a real CC0 stone scan replaces the stone
    'wood'       (blue)  the third control: wood tone, a gilded finish, or a
                         second fabric (Organic Modern's accent chairs)
Each style names its controls and the surfaces they affect ('controls', in
display order). The page's address keeps the slots as ?u=&s=&w=.

Options. The first option of every slot is the material as it appears in
the image ('original': the image's own pixels are shown, so the default view
and Reset show the supplied image exactly). Others:
- stone: 'scan' (static/studio/materials/<scan>/) and 'scale' (metres per
  repeat of the scan): the veining, grain and colour really change;
- fabric: 'colors', one per zone; a zone colour is '#hex' (plain fabric) or
  ['#ground', '#motif'] for a patterned fabric whose two original colours
  (render.upholstery.zones[].ref / refB) are mapped to the two new ones, so
  a damask keeps its pattern. The weave, folds and seams are the image's own;
- wood / finish: 'colors' (one) and optionally 'finish': 'metal' (a gilded
  surface takes a new metal colour, highlights included) or 'wood' (a tone
  over the carving, with white highlights).
A recoloured surface keeps its texture, so options are named by colour (and
fabric options never claim to be leather or another fabric type).
A style is offered only when all its files exist (has_assets).
"""
import os
from math import prod

from django.conf import settings
from django.templatetags.static import static

SLOTS = ('upholstery', 'stone', 'wood')
ROOM_FILES = ('photo.webp', 'card.webp', 'mask.png', 'light.webp', 'zone.png')

NOTE_ORIGINAL = {'en': 'As shown in the image', 'ar': 'كما يظهر في الصورة'}
NOTE_SCAN = {'en': 'Scanned stone sample (ambientCG, CC0)', 'ar': 'عينة حجر ممسوحة ضوئيًا (ambientCG، CC0)'}


def _t(en, ar):
    return {'en': en, 'ar': ar}


def _orig(id_, en, ar, note=None):
    return {'id': id_, 'name': _t(en, ar), 'original': True, 'note': note}


def _colour(id_, en, ar, colors, note=None, finish=None):
    m = {'id': id_, 'name': _t(en, ar), 'colors': colors, 'note': note}
    if finish:
        m['finish'] = finish
    return m


def _scan(id_, en, ar, scan, scale):
    """A stone scan from static/studio/materials/<scan>/ (color.webp, swatch.webp); scale = metres per repeat."""
    return {'id': id_, 'name': _t(en, ar), 'scan': scan, 'scale': scale}


STYLES = [
    {
        'id': 'classic', 'code': 'CL',
        'name': _t('Classic', 'كلاسيك'),
        'text': _t('Carved, gilded frames, powder-blue damask and ivory marble in a formal, light-filled salon.',
                   'إطارات منحوتة مذهّبة، وداماسك أزرق باهت، ورخام عاجي في صالون رسمي مضيء.'),
        'size': (1536, 1024),
        'controls': [
            ('upholstery', _t('Upholstery', 'التنجيد'),
             _t('Sofa and armchairs, as a coordinated set (cushions and bolsters unchanged)',
                'الكنبة والكراسي كمجموعة متناسقة (الوسائد كما هي)')),
            ('stone', _t('Stone', 'الحجر'), _t('Coffee-table and side-table tops', 'سطح طاولة القهوة والطاولة الجانبية')),
            ('wood', _t('Furniture finish', 'تشطيب الأثاث'),
             _t('Carved frames of the sofa, armchairs and tables — not the chandelier, lamps or handles',
                'الإطارات المنحوتة للكنبة والكراسي والطاولات — دون الثريا والأباجورات والمقابض')),
        ],
        # Calibration measured on the image (tools/studio/studio_tool.py prep classic, js/hues.js).
        'render': {
            'upholstery': {'spec': 1.6, 'zones': [
                {'ref': [0.2604, 0.2494, 0.2365], 'refB': [0.2522, 0.2209, 0.1872]},   # sofa: ground / motif
                {'ref': [0.524, 0.4292, 0.3552], 'refB': [0.3618, 0.252, 0.17]},       # armchairs
            ]},
            'stone': {'ref': 0.44, 'tint': [1.10, 0.98, 0.88], 'spec': 1.3, 'specGain': 1, 'parts': [
                # Oval tops as planes: the ellipse's left, right, back and front points -> metres.
                {'type': 'plane', 'img': [[662, 645], [1162, 640], [912, 598], [912, 676]],
                 'world': [[-0.7, 0], [0.7, 0], [0, -0.42], [0, 0.42]]},
                {'type': 'plane', 'img': [[30, 636], [186, 634], [108, 615], [108, 654]],
                 'world': [[-0.32, 0], [0.32, 0], [0, -0.32], [0, 0.32]]},
            ]},
            'wood': {'kind': 'metal', 'ref': [0.119, 0.0505, 0.0176], 'spec': 1.35},
        },
        'materials': {
            'upholstery': [
                _orig('powder_blue_ivory', 'Powder Blue & Ivory', 'أزرق باهت وعاجي',
                      _t('Sofa: powder-blue damask · armchairs: ivory with a blue pattern',
                         'الكنبة: داماسك أزرق باهت · الكراسي: عاجي بنقش أزرق')),
                _colour('ivory_champagne', 'Warm Ivory & Champagne', 'عاجي دافئ وشامبين',
                        [['#B49C7C', '#A88A62'], ['#D2BEA2', '#AF9068']],
                        _t('Sofa: champagne damask · armchairs: warm ivory with a champagne pattern',
                           'الكنبة: داماسك شامبين · الكراسي: عاجي دافئ بنقش شامبين')),
                _colour('muted_sage', 'Muted Sage', 'أخضر مريمي هادئ',
                        [['#9B9884', '#929078'], ['#CBC5B3', '#9A9882']],
                        _t('Sofa: sage damask · armchairs: ivory with a sage pattern',
                           'الكنبة: داماسك أخضر مريمي · الكراسي: عاجي بنقش أخضر مريمي')),
                _colour('dusty_rose_taupe', 'Dusty Rose & Warm Taupe', 'وردي هادئ وبني رمادي دافئ',
                        [['#AE8E86', '#A1857A'], ['#CAB5A7', '#9E8272']],
                        _t('Sofa: dusty-rose damask · armchairs: ivory with a warm taupe pattern',
                           'الكنبة: داماسك وردي هادئ · الكراسي: عاجي بنقش بني رمادي دافئ')),
            ],
            'stone': [
                _orig('ivory_marble', 'Ivory Marble', 'رخام عاجي'),
                _scan('warm_cream_marble', 'Warm Cream Marble', 'رخام كريمي دافئ', 'marble020', 1.0),
                _scan('white_grey_vein_marble', 'White Marble, Grey Veins', 'رخام أبيض بعروق رمادية', 'marble019', 1.0),
                _scan('warm_beige_marble', 'Warm Beige Marble', 'رخام بيج دافئ', 'marble014', 1.2),
            ],
            'wood': [
                _orig('antique_gold', 'Antique Gold', 'ذهبي عتيق'),
                _colour('champagne_gold', 'Champagne Gold', 'ذهبي شامبين', ['#98724A'], finish='metal',
                        note=_t('A paler gilded finish on the same carving', 'تذهيب أفتح على النحت نفسه')),
                _colour('aged_bronze', 'Aged Bronze', 'برونزي معتّق', ['#60482F'], finish='metal',
                        note=_t('A darker, bronzed finish on the same carving', 'تشطيب برونزي أغمق على النحت نفسه')),
                _colour('dark_walnut', 'Dark Walnut', 'جوز داكن', ['#3B2A20'], finish='wood',
                        note=_t('A dark walnut tone on the same carving', 'درجة جوز داكنة على النحت نفسه')),
            ],
        },
        'presets': [
            {'id': 'powder_blue_salon', 'name': _t('Powder Blue Salon', 'صالون أزرق باهت'),
             'upholstery': 'powder_blue_ivory', 'stone': 'ivory_marble', 'wood': 'antique_gold'},
            {'id': 'champagne_salon', 'name': _t('Champagne Salon', 'صالون شامبين'),
             'upholstery': 'ivory_champagne', 'stone': 'warm_cream_marble', 'wood': 'champagne_gold'},
            {'id': 'rose_and_bronze', 'name': _t('Rose & Bronze', 'وردي وبرونزي'),
             'upholstery': 'dusty_rose_taupe', 'stone': 'warm_beige_marble', 'wood': 'aged_bronze'},
        ],
        'default_preset': 'powder_blue_salon',
    },
    {
        'id': 'modern', 'code': 'MO',
        'name': _t('Modern', 'مودرن'),
        'text': _t('Warm and tailored: a deep L-shaped sofa, walnut, travertine and soft natural light.',
                   'دافئ ومتقن: كنبة كبيرة على شكل L، وخشب جوز، وترافرتين، وضوء طبيعي ناعم.'),
        'size': (1536, 1024),
        'controls': [
            ('upholstery', _t('Upholstery', 'التنجيد'),
             _t('Sofa and cream armchair, with the olive armchair as the accent (cushions and throw unchanged)',
                'الكنبة والكرسي الكريمي، مع الكرسي الزيتوني كلون مميز (الوسائد والبطانية كما هي)')),
            ('stone', _t('Stone', 'الحجر'), _t('Coffee table: top, rounded edge and pedestal', 'طاولة القهوة: السطح والحافة المستديرة والقاعدة')),
            ('wood', _t('Wood', 'الخشب'),
             _t('Armchair frames, side table and media console', 'إطارات الكراسي والطاولة الجانبية ووحدة التلفزيون')),
        ],
        # Calibration measured on the image (tools/studio/studio_tool.py prep modern).
        'render': {
            'upholstery': {'spec': 1.5, 'zones': [
                {'ref': [0.2704, 0.1932, 0.1326]},     # sofa and cream armchair (plain boucle / linen)
                {'ref': [0.0915, 0.0626, 0.0302]},     # olive armchair
            ]},
            'stone': {'ref': 0.3, 'tint': [1.18, 0.97, 0.80], 'spec': 1.25, 'specGain': 1, 'parts': [
                # Round top: the ellipse's left, right, back and front points -> a 1.2 m disc.
                {'type': 'plane', 'img': [[666, 628], [1130, 628], [898, 591], [898, 665]],
                 'world': [[-0.6, 0], [0.6, 0], [0, -0.6], [0, 0.6]]},
                # Rounded edge, then the pedestal: wrapped around their curves (centre, half-axes of
                # their top edge in px; radius in m; px per m vertically).
                {'type': 'curve', 'cx': 898, 'cy': 628, 'a': 232, 'b': 37, 'R': 0.6, 'pxPerM': 290},
                {'type': 'curve', 'cx': 900, 'cy': 686, 'a': 146, 'b': 14, 'R': 0.38, 'pxPerM': 290},
            ]},
            'wood': {'kind': 'wood', 'ref': [0.0686, 0.0305, 0.0134], 'spec': 1.35},
        },
        'materials': {
            'upholstery': [
                _orig('warm_neutrals', 'Warm Neutrals', 'محايدات دافئة',
                      _t('Sofa and armchair: warm ivory · accent armchair: olive',
                         'الكنبة والكرسي: عاجي دافئ · الكرسي المميز: زيتوني')),
                _colour('greige_charcoal', 'Light Greige & Charcoal', 'رمادي بيج فاتح وفحمي', ['#9A8D7E', '#3A3734'],
                        _t('Sofa and armchair: light greige · accent armchair: charcoal',
                           'الكنبة والكرسي: رمادي بيج فاتح · الكرسي المميز: فحمي')),
                _colour('sand_olive', 'Sand & Muted Olive', 'رملي وزيتوني هادئ', ['#9E8A6C', '#55553E'],
                        _t('Sofa and armchair: sand · accent armchair: muted olive',
                           'الكنبة والكرسي: رملي · الكرسي المميز: زيتوني هادئ')),
                _colour('grey_cognac', 'Warm Grey & Cognac', 'رمادي دافئ وكونياك', ['#8E8173', '#6B4029'],
                        _t('Sofa and armchair: warm grey · accent armchair: cognac-coloured fabric',
                           'الكنبة والكرسي: رمادي دافئ · الكرسي المميز: قماش بلون الكونياك')),
            ],
            'stone': [
                _orig('beige_travertine', 'Beige Travertine', 'ترافرتين بيج'),
                _scan('soft_white_marble', 'Soft White Marble', 'رخام أبيض ناعم', 'marble001', 1.0),
                _scan('honed_grey_stone', 'Honed Grey Stone', 'حجر رمادي مطفي', 'marble024', 1.0),
                _scan('charcoal_marble', 'Charcoal Marble', 'رخام فحمي', 'marble011', 1.2),
            ],
            'wood': [
                _orig('walnut', 'Walnut', 'جوز'),
                _colour('natural_oak', 'Natural Oak', 'بلوط طبيعي', ['#9C7650'],
                        note=_t('A light oak tone on the same grain', 'درجة بلوط فاتحة على العروق نفسها')),
                _colour('smoked_oak', 'Smoked Oak', 'بلوط مدخّن', ['#5A4B40'],
                        note=_t('A smoked oak tone on the same grain', 'درجة بلوط مدخّن على العروق نفسها')),
                _colour('dark_walnut', 'Dark Walnut', 'جوز داكن', ['#2A1B12'],
                        note=_t('A darker walnut tone on the same grain', 'درجة جوز أغمق على العروق نفسها')),
            ],
        },
        'presets': [
            {'id': 'warm_neutrals', 'name': _t('Warm Neutrals', 'محايدات دافئة'),
             'upholstery': 'warm_neutrals', 'stone': 'beige_travertine', 'wood': 'walnut'},
            {'id': 'charcoal_and_smoked_oak', 'name': _t('Charcoal & Smoked Oak', 'فحمي وبلوط مدخّن'),
             'upholstery': 'greige_charcoal', 'stone': 'charcoal_marble', 'wood': 'smoked_oak'},
            {'id': 'sand_and_olive', 'name': _t('Sand & Olive', 'رملي وزيتوني'),
             'upholstery': 'sand_olive', 'stone': 'soft_white_marble', 'wood': 'natural_oak'},
        ],
        'default_preset': 'warm_neutrals',
    },
    {
        'id': 'organic_modern', 'code': 'OM',
        'name': _t('Organic Modern', 'مودرن عضوي'),
        'text': _t('Soft and sculptural: rounded seating, textured fabrics, pale stone and filtered light.',
                   'ناعم ونحتي: مقاعد منحنية، وأقمشة ذات ملمس، وحجر فاتح، وضوء منساب.'),
        'size': (1536, 1024),
        # This room has no clearly exposed wood: its third control is the two accent chairs.
        'controls': [
            ('upholstery', _t('Sofa', 'الكنبة'), _t('The curved sofa (cushions and throw unchanged)', 'الكنبة المنحنية (الوسائد والبطانية كما هي)')),
            ('wood', _t('Accent chairs', 'الكراسي المميزة'), _t('The two rounded armchairs (cushions unchanged)', 'الكرسيان المستديران (الوسائد كما هي)')),
            ('stone', _t('Stone', 'الحجر'), _t('Coffee table: top and rounded sides', 'طاولة القهوة: السطح والجوانب المستديرة')),
        ],
        # Calibration measured on the image (tools/studio/studio_tool.py prep organic_modern).
        'render': {
            'upholstery': {'spec': 1.6, 'zones': [{'ref': [0.5087, 0.4103, 0.3323]}]},   # the sofa
            'stone': {'ref': 0.6, 'tint': [1.05, 1.0, 0.93], 'spec': 1.3, 'specGain': 1, 'parts': [
                {'type': 'plane', 'img': [[630, 597], [1134, 597], [882, 577], [882, 617]],
                 'world': [[-0.7, 0], [0.7, 0], [0, -0.42], [0, 0.42]]},
                {'type': 'curve', 'cx': 882, 'cy': 597, 'a': 252, 'b': 21, 'R': 0.7, 'pxPerM': 330},
            ]},
            # Third control: the accent chairs' fabric (this room has no exposed wood).
            'wood': {'kind': 'fabric', 'ref': [0.1899, 0.1526, 0.1045], 'spec': 1.6},
        },
        'materials': {
            'upholstery': [
                _orig('ivory', 'Ivory', 'عاجي'),
                _colour('oatmeal', 'Oatmeal', 'شوفاني', ['#B3A08B']),
                _colour('warm_greige', 'Warm Greige', 'رمادي بيج دافئ', ['#B2A598']),
                _colour('pale_sand', 'Pale Sand', 'رملي فاتح', ['#C1AD95']),
            ],
            'wood': [
                _orig('sage', 'Sage', 'أخضر مريمي'),
                _colour('muted_clay', 'Muted Clay', 'طيني هادئ', ['#9B7663']),
                _colour('dusty_blue', 'Dusty Blue', 'أزرق مغبّر', ['#82858B']),
                _colour('muted_olive', 'Muted Olive', 'زيتوني هادئ', ['#7F7A5E']),
            ],
            'stone': [
                _orig('pale_warm_stone', 'Pale Warm Stone', 'حجر فاتح دافئ'),
                _scan('cream_travertine', 'Cream Travertine', 'ترافرتين كريمي', 'travertine009', 1.2),
                _scan('warm_white_marble', 'Warm White Marble', 'رخام أبيض دافئ', 'marble004', 1.0),
                _scan('pale_greige_stone', 'Pale Greige Stone', 'حجر رمادي بيج فاتح', 'marble025', 1.0),
            ],
        },
        'presets': [
            {'id': 'ivory_and_sage', 'name': _t('Ivory & Sage', 'عاجي وأخضر مريمي'),
             'upholstery': 'ivory', 'stone': 'pale_warm_stone', 'wood': 'sage'},
            {'id': 'oatmeal_and_clay', 'name': _t('Oatmeal & Clay', 'شوفاني وطيني'),
             'upholstery': 'oatmeal', 'stone': 'cream_travertine', 'wood': 'muted_clay'},
            {'id': 'greige_and_dusty_blue', 'name': _t('Greige & Dusty Blue', 'رمادي بيج وأزرق مغبّر'),
             'upholstery': 'warm_greige', 'stone': 'warm_white_marble', 'wood': 'dusty_blue'},
        ],
        'default_preset': 'ivory_and_sage',
    },
]

# Style ids of earlier versions of the studio (their links open the first style, with a note).
LEGACY_STYLES = ('neoclassical', 'warm_contemporary', 'soft_minimal', 'bold_contemporary')


def _room_dir(style_id):
    return os.path.join(settings.BASE_DIR, 'static', 'studio', 'rooms', style_id)


def _swatch_path(style_id, slot, m):
    """Swatch: a stone scan's own sample, otherwise a crop of the image rendered with that option."""
    if m.get('scan'):
        return f"studio/materials/{m['scan']}/swatch.webp"
    return f"studio/rooms/{style_id}/swatches/{slot}-{m['id']}.webp"


def has_assets(style):
    """True when the style's image, maps and every option's files exist."""
    d = _room_dir(style['id'])
    if not all(os.path.isfile(os.path.join(d, f)) for f in ROOM_FILES):
        return False
    for slot in SLOTS:
        for m in style['materials'][slot]:
            files = [_swatch_path(style['id'], slot, m)]
            if m.get('scan'):
                files.append(f"studio/materials/{m['scan']}/color.webp")
            if not all(os.path.isfile(os.path.join(settings.BASE_DIR, 'static', *f.split('/'))) for f in files):
                return False
    return True


def available_styles():
    """Styles whose files all exist (the only ones offered)."""
    return [s for s in STYLES if has_assets(s)]


def combinations(style):
    """How many different selections the style offers."""
    return prod(len(style['materials'][slot]) for slot in SLOTS)


def _text(value, lang):
    return value.get(lang) or value.get('en', '') if isinstance(value, dict) else (value or '')


def _note(slot, m):
    if m.get('note'):
        return m['note']
    if m.get('original'):
        return NOTE_ORIGINAL
    if slot == 'stone':
        return NOTE_SCAN
    return None


def style_preview(style_id):
    """The style's image (reduced), for cards and the homepage invitation."""
    return static(f'studio/rooms/{style_id}/card.webp')


def for_language(lang):
    """The catalogue for the page's script: available styles only, with resolved asset URLs."""
    out = []
    for s in available_styles():
        mats = {}
        for slot in SLOTS:
            mats[slot] = []
            for m in s['materials'][slot]:
                item = {'id': m['id'], 'name': _text(m['name'], lang), 'name_en': m['name']['en'],
                        'note': _text(_note(slot, m), lang), 'original': bool(m.get('original')),
                        'swatch': static(_swatch_path(s['id'], slot, m))}
                if m.get('scan'):
                    item.update(map=static(f"studio/materials/{m['scan']}/color.webp"), scale=m['scale'],
                                scan=m['scan'], source=f"ambientCG {m['scan'].capitalize()}")
                for k in ('colors', 'finish'):
                    if m.get(k):
                        item[k] = m[k]
                mats[slot].append(item)
        w, h = s['size']
        room = f"studio/rooms/{s['id']}/"
        out.append({
            'id': s['id'], 'code': s['code'], 'name': _text(s['name'], lang), 'name_en': s['name']['en'],
            'text': _text(s['text'], lang),
            # In display order; each with its options (the template renders one group per control).
            'controls': [{'slot': slot, 'label': _text(label, lang), 'label_en': label['en'], 'surfaces': _text(surfaces, lang),
                          'options': mats[slot]} for slot, label, surfaces in s['controls']],
            'materials': mats,
            'combinations': combinations(s),
            'presets': [{'id': p['id'], 'name': _text(p['name'], lang), 'name_en': p['name']['en'],
                         'upholstery': p['upholstery'], 'stone': p['stone'], 'wood': p['wood']} for p in s['presets']],
            'default_preset': s['default_preset'],
            'preview': style_preview(s['id']),
            'room': {'width': w, 'height': h, 'photo': static(room + 'photo.webp'),
                     'maps': {k: static(room + f) for k, f in (('mask', 'mask.png'), ('light', 'light.webp'), ('zone', 'zone.png'))},
                     'render': s['render']},
        })
    return out


def validate():
    """Problems in the catalogue (checked by the test suite)."""
    problems = []
    for s in STYLES:
        if sorted(slot for slot, _, _ in s['controls']) != sorted(SLOTS):
            problems.append(f"{s['id']}: controls must name each slot once")
        render = s.get('render') or {}
        zones = len(render.get('upholstery', {}).get('zones', []))
        if not zones or not render.get('stone', {}).get('parts') or 'kind' not in render.get('wood', {}):
            problems.append(f"{s['id']}: render settings missing")
        ids = {}
        for slot in SLOTS:
            items = s['materials'][slot]
            ids[slot] = [m['id'] for m in items]
            if not 2 <= len(items) <= 4:
                problems.append(f"{s['id']}: {slot} needs 2 to 4 options")
            if len(set(ids[slot])) != len(items):
                problems.append(f"{s['id']}: duplicate {slot} id")
            if not items or not items[0].get('original') or sum(bool(m.get('original')) for m in items) != 1:
                problems.append(f"{s['id']}: {slot} option 1 (only) must be the image's own material")
            for m in items:
                if not m['name'].get('en') or not m['name'].get('ar'):
                    problems.append(f"{m['id']}: needs English and Arabic names")
                if m.get('original'):
                    continue
                if slot == 'stone' and not (m.get('scan') and m.get('scale')):
                    problems.append(f"{s['id']}/{m['id']}: stone options are scans")
                if slot != 'stone' and len(m.get('colors', [])) != (zones if slot == 'upholstery' else 1):
                    problems.append(f"{s['id']}/{m['id']}: needs one colour per zone")
        if len(s['presets']) != 3:
            problems.append(f"{s['id']}: needs 3 presets")
        for p in s['presets']:
            for slot in SLOTS:
                if p[slot] not in ids[slot]:
                    problems.append(f"{s['id']}/{p['id']}: {slot} {p[slot]!r} is not one of this style's options")
        default = next((p for p in s['presets'] if p['id'] == s['default_preset']), None)
        if not default:
            problems.append(f"{s['id']}: default preset missing")
        elif any(default[slot] != ids[slot][0] for slot in SLOTS):
            problems.append(f"{s['id']}: the default preset must be the image as supplied")
    return problems


# ---------------------------------------------------------------------------
# "Discover your style": an optional five-question guide.
# Deterministic scoring: each answer adds the points below to one or more
# styles (C = Classic, M = Modern, O = Organic Modern). The highest total is
# recommended (ties: the order of STYLES); a second style is suggested when
# it is within SECOND_WITHIN points. The explanation quotes the 'why' of the
# answers that gave the recommended style points. A light-hearted guide to a
# starting point, not a personality assessment.
#
#   Question         answer 1                    answer 2                   answer 3
#   Atmosphere       formal & ornate     C3      warm & grounded    M3      soft & serene        O3
#   Furniture        carved & curved     C2 O1   clean & tailored   M2 C1   rounded & sculptural O2 M1
#   Materials        damask+gilded wood  C2 M1   walnut+travertine  M2 O1   textured fabric+pale stone O2 C1
#   Detail           ornate              C3      balanced           M3      minimal              O3
#   Palette          blue & ivory        C3      earthy + olive     M3      soft whites + sage   O3
#
# Images: crops of the three style images (static/studio/rooms/<style>/quiz-*.webp).
# ---------------------------------------------------------------------------
C, M, O = 'classic', 'modern', 'organic_modern'
SECOND_WITHIN = 2


def _a(id_, en, ar, image, points, why_en, why_ar):
    return {'id': id_, 'label': _t(en, ar), 'image': image, 'points': points, 'why': _t(why_en, why_ar)}


QUIZ = [
    {'id': 'mood', 'question': _t('Which atmosphere feels most like home?', 'أي أجواء تشعرك أكثر بأنك في بيتك؟'), 'answers': [
        _a('formal', 'Formal and ornate', 'رسمية ومزخرفة', f'{C}/room', {C: 3}, 'a formal, ornate atmosphere', 'الأجواء الرسمية المزخرفة'),
        _a('grounded', 'Warm and grounded', 'دافئة ومتزنة', f'{M}/room', {M: 3}, 'a warm, grounded room', 'الغرفة الدافئة المتزنة'),
        _a('serene', 'Soft and serene', 'ناعمة وهادئة', f'{O}/room', {O: 3}, 'a soft, serene room', 'الغرفة الناعمة الهادئة'),
    ]},
    {'id': 'shapes', 'question': _t('Which furniture shapes do you prefer?', 'أي أشكال الأثاث تفضّل؟'), 'answers': [
        _a('carved', 'Carved and curved', 'منحوتة ومنحنية', f'{C}/shape', {C: 2, O: 1}, 'carved, curved furniture', 'الأثاث المنحوت المنحني'),
        _a('tailored', 'Clean and tailored', 'نقية ومتقنة', f'{M}/shape', {M: 2, C: 1}, 'clean, tailored lines', 'الخطوط النقية المتقنة'),
        _a('sculptural', 'Rounded and sculptural', 'مستديرة ونحتية', f'{O}/shape', {O: 2, M: 1}, 'rounded, sculptural forms', 'الأشكال المستديرة النحتية'),
    ]},
    {'id': 'materials', 'question': _t('Which materials would you touch first?', 'أي خامات تلمسها أولًا؟'), 'answers': [
        _a('damask', 'Damask and gilded wood', 'داماسك وخشب مذهّب', f'{C}/material', {C: 2, M: 1}, 'damask and gilded wood', 'الداماسك والخشب المذهّب'),
        _a('walnut', 'Walnut and travertine', 'جوز وترافرتين', f'{M}/material', {M: 2, O: 1}, 'walnut and travertine', 'الجوز والترافرتين'),
        _a('textured', 'Textured fabric and pale stone', 'قماش بملمس وحجر فاتح', f'{O}/material', {O: 2, C: 1}, 'textured fabric and pale stone', 'القماش ذي الملمس والحجر الفاتح'),
    ]},
    {'id': 'detail', 'question': _t('How much detail do you like?', 'ما قدر التفاصيل الذي تحبه؟'), 'answers': [
        _a('ornate', 'Ornate', 'مزخرف', f'{C}/detail', {C: 3}, 'ornate detail', 'التفاصيل المزخرفة'),
        _a('balanced', 'Balanced', 'متوازن', f'{M}/detail', {M: 3}, 'a balanced amount of detail', 'القدر المتوازن من التفاصيل'),
        _a('minimal', 'Minimal', 'قليل', f'{O}/detail', {O: 3}, 'minimal detail', 'التفاصيل القليلة'),
    ]},
    {'id': 'palette', 'question': _t('Which palette would you live with?', 'أي مجموعة ألوان تحب أن تعيش معها؟'), 'answers': [
        _a('blue_ivory', 'Blue and ivory', 'أزرق وعاجي', f'{C}/palette', {C: 3}, 'blue and ivory', 'الأزرق والعاجي'),
        _a('earthy', 'Earthy with olive', 'ترابية مع الزيتوني', f'{M}/palette', {M: 3}, 'earthy tones with olive', 'الألوان الترابية مع الزيتوني'),
        _a('soft_white', 'Soft whites and sage', 'أبيض ناعم وأخضر مريمي', f'{O}/palette', {O: 3}, 'soft whites and sage', 'الأبيض الناعم والأخضر المريمي'),
    ]},
]


def score(answers):
    """Totals per style for {question id: answer id}. The page (studio-page.js) scores the same way."""
    totals = {s['id']: 0 for s in STYLES}
    for q in QUIZ:
        a = next((a for a in q['answers'] if a['id'] == answers.get(q['id'])), None)
        for style_id, pts in (a['points'] if a else {}).items():
            totals[style_id] += pts
    return totals


def recommend(answers):
    """(recommended style id, second style id or None) — the same rule as the page."""
    totals = score(answers)
    order = sorted(totals, key=lambda s: -totals[s])  # stable: ties keep the order of STYLES
    first, second = order[0], order[1]
    return first, (second if totals[first] - totals[second] <= SECOND_WITHIN else None)


def quiz_image(ref):
    style_id, crop = ref.split('/')
    return f'studio/rooms/{style_id}/quiz-{crop}.webp'


def quiz_for_language(lang):
    return {
        'second_within': SECOND_WITHIN,
        'questions': [{
            'id': q['id'], 'question': _text(q['question'], lang),
            'answers': [{'id': a['id'], 'label': _text(a['label'], lang), 'images': [static(quiz_image(a['image']))],
                         'points': a['points'], 'why': _text(a['why'], lang)}
                        for a in q['answers']],
        } for q in QUIZ],
    }

"""
Free calculators — the one place to edit them. Used by the Services page
(tool cards), the homepage Services section, the overview (/free-tools/) and
each calculator's own page (/free-tools/<slug>/).

Each tool:

    'slug'         its page: /free-tools/<slug>/ (keep it once published), and
                   its scripts: static/js/tools/<slug>-calc.js (the arithmetic,
                   unchanged from the original in static/Tools/) and
                   static/js/tools/<slug>.js (the page, in both languages)
    'name'         tool name (the page's title)
    'teaser'       one short line for the homepage Services section
    'short_name'   optional shorter title there (default: name)
    'planning'     one short line for the Services page planning-tools band
    'description'  the page's introduction, also on its card

Text takes one string (both languages) or {'en': ..., 'ar': ...}.
"""
from django.urls import reverse

TOOLS = [
    {
        'slug': 'wire',
        'name': {'en': 'Electrical Wire Calculator', 'ar': 'حاسبة كميات أسلاك الكهرباء'},
        'short_name': {'en': 'Wire Calculator', 'ar': 'حاسبة الأسلاك'},
        'planning': {'en': 'Estimate initial electrical wire quantities.',
                     'ar': 'قدّر الكميات المبدئية للأسلاك الكهربائية.'},
        'teaser': {'en': 'Estimate electrical wire quantities.',
                   'ar': 'قدّر كميات الأسلاك الكهربائية.'},
        'description': {'en': 'Estimate wire lengths, the number of rolls and the cost from your project’s details.',
                        'ar': 'قدّر أطوال الأسلاك وعدد اللفات والتكلفة وفق بيانات مشروعك.'},
    },
    {
        'slug': 'tiles',
        'name': {'en': 'Tile & Ceramic Calculator', 'ar': 'حاسبة السيراميك والبلاط'},
        'short_name': {'en': 'Tile Calculator', 'ar': 'حاسبة البلاط'},
        'planning': {'en': 'Estimate tile quantities for your surfaces.',
                     'ar': 'قدّر كميات البلاط لأسطحك.'},
        'teaser': {'en': 'Plan tiles for floors and walls.',
                   'ar': 'خطّط لبلاط الأرضيات والجدران.'},
        'description': {'en': 'Calculate what your floors, walls and skirting need, with waste and a purchase breakdown.',
                        'ar': 'احسب احتياجات الأرضيات والحوائط والوزرات، مع الهالك وتفاصيل الشراء.'},
    },
    {
        'slug': 'bricks',
        'name': {'en': 'Brick Quantity & Cost Calculator', 'ar': 'حاسبة كميات وتكلفة الطوب'},
        'short_name': {'en': 'Brick Calculator', 'ar': 'حاسبة الطوب'},
        'planning': {'en': 'Estimate brick quantities for your walls.',
                     'ar': 'قدّر كميات الطوب لجدرانك.'},
        'teaser': {'en': 'Calculate initial brick quantities.',
                   'ar': 'احسب كميات الطوب المبدئية.'},
        'description': {'en': 'Plan quantities and cost before the work begins.',
                        'ar': 'خطّط للكميات والتكلفة قبل التنفيذ.'},
    },
    {
        'slug': 'paint',
        'name': {'en': 'Paint Quantity & Cost Calculator', 'ar': 'حاسبة كميات وتكلفة الدهانات'},
        'short_name': {'en': 'Paint Calculator', 'ar': 'حاسبة الدهانات'},
        'planning': {'en': 'Estimate paint quantities and cost for each stage.',
                     'ar': 'قدّر كميات الدهانات وتكلفتها لكل مرحلة.'},
        'teaser': {'en': 'Estimate paint quantities and cost.',
                   'ar': 'قدّر كميات الدهانات وتكلفتها.'},
        'description': {'en': 'Estimate the quantities for each painting stage, the number of packs and the cost, '
                              'from the area and the products you choose.',
                        'ar': 'قدّر كميات مراحل الدهان وعدد العبوات والتكلفة حسب المساحة والمنتجات المختارة.'},
    },
    {
        'slug': 'plaster',
        'name': {'en': 'Plaster Cement & Sand Calculator', 'ar': 'حاسبة أسمنت ورمل المحارة والطرطشة'},
        'short_name': {'en': 'Plaster Calculator', 'ar': 'حاسبة المحارة'},
        'planning': {'en': 'Estimate cement bags and sand for plastering.',
                     'ar': 'قدّر شكاير الأسمنت والرمل لأعمال المحارة.'},
        'teaser': {'en': 'Estimate plaster cement and sand.',
                   'ar': 'قدّر أسمنت ورمل المحارة.'},
        'description': {'en': 'Calculate the cement bags and sand to buy for plastering and the spatter dash, '
                              'including waste and purchase rounding.',
                        'ar': 'احسب شكاير الأسمنت وكمية الرمل اللازمة للمحارة والطرطشة، شاملة الهالك وتقريب الشراء.'},
    },
]


def _text(value, lang):
    if isinstance(value, dict):
        return value.get(lang) or value.get('en', '')
    return value or ''


def _suffix(lang):
    return '_ar' if lang == 'ar' else ''


def _build(tool, lang):
    return {
        'slug': tool['slug'],
        'name': _text(tool['name'], lang),
        'description': _text(tool.get('description'), lang),
        'teaser': _text(tool.get('teaser'), lang),  # homepage line
        'short_name': _text(tool.get('short_name') or tool['name'], lang),  # homepage title
        'planning': _text(tool.get('planning'), lang),  # Services page line
        'url': reverse('core:free_tool' + _suffix(lang), kwargs={'slug': tool['slug']}),
    }


def for_language(lang):
    return [_build(tool, lang) for tool in TOOLS]


def get(slug, lang):
    for tool in TOOLS:
        if tool['slug'] == slug:
            return _build(tool, lang)
    return None

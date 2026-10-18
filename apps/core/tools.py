"""
Free tools — the one place to edit them. Used by the Services page (tool
cards), the overview (/free-tools/) and each tool's own page
(/free-tools/<slug>/).

Each tool:

    'slug'         its page: /free-tools/<slug>/ (keep it once published)
    'name'         tool name
    'teaser'       one short line for the homepage Services section
    'short_name'   optional shorter title there (default: name)
    'planning'     one short line for the Services page planning-tools band
    'description'  one short sentence for its card and page

Every tool has its own, independent agent: its script URL is
settings.FREE_TOOL_SCRIPTS[<slug>], set from the environment variable
FREE_TOOL_<SLUG>_SCRIPT_URL (e.g. FREE_TOOL_WIRE_SCRIPT_URL). Until it is set,
the tool's page shows an honest "Coming soon" state; nothing here calculates
anything. When it is set, the page loads that script, which renders the
agent into the tool's integration area (see templates/core/free_tool.html).

Text takes one string (both languages) or {'en': ..., 'ar': ...}.
"""
from django.conf import settings
from django.urls import reverse

TOOLS = [
    {
        'slug': 'wire',
        'name': {'en': 'Electrical Wire Estimator', 'ar': 'حاسبة الأسلاك الكهربائية'},
        'short_name': {'en': 'Wire Estimator', 'ar': 'حاسبة الأسلاك'},
        'planning': {'en': 'Estimate initial electrical wire quantities.',
                     'ar': 'قدّر الكميات المبدئية للأسلاك الكهربائية.'},
        'teaser': {'en': 'Estimate electrical wire quantities.',
                   'ar': 'قدّر كميات الأسلاك الكهربائية.'},
        'description': {'en': 'An initial estimate of electrical wiring, based on your apartment details.',
                        'ar': 'تقدير مبدئي للأسلاك الكهربائية بناءً على تفاصيل شقتك.'},
    },
    {
        'slug': 'tiles',
        'name': {'en': 'Tile Estimator', 'ar': 'حاسبة البلاط'},
        'planning': {'en': 'Estimate tile quantities for your surfaces.',
                     'ar': 'قدّر كميات البلاط لأسطحك.'},
        'teaser': {'en': 'Plan tiles for floors and walls.',
                   'ar': 'خطّط لبلاط الأرضيات والجدران.'},
        'description': {'en': 'An initial estimate of the tiles needed for your floors and walls.',
                        'ar': 'تقدير مبدئي للبلاط اللازم للأرضيات والجدران.'},
    },
    {
        'slug': 'bricks',
        'name': {'en': 'Brick Estimator', 'ar': 'حاسبة الطوب'},
        'planning': {'en': 'Estimate brick quantities for your walls.',
                     'ar': 'قدّر كميات الطوب لجدرانك.'},
        'teaser': {'en': 'Calculate initial brick quantities.',
                   'ar': 'احسب كميات الطوب المبدئية.'},
        'description': {'en': 'An initial estimate of the bricks needed for your walls.',
                        'ar': 'تقدير مبدئي للطوب اللازم لجدرانك.'},
    },
    {
        'slug': 'cement',
        'name': {'en': 'Cement Estimator', 'ar': 'حاسبة الأسمنت'},
        'planning': {'en': 'Estimate cement quantities for your work.',
                     'ar': 'قدّر كميات الأسمنت لأعمالك.'},
        'teaser': {'en': 'Plan cement quantities for your work.',
                   'ar': 'خطّط لكميات الأسمنت لأعمالك.'},
        'description': {'en': 'An initial estimate of the cement needed for your works.',
                        'ar': 'تقدير مبدئي للأسمنت اللازم لأعمالك.'},
    },
]


def _text(value, lang):
    if isinstance(value, dict):
        return value.get(lang) or value.get('en', '')
    return value or ''


def _suffix(lang):
    return '_ar' if lang == 'ar' else ''


def script_url(tool):
    """The tool's agent script, or '' while it is not connected."""
    return (getattr(settings, 'FREE_TOOL_SCRIPTS', {}).get(tool['slug']) or '').strip()


def _build(tool, lang):
    return {
        'slug': tool['slug'],
        'name': _text(tool['name'], lang),
        'description': _text(tool.get('description'), lang),
        'teaser': _text(tool.get('teaser'), lang),  # homepage line
        'short_name': _text(tool.get('short_name') or tool['name'], lang),  # homepage title
        'planning': _text(tool.get('planning'), lang),  # Services page line
        'url': reverse('core:free_tool' + _suffix(lang), kwargs={'slug': tool['slug']}),
        'script': script_url(tool),
    }


def for_language(lang):
    return [_build(tool, lang) for tool in TOOLS]


def get(slug, lang):
    for tool in TOOLS:
        if tool['slug'] == slug:
            return _build(tool, lang)
    return None

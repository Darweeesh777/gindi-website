"""
Services — the one place to edit them. Used by the homepage Services section,
the Services page (/services/, one accordion item per service) and the
enquiry form's service options.

Each service:

    'slug'          stable anchor: /services/#<slug> opens that item (keep it
                    once published; homepage links point to it)
    'name'          service name
    'summary'       one-sentence description (Services page)
    'teaser'        one short line for the homepage Services section
    'card'          one short line for its Services page card
    'image', 'alt'  its Services page arch photo (images.py key) and alt text
    'focus'         optional crop focal point for that photo, e.g. '50% 55%'
    'deliverables'  short list of key deliverables
    'projects'      optional project slugs (projects.py) for "View Related
                    Projects"; the link only appears when this is filled

Text takes one string (both languages) or {'en': ..., 'ar': ...}.

PLACEHOLDER: the four service names are confirmed; the summaries and
deliverables are DRAFTS and must be confirmed by the studio.
"""
import re

from django.urls import reverse

from .images import resolve

SERVICES = [
    {
        'slug': '2d-design',
        'name': {'en': '2D Design', 'ar': 'التصميم ثنائي الأبعاد'},
        'summary': {'en': 'Clear, buildable drawings that set out every space and detail.',
                    'ar': 'رسومات واضحة قابلة للتنفيذ تحدد كل مساحة وكل تفصيلة.'},
        'teaser': {'en': 'Layouts shaped around your needs.',
                   'ar': 'مخططات مصمَّمة وفق احتياجاتك.'},
        'card': {'en': 'Layouts shaped around your needs.',
                 'ar': 'مخططات مصمَّمة وفق احتياجاتك.'},  # Services page card
        'image': 'about-who',  # Services page arch (images.py key)
        'focus': '45% 55%',
        'alt': {'en': 'A designer’s hand drafting a floor plan beside stone, wood and fabric samples.',
                'ar': 'يد مصمّم ترسم مسقطًا أفقيًا بجوار عيّنات من الحجر والخشب والأقمشة.'},
        'deliverables': [
            {'en': 'Floor plans & layouts', 'ar': 'المساقط وتوزيع الفراغات'},
            {'en': 'Elevations & sections', 'ar': 'الواجهات والقطاعات'},
            {'en': 'Construction details', 'ar': 'التفاصيل التنفيذية'},
        ],
        'projects': [],
    },
    {
        'slug': '3d-design',
        'name': {'en': '3D Design', 'ar': 'التصميم ثلاثي الأبعاد'},
        'summary': {'en': 'Realistic 3D views that show the design before anything is built.',
                    'ar': 'مشاهد واقعية ثلاثية الأبعاد تُظهر التصميم قبل البدء في التنفيذ.'},
        'teaser': {'en': 'See your space before execution.',
                   'ar': 'شاهد مساحتك قبل التنفيذ.'},
        'card': {'en': 'Explore your space before execution.',
                 'ar': 'استكشف مساحتك قبل التنفيذ.'},  # Services page card
        'image': 'kk-design',  # Services page arch (images.py key)
        'focus': '50% 60%',
        'alt': {'en': 'A 3D visualization of a barbershop interior with olive seating and linear ceiling lights.',
                'ar': 'تصوّر ثلاثي الأبعاد لمساحة صالون حلاقة بمقاعد زيتونية اللون وإضاءة سقف خطية.'},
        'deliverables': [
            {'en': 'Photorealistic renders', 'ar': 'صور واقعية للتصميم'},
            {'en': 'Material & lighting studies', 'ar': 'دراسات الخامات والإضاءة'},
            {'en': 'Key viewpoints', 'ar': 'لقطات من زوايا رئيسية'},
        ],
        'projects': [],
    },
    {
        'slug': 'interior-finishing',
        'name': {'en': 'Interior Finishing', 'ar': 'التشطيبات الداخلية'},
        'summary': {'en': 'Surfaces and finishes carried out with care, down to the final detail.',
                    'ar': 'أسطح وتشطيبات تُنفَّذ بعناية حتى آخر تفصيلة.'},
        'teaser': {'en': 'Materials and finishes brought to life.',
                   'ar': 'خامات وتشطيبات تنبض بالحياة.'},
        'card': {'en': 'Bring the approved finishes to life.',
                 'ar': 'نحوّل التشطيبات المعتمدة إلى واقع.'},  # Services page card
        'image': 'about-what',  # Services page arch (images.py key)
        'focus': '50% 50%',
        'alt': {'en': 'A stone counter, walnut joinery and lit timber slats.',
                'ar': 'سطح من الحجر وأعمال نجارة من خشب الجوز وشرائح خشبية مضاءة.'},
        'deliverables': [
            {'en': 'Flooring & wall finishes', 'ar': 'تشطيبات الأرضيات والجدران'},
            {'en': 'Ceilings & lighting', 'ar': 'الأسقف والإضاءة'},
            {'en': 'Joinery & paintwork', 'ar': 'أعمال النجارة والدهانات'},
        ],
        'projects': [],
    },
    {
        'slug': 'fit-out',
        'name': {'en': 'Fit-Out', 'ar': 'التجهيز'},
        'summary': {'en': 'Complete fit-out, coordinated on site through to handover.',
                    'ar': 'تجهيز متكامل يُنسَّق في الموقع حتى التسليم.'},
        'teaser': {'en': 'Prepare your space for everyday use.',
                   'ar': 'جهّز مساحتك للاستخدام اليومي.'},
        'card': {'en': 'Prepare your space for everyday use.',
                 'ar': 'جهّز مساحتك للاستخدام اليومي.'},  # Services page card
        'image': 'about-how',  # Services page arch (images.py key)
        'focus': '50% 55%',
        'alt': {'en': 'A hand checking a fitted oak door panel.',
                'ar': 'يد تتفقّد لوح باب من خشب البلوط بعد تركيبه.'},
        'deliverables': [
            {'en': 'Contractor coordination', 'ar': 'التنسيق مع المقاولين'},
            {'en': 'Site supervision', 'ar': 'الإشراف على الموقع'},
            {'en': 'Handover & snagging', 'ar': 'التسليم ومعالجة الملاحظات'},
        ],
        'projects': [],
    },
]

_SLUG = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


def _text(value, lang):
    if isinstance(value, dict):
        return value.get(lang) or value.get('en', '')
    return value or ''


def page_url(lang):
    return reverse('core:services' + ('_ar' if lang == 'ar' else ''))


def for_language(lang):
    """Template-ready services for one language."""
    from .projects import index_url

    base = page_url(lang)
    out = []
    for number, service in enumerate(SERVICES, start=1):
        related = service.get('projects') or []
        out.append({
            'slug': service['slug'],
            'number': f'{number:02d}',
            'name': _text(service['name'], lang),
            'summary': _text(service.get('summary'), lang),
            'teaser': _text(service.get('teaser'), lang),  # homepage line
            'card': _text(service.get('card'), lang),  # Services page card line
            'image': resolve(service['image'], _text(service.get('alt'), lang)) if service.get('image') else None,
            'focus': service.get('focus', '50% 50%'),
            'deliverables': [_text(item, lang) for item in service.get('deliverables', [])],
            'url': f'{base}#{service["slug"]}',
            'related_url': index_url(related[0], lang) if related else '',
        })
    return out


def validate():
    """Problems in SERVICES, as messages (checked by the test suite)."""
    from .projects import PROJECTS

    problems, seen = [], set()
    project_slugs = {p['slug'] for p in PROJECTS}
    for service in SERVICES:
        slug = service.get('slug', '')
        if not _SLUG.match(slug):
            problems.append(f'{slug!r}: slug must be lowercase letters, digits and hyphens')
        if slug in seen:
            problems.append(f'{slug!r}: duplicate slug')
        seen.add(slug)
        if not _text(service.get('name'), 'en'):
            problems.append(f'{slug!r}: missing name')
        for related in service.get('projects') or []:
            if related not in project_slugs:
                problems.append(f'{slug!r}: related project {related!r} is not in projects.py')
    return problems

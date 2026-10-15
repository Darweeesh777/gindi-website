"""
About page (/about/) — all of its text and image references, in one place.

Text: one string (both languages) or {'en': ..., 'ar': ...}; a missing 'ar'
falls back to English. Line breaks in headings: '\\n'.
Images: keys in images.py (WebP files in static/images/site/), with alt text.
To replace a photo, export new WebPs under the same names (see images.py) or
point the key at a new images.py entry.

The copy is the studio's DRAFT text, editable here; nothing in it claims
dates, team members, awards or project totals.
"""
from .images import resolve

ABOUT = {
    'meta_title': {'en': 'About — Gindi Innovations', 'ar': 'من نحن — Gindi Innovations'},
    'meta_description': {
        'en': 'Gindi Innovations: from an idea to a finished space — who we are, what we do and how we work.',
        'ar': 'Gindi Innovations: من الفكرة إلى مساحة مكتملة — من نحن وماذا نقدّم وكيف نعمل.',
    },
    'hero': {
        'eyebrow': {'en': 'About Gindi', 'ar': 'عن جندي'},
        'title': {'en': 'From an Idea\nto a Finished Space', 'ar': 'من الفكرة\nإلى مساحة مكتملة'},
        'scroll': {'en': 'Scroll to discover', 'ar': 'مرّر للاكتشاف'},
        'image': 'about-hero',
        'alt': {'en': 'An interior shown half as architectural linework and half as the finished, sunlit living room.',
                'ar': 'مساحة داخلية نصفها رسم معماري خطي ونصفها غرفة معيشة مكتملة يغمرها ضوء الشمس.'},
    },
    'chapter_label': {'en': 'Chapter', 'ar': 'الفصل'},
    'who': {
        'eyebrow': {'en': 'The people behind the spaces', 'ar': 'الأشخاص وراء المساحات'},
        'title': {'en': 'Who We Are', 'ar': 'من نحن'},
        'text': {'en': 'A studio shaped by thoughtful design and careful execution.',
                 'ar': 'استوديو تشكّله رؤية تصميمية مدروسة وتنفيذ متقن.'},
        'image': 'about-who',
        'alt': {'en': 'A designer’s hand sketching a floor plan beside samples of stone, wood and fabric.',
                'ar': 'يد مصمم ترسم مخططًا بجوار عيّنات من الحجر والخشب والأقمشة.'},
    },
    'what': {
        'title': {'en': 'What We Do', 'ar': 'ماذا نقدّم'},
        'text': {'en': 'From planning to the final detail.', 'ar': 'من التخطيط حتى آخر تفصيلة.'},
        'link': {'en': 'Explore Our Services', 'ar': 'استكشف خدماتنا'},
        'image': 'about-what',
        'alt': {'en': 'A stone counter, slatted timber wall and warm concealed lighting in a finished interior.',
                'ar': 'كاونتر من الحجر وجدار من شرائح الخشب وإضاءة دافئة مخفية في مساحة مكتملة.'},
        # Services shown, with their icon; names and links come from services.py.
        'services': [('2d-design', 'plan'), ('3d-design', 'cube'), ('interior-finishing', 'roller'), ('fit-out', 'tools')],
    },
    'how': {
        'eyebrow': {'en': 'How we work', 'ar': 'كيف نعمل'},
        'title': {'en': 'A clear path from\nbrief to handover.', 'ar': 'مسار واضح من\nالفكرة حتى التسليم.'},
        'steps': [
            {'title': {'en': 'Listen', 'ar': 'نستمع'},
             'text': {'en': 'We understand your goals, space and requirements.',
                      'ar': 'نفهم أهدافك ومساحتك ومتطلباتك.'}},
            {'title': {'en': 'Define', 'ar': 'نحدّد'},
             'text': {'en': 'We align on scope, approach and practical solutions.',
                      'ar': 'نتفق على النطاق والأسلوب والحلول العملية.'}},
            {'title': {'en': 'Design', 'ar': 'نصمّم'},
             'text': {'en': 'We develop the agreed drawings, visualizations and material selections.',
                      'ar': 'نطوّر الرسومات والتصورات واختيارات الخامات المتفق عليها.'}},
            {'title': {'en': 'Execute', 'ar': 'ننفّذ'},
             'text': {'en': 'For projects including execution, we bring the agreed design to life.',
                      'ar': 'في المشاريع التي تشمل التنفيذ، نحوّل التصميم المتفق عليه إلى واقع.'}},
            {'title': {'en': 'Handover', 'ar': 'نسلّم'},
             'text': {'en': 'We review the completed work and hand over the agreed deliverables.',
                      'ar': 'نراجع الأعمال المنجزة ونسلّم المخرجات المتفق عليها.'}},
        ],
        'note': {'en': 'Execution and handover stages depend on the agreed service scope.',
                 'ar': 'تعتمد مرحلتا التنفيذ والتسليم على نطاق الخدمة المتفق عليه.'},
        'image': 'about-how',
        'alt': {'en': 'A hand checking the finish of a solid oak door in warm side light.',
                'ar': 'يد تتفقّد تشطيب باب من خشب البلوط في ضوء جانبي دافئ.'},
    },
    'details': {
        'caption': {'en': 'Care in the details.', 'ar': 'عناية في التفاصيل.'},
        'images': [
            ('about-detail-1', {'en': 'A brushed brass tap on a terrazzo stone basin, with an olive branch beside it.',
                                'ar': 'صنبور نحاسي مصقول على حوض من حجر التيرازو، وبجانبه غصن زيتون.'}),
            ('about-detail-2', {'en': 'Oak slats casting soft shadows above a stone ledge.',
                                'ar': 'شرائح من خشب البلوط تلقي ظلالًا ناعمة فوق رف حجري.'}),
        ],
    },
    'closing': {
        'title': {'en': 'Let’s write your next chapter.', 'ar': 'لنكتب فصلك التالي.'},
        'discuss': {'en': 'Discuss Your Project', 'ar': 'ناقش مشروعك'},
        'whatsapp': {'en': 'Chat on WhatsApp', 'ar': 'تواصل عبر واتساب'},
        'whatsapp_message': {'en': 'Hello, I’d like to discuss a project with Gindi Innovations.',
                             'ar': 'مرحبًا، أودّ مناقشة مشروع مع Gindi Innovations.'},
    },
}


def _t(value, lang):
    if isinstance(value, dict):
        return value.get(lang) or value.get('en', '')
    return value or ''


def _lines(value, lang):
    return _t(value, lang).split('\n')


def for_language(lang, services):
    """Template-ready About content. `services`: services.for_language(lang)."""
    a = ABOUT
    by_slug = {s['slug']: s for s in services}
    return {
        'meta_title': _t(a['meta_title'], lang),
        'meta_description': _t(a['meta_description'], lang),
        'chapter_label': _t(a['chapter_label'], lang),
        'hero': {
            'eyebrow': _t(a['hero']['eyebrow'], lang),
            'title_lines': _lines(a['hero']['title'], lang),
            'scroll': _t(a['hero']['scroll'], lang),
            'image': resolve(a['hero']['image'], _t(a['hero']['alt'], lang)),
        },
        'who': {
            'eyebrow': _t(a['who']['eyebrow'], lang),
            'title': _t(a['who']['title'], lang),
            'text': _t(a['who']['text'], lang),
            'image': resolve(a['who']['image'], _t(a['who']['alt'], lang)),
        },
        'what': {
            'title': _t(a['what']['title'], lang),
            'text': _t(a['what']['text'], lang),
            'link': _t(a['what']['link'], lang),
            'image': resolve(a['what']['image'], _t(a['what']['alt'], lang)),
            'services': [dict(by_slug[slug], icon=icon) for slug, icon in a['what']['services'] if slug in by_slug],
        },
        'how': {
            'eyebrow': _t(a['how']['eyebrow'], lang),
            'title_lines': _lines(a['how']['title'], lang),
            'steps': [{'number': f'{i:02d}', 'title': _t(s['title'], lang), 'text': _t(s['text'], lang)}
                      for i, s in enumerate(a['how']['steps'], start=1)],
            'note': _t(a['how']['note'], lang),
            'image': resolve(a['how']['image'], _t(a['how']['alt'], lang)),
        },
        'details': {
            'caption': _t(a['details']['caption'], lang),
            'images': [resolve(key, _t(alt, lang)) for key, alt in a['details']['images']],
        },
        'closing': {key: _t(value, lang) for key, value in a['closing'].items()},
    }

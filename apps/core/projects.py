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
    'comparison'  optional: the id of the project's design/reality comparison
                  in apps/core/vision.py, shown below the interactive gallery
    'concept'     optional {'note', 'images': [{'image', 'caption', 'alt'}, ...]}:
                  concept visualizations, a gallery on its own tab of the
                  interactive project page, with one note under it
    'thumbnail'   optional images.py key for the homepage thumbnail
    'cover'       optional images.py key for the homepage image (else the first photo)
    'layout'      optional: 'light' gives the project the "Follow the Light" page
                  (templates/core/project_light.html), with:
                    'moments'  five {'image': <a media image key>, 'label', 'text'}:
                               the photos joined by the scroll-lit line, in order
                    'groups'   [(id, label), ...]: the carousel's groups, in order;
                               every photo in 'media' has a 'group' and a 'caption'
    'focus'       optional crop focal point (CSS object-position) for the
                  homepage image

Photos: WebP files in static/images/site/, registered in images.py.
Films: MP4 (H.264) files in static/videos/, with a poster photo.

Text fields take one string (both languages) or {'en': ..., 'ar': ...}; a
missing 'ar' falls back to English.

Project 01 is the studio's real KK Barbershop; Project 02, the villa, is the
studio's own photographs too. Projects 03-04 are TEMPORARY:
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
        # The homepage's "From Vision to Reality" comparison for this project
        # (its id in apps/core/vision.py), shown again below the gallery.
        'comparison': 'kk-barbershop',
        'thumbnail': None,
        'focus': '50% 62%',
    },
    {
        # Project 02, the villa: the studio's photographs (static/images/Villa ( pictures )/).
        # Its own page: "Follow the Light" (templates/core/project_light.html) — five moments
        # joined by a scroll-lit line, then every photo in the "Explore the Villa" carousel.
        # Dimensions and materials are not stated: only what the photos show.
        'slug': 'project-2',
        'layout': 'light',
        # The name as the studio gives it (the same in both languages).
        'name': 'villa-New El Sheikh Zayed City',
        'work': {'en': 'Follow the light through the villa: from the chandelier in the stairwell to the terrace at dusk.',
                 'ar': 'اتبع الضوء عبر الفيلا: من النجفة في فراغ السلم حتى التراس عند الغروب.'},
        # Homepage image and thumbnail, and the Projects page group (media indexes):
        # the chandelier and staircase large, then the kitchen and the terrace.
        'cover': 'villa-4e987bed',
        'tiles': [11, 3, 29],
        # Carousel groups, in order (each photo's 'group').
        'groups': [
            ('entrance', {'en': 'Entrance & Reception', 'ar': 'المدخل والاستقبال'}),
            ('kitchen', {'en': 'Kitchen', 'ar': 'المطبخ'}),
            ('stairs', {'en': 'Staircase & Chandelier', 'ar': 'الدرج والنجفة'}),
            ('doors', {'en': 'Doors & Corridors', 'ar': 'الأبواب والممرات'}),
            ('bathrooms', {'en': 'Bathrooms', 'ar': 'الحمّامات'}),
            ('terrace', {'en': 'Terrace', 'ar': 'التراس'}),
        ],
        # "Follow the light.": the five moments, in order (photos from 'media'): the hero, then two
        # sections of two. The descriptions are the studio's approved copy.
        'moments': [
            {'image': 'villa-4e987bed', 'label': {'en': 'The Chandelier', 'ar': 'النجفة'},
             'text': {'en': 'A cascade of illuminated pendants draws the eye through the stairwell. Dark glass balustrades '
                            'and pale steps frame the light, turning the connection between floors into a defining feature '
                            'of the villa.',
                      'ar': 'تمتد وحدات الإضاءة المعلّقة عبر فراغ السلم، فتقود العين بين مستويات الفيلا. ويحيط بها الزجاج '
                            'الداكن والدرج الفاتح، ليصبح الانتقال بين الطوابق أحد أبرز ملامح المكان.'}},
            {'image': 'villa-63aed22b', 'label': {'en': 'The Kitchen', 'ar': 'المطبخ'},
             'text': {'en': 'Warm wood tones and illuminated glass cabinets bring depth to the kitchen, balanced by '
                            'understated grey cabinetry and dark worktops. Clean lines connect storage, display, and '
                            'preparation areas in one cohesive composition.',
                      'ar': 'تمنح درجات الخشب الدافئة ووحدات العرض الزجاجية المضيئة عمقًا للمطبخ، في توازن مع الخزائن '
                            'الرمادية وأسطح العمل الداكنة. وتربط الخطوط الواضحة بين التخزين والعرض والتحضير في تكوين '
                            'متناسق.'}},
            {'image': 'villa-a32d2d56', 'label': {'en': 'Stone & Light', 'ar': 'الخامة والضوء'},
             'text': {'en': 'Concealed lighting traces the recessed shelves, revealing the golden veining against a dark '
                            'surface. This close-up captures the meeting of texture, proportion, and light within a '
                            'carefully framed detail.',
                      'ar': 'تحدد الإضاءة المخفية الرفوف الغائرة، وتُبرز العروق الذهبية على السطح الداكن. وتكشف هذه '
                            'اللقطة القريبة عن التقاء الملمس والنِّسب والضوء داخل تفصيلة محددة الإطار.'}},
            {'image': 'villa-6cc5e965', 'label': {'en': 'The Bathroom', 'ar': 'الحمّام'},
             'text': {'en': 'Clear glass keeps the bathing area visually open, while contrasting stone tones define its '
                            'surfaces. Warm perimeter lighting and an illuminated niche bring a softer atmosphere to the '
                            'crisp geometry of the shower and bathtub.',
                      'ar': 'يحافظ الزجاج الشفاف على الانفتاح البصري لمنطقة الاستحمام، بينما تمنح درجات الأسطح الحجرية '
                            'المتباينة كل جزء حضوره. وتضيف الإضاءة المحيطية الدافئة والنيش المضيء هدوءًا إلى الخطوط '
                            'الواضحة للشاور وحوض الاستحمام.'}},
            {'image': 'villa-3e7ab2b8', 'label': {'en': 'The Terrace', 'ar': 'التراس'},
             'text': {'en': 'At dusk, the terrace opens onto a view of the surrounding homes and pool. A warm lantern in '
                            'the foreground meets the deep blue evening sky, bringing the villa’s journey through '
                            'light to a quiet close.',
                      'ar': 'مع حلول المساء، ينفتح التراس على مشهد المنازل المحيطة وحمام السباحة. ويلتقي الضوء الدافئ '
                            'للمصباح بزرقة السماء العميقة، لتختتم رحلة الضوء في الفيلا بلحظة هادئة.'}},
        ],
        'media': [
            # Entrance & reception: the entrance hall, the reception, the reception from the stairs.
            {'image': 'villa-44769fca', 'group': 'entrance',
             'caption': {'en': 'Entrance hall', 'ar': 'بهو المدخل'}, 'alt': {
                 'en': 'A wood-panelled hall leading to the front door, with the kitchen and a glass display cabinet on the left.',
                 'ar': 'ممر مكسو بالخشب يقود إلى باب المدخل، والمطبخ وخزانة عرض زجاجية على اليسار.'}},
            {'image': 'villa-396ea57f', 'group': 'entrance',
             'caption': {'en': 'Reception hall', 'ar': 'صالة الاستقبال'}, 'alt': {
                 'en': 'An open reception hall with two crystal chandeliers, track lights and tall windows.',
                 'ar': 'صالة استقبال مفتوحة بنجفتين من الكريستال وإضاءة مسارية ونوافذ طويلة.'}},
            {'image': 'villa-cf76fe9b', 'group': 'entrance',
             'caption': {'en': 'Reception from the stairs', 'ar': 'الاستقبال من الدرج'}, 'alt': {
                 'en': 'The reception hall seen past the glass balustrade of the stairs: a wood-clad wall, chandeliers and cove lighting.',
                 'ar': 'صالة الاستقبال من خلف درابزين الدرج الزجاجي: حائط مكسو بالخشب ونجفات وإضاءة مخفية.'}},
            # Kitchen: overall views, then the island, the cabinets, the details.
            {'image': 'villa-63aed22b', 'group': 'kitchen',
             'caption': {'en': 'Kitchen overview', 'ar': 'المطبخ'}, 'alt': {
                 'en': 'The kitchen: tall glass display cabinets lit from within, built-in appliances and a dark stone island with lines of light.',
                 'ar': 'المطبخ: خزائن عرض زجاجية طويلة مضاءة من الداخل، وأجهزة مدمجة، وجزيرة من الحجر الداكن بخطوط من الضوء.'}},
            {'image': 'villa-85018c79', 'group': 'kitchen',
             'caption': {'en': 'Kitchen from the island', 'ar': 'المطبخ من الجزيرة'}, 'alt': {
                 'en': 'The kitchen seen from the end of the island: grey cabinets, built-in ovens and lit cabinets along the ceiling.',
                 'ar': 'المطبخ من طرف الجزيرة: خزائن رمادية وأفران مدمجة وخزائن مضاءة على امتداد السقف.'}},
            {'image': 'villa-a530da02', 'group': 'kitchen',
             'caption': {'en': 'Island and ceiling light', 'ar': 'الجزيرة وإضاءة السقف'}, 'alt': {
                 'en': 'The kitchen island with lines of light reflected in its dark stone top, under a lit frame in the ceiling.',
                 'ar': 'جزيرة المطبخ وخطوط الضوء تنعكس على سطحها الحجري الداكن، أسفل إطار مضاء في السقف.'}},
            {'image': 'villa-50cac651', 'group': 'kitchen',
             'caption': {'en': 'Along the island', 'ar': 'بمحاذاة الجزيرة'}, 'alt': {
                 'en': 'Along the wood-faced kitchen island towards the window, with lit cabinets above.',
                 'ar': 'بمحاذاة جزيرة المطبخ المكسوة بالخشب نحو النافذة، والخزائن المضاءة في الأعلى.'}},
            {'image': 'villa-026ca8ba', 'group': 'kitchen',
             'caption': {'en': 'Display cabinets', 'ar': 'خزائن العرض'}, 'alt': {
                 'en': 'Lit wood and glass display cabinets beside the island, with the reception hall beyond.',
                 'ar': 'خزائن عرض مضاءة من الخشب والزجاج بجانب الجزيرة، وصالة الاستقبال في العمق.'}},
            {'image': 'villa-196fb278', 'group': 'kitchen',
             'caption': {'en': 'Counter corner', 'ar': 'ركن الرخامة'}, 'alt': {
                 'en': 'A corner of the kitchen counter in dark stone, with light lines in the ceiling and cabinets.',
                 'ar': 'ركن من رخامة المطبخ الحجرية الداكنة، وخطوط ضوء في السقف والخزائن.'}},
            {'image': 'villa-9b90c92c', 'group': 'kitchen',
             'caption': {'en': 'Oven column', 'ar': 'عمود الأفران'}, 'alt': {
                 'en': 'A built-in oven and microwave in grey cabinetry.',
                 'ar': 'فرن وميكروويف مدمجان في خزائن رمادية.'}},
            # Staircase and chandelier: the staircase, the chandelier, the stairwell, details.
            {'image': 'villa-ddba2016', 'group': 'stairs',
             'caption': {'en': 'Staircase', 'ar': 'الدرج'}, 'alt': {
                 'en': 'The staircase from the ground floor: light stone steps, a glass balustrade and pendant lights.',
                 'ar': 'الدرج من الطابق الأرضي: درجات من الحجر الفاتح ودرابزين زجاجي وإضاءة معلّقة.'}},
            {'image': 'villa-4e987bed', 'group': 'stairs',
             'caption': {'en': 'Chandelier and glass staircase', 'ar': 'النجفة والدرج الزجاجي'}, 'alt': {
                 'en': 'A cascading chandelier of lit links hanging through the stairwell, beside the glass balustrade.',
                 'ar': 'ثريا متدلية من حلقات مضيئة في بئر الدرج، بجانب الدرابزين الزجاجي.'}},
            {'image': 'villa-0449b0f4', 'group': 'stairs',
             'caption': {'en': 'Down the stairwell', 'ar': 'نظرة إلى أسفل الدرج'}, 'alt': {
                 'en': 'Looking down the stairwell past the chandelier and the glass balustrade.',
                 'ar': 'نظرة إلى أسفل بئر الدرج بجوار النجفة والدرابزين الزجاجي.'}},
            {'image': 'villa-1b473d43', 'group': 'stairs',
             'caption': {'en': 'Lit steps', 'ar': 'الدرجات المضاءة'}, 'alt': {
                 'en': 'Looking up the stairwell: each step lit from below.',
                 'ar': 'نظرة إلى أعلى بئر الدرج: كل درجة مضاءة من أسفلها.'}},
            {'image': 'villa-9d2616d8', 'group': 'stairs',
             'caption': {'en': 'Chandelier from below', 'ar': 'النجفة من أسفل'}, 'alt': {
                 'en': 'Looking up through the chandelier to the upper floors of the stairwell.',
                 'ar': 'نظرة إلى أعلى عبر النجفة نحو الطوابق العليا لبئر الدرج.'}},
            {'image': 'villa-bbf489ef', 'group': 'stairs',
             'caption': {'en': 'Chandelier detail', 'ar': 'تفاصيل النجفة'}, 'alt': {
                 'en': 'The lit links of the chandelier, close up.',
                 'ar': 'حلقات النجفة المضيئة عن قرب.'}},
            # Doors and corridors: the upper hall, the doors, a detail.
            {'image': 'villa-7750873b', 'group': 'doors',
             'caption': {'en': 'Upper hall', 'ar': 'الصالة العلوية'}, 'alt': {
                 'en': 'An upper hall with wood-clad doors, track lights and the glass balustrade of the stairs.',
                 'ar': 'صالة علوية بأبواب مكسوة بالخشب وإضاءة مسارية ودرابزين الدرج الزجاجي.'}},
            {'image': 'villa-8a3b7f60', 'group': 'doors',
             'caption': {'en': 'Doors on the landing', 'ar': 'الأبواب على البسطة'}, 'alt': {
                 'en': 'Tall wood doors with black inlays on the landing, beside the glass balustrade of the stairs.',
                 'ar': 'أبواب خشبية طويلة بتطعيمات سوداء على البسطة، بجانب درابزين الدرج الزجاجي.'}},
            {'image': 'villa-f7e821a2', 'group': 'doors',
             'caption': {'en': 'Wood doors', 'ar': 'الأبواب الخشبية'}, 'alt': {
                 'en': 'Two wood doors with a black vertical inlay, set in wood-clad walls.',
                 'ar': 'بابان خشبيان بتطعيم أسود رأسي في جدران مكسوة بالخشب.'}},
            {'image': 'villa-4fd6edc7', 'group': 'doors',
             'caption': {'en': 'Door detail', 'ar': 'تفاصيل باب'}, 'alt': {
                 'en': 'A door with a dark panel in a wood frame, in afternoon sunlight.',
                 'ar': 'باب بلوح داكن في إطار خشبي، في ضوء شمس العصر.'}},
            # Bathrooms: each bathroom's photos together, overall view first.
            {'image': 'villa-6cc5e965', 'group': 'bathrooms',
             'caption': {'en': 'Bathroom with bathtub and shower', 'ar': 'حمّام بحوض ودُش'}, 'alt': {
                 'en': 'A bathroom with a bathtub, a walk-in shower with a stone bench, a dark veined stone wall and lit niches.',
                 'ar': 'حمّام بحوض استحمام ودُش مفتوح بمقعد حجري، وحائط من حجر داكن معرّق وتجاويف مضاءة.'}},
            {'image': 'villa-c9a23790', 'group': 'bathrooms',
             'caption': {'en': 'Walk-in shower', 'ar': 'الدُش المفتوح'}, 'alt': {
                 'en': 'The walk-in shower of the same bathroom: a rain shower, a stone bench and a lit niche.',
                 'ar': 'الدُش المفتوح في الحمّام نفسه: دُش مطري ومقعد حجري وتجويف مضاء.'}},
            {'image': 'villa-a32d2d56', 'group': 'bathrooms',
             'caption': {'en': 'Lit stone niche', 'ar': 'تجويف حجري مضاء'}, 'alt': {
                 'en': 'The shower niche close up: dark veined stone lit along its edges.',
                 'ar': 'تجويف الدُش عن قرب: حجر داكن معرّق مضاء على امتداد حوافه.'}},
            {'image': 'villa-1504c80c', 'group': 'bathrooms',
             'caption': {'en': 'Bathroom with glass shower', 'ar': 'حمّام بدُش زجاجي'}, 'alt': {
                 'en': 'A bathroom with travertine-look walls, a glass shower with lit niches and a wall-hung toilet.',
                 'ar': 'حمّام بجدران تشبه الترافرتين، ودُش زجاجي بتجاويف مضاءة، ومرحاض معلّق.'}},
            {'image': 'villa-98b46f9a', 'group': 'bathrooms',
             'caption': {'en': 'Glass shower', 'ar': 'الدُش الزجاجي'}, 'alt': {
                 'en': 'The same bathroom from the vanity: the glass shower, lit niches and a wall-hung toilet.',
                 'ar': 'الحمّام نفسه من جهة الحوض: الدُش الزجاجي والتجاويف المضاءة والمرحاض المعلّق.'}},
            {'image': 'villa-a752bb03', 'group': 'bathrooms',
             'caption': {'en': 'Shower area', 'ar': 'منطقة الدُش'}, 'alt': {
                 'en': 'A shower area in light veined stone with a dark veined floor and a lit cove, with its fittings still exposed.',
                 'ar': 'منطقة دُش من حجر فاتح معرّق بأرضية داكنة معرّقة وإضاءة مخفية، وتجهيزاتها ما زالت ظاهرة.'}},
            {'image': 'villa-d5bc9550', 'group': 'bathrooms',
             'caption': {'en': 'Shower floor', 'ar': 'أرضية الدُش'}, 'alt': {
                 'en': 'The same shower area: the dark veined stone floor and the light walls.',
                 'ar': 'منطقة الدُش نفسها: الأرضية الحجرية الداكنة المعرّقة والجدران الفاتحة.'}},
            {'image': 'villa-47624f42', 'group': 'bathrooms',
             'caption': {'en': 'Washroom', 'ar': 'دورة مياه'}, 'alt': {
                 'en': 'A washroom in grey veined stone with a black toilet, a stone basin and a lit cove.',
                 'ar': 'دورة مياه من حجر رمادي معرّق بمرحاض أسود وحوض حجري وإضاءة مخفية.'}},
            {'image': 'villa-fe4b86ef', 'group': 'bathrooms',
             'caption': {'en': 'Bathroom with freestanding bath', 'ar': 'حمّام بحوض قائم'}, 'alt': {
                 'en': 'A bathroom with a freestanding bathtub, a glass shower screen and a dark wood-slat wall.',
                 'ar': 'حمّام بحوض استحمام قائم وحاجز دُش زجاجي وحائط من شرائح خشبية داكنة.'}},
            # Terrace.
            {'image': 'villa-3e7ab2b8', 'group': 'terrace',
             'caption': {'en': 'Terrace at night', 'ar': 'التراس ليلًا'}, 'alt': {
                 'en': 'The terrace at dusk: a lit lantern on the parapet, a black railing and the lights of the neighbourhood beyond.',
                 'ar': 'التراس عند الغسق: فانوس مضاء على السور، ودرابزين أسود، وأضواء الحي في الخلفية.'}},
        ],
        'thumbnail': 'villa-4e987bed',
        # Portrait photo in the homepage's landscape frame: the chandelier and the glass.
        'focus': '50% 42%',
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
    layout = project.get('layout') or ''
    for i, photo in enumerate(photos):
        photo['index'] = i  # position in the photo gallery
        photo['number'] = f'{i + 1:02d}'
    # The interactive gallery: every medium a captioned photo.
    interactive = not layout and bool(photos) and len(photos) == len(media) and all(p['caption'] for p in photos)
    if interactive:
        position = {item['image']: i for i, item in enumerate(project['media'])}
        for photo, item in zip(photos, project['media']):
            # 'edge': near the left or right edge the label opens inwards.
            photo['hotspots'] = [{'target': position[spot['to']], 'x': spot['x'], 'y': spot['y'],
                                  'label': photos[position[spot['to']]]['caption'],
                                  'edge': 'right' if spot['x'] > 70 else 'left' if spot['x'] < 30 else ''}
                                 for spot in item.get('hotspots', [])]
    concept = project.get('concept') if interactive else None
    light = _light(project, photos, lang) if layout == 'light' else None
    cover = project.get('cover')
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
        'image': resolve(cover, _text(next(i['alt'] for i in project['media'] if i.get('image') == cover), lang))
                 if cover else photos[0]['image'] if photos else None,
        'thumbnail': resolve(thumb_key) if thumb_key else None,
        # Projects page and project page.
        'media': media,
        'photos': photos,
        'tiles': tiles,
        'more': max(0, len([m for m in media if m['kind'] != 'placeholder'])
                    - len([t for t in tiles if t['kind'] != 'placeholder'])),
        'interactive': interactive,
        'layout': layout,
        'light': light,
        'comparison': project.get('comparison') if interactive else None,
        'concept': {'note': _text(concept.get('note'), lang),
                    'images': [{'image': resolve(item['image'], _text(item.get('alt'), lang)),
                                'caption': _text(item.get('caption'), lang), 'index': i, 'number': f'{i + 1:02d}'}
                               for i, item in enumerate(concept['images'])]} if concept else None,
        'index_url': index_url(project['slug'], lang),
        'detail_url': detail_url(project['slug'], lang),
    }


def _light(project, photos, lang):
    """The "Follow the Light" page: the five moments and the carousel's groups."""
    groups = [{'id': gid, 'label': _text(label, lang), 'photos': []} for gid, label in project['groups']]
    by_id = {g['id']: g for g in groups}
    position = {}
    for photo, item in zip(photos, [i for i in project['media'] if i.get('image')]):
        group = by_id[item['group']]
        photo['group'] = group['id']
        photo['group_label'] = group['label']
        photo['group_index'] = len(group['photos'])
        group['photos'].append(photo)
        position[item['image']] = photo
    for g in groups:
        g['first'] = g['photos'][0]['index']
        g['count'] = len(g['photos'])
    moments = []
    for n, m in enumerate(project['moments'], start=1):
        photo = position[m['image']]
        moments.append({'number': f'{n:02d}', 'total': f"{len(project['moments']):02d}",
                        'label': _text(m['label'], lang), 'text': _text(m.get('text'), lang), 'photo': photo,
                        'role': 'hero' if n == 1 else 'a' if n % 2 == 0 else 'b',
                        'landscape': photo['image']['width'] > photo['image']['height']})
    # The hero, then the others two by two (one section each).
    pairs = [moments[i:i + 2] for i in range(1, len(moments), 2)]
    return {'moments': moments, 'hero': moments[0], 'pairs': pairs, 'groups': groups}


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
        if project.get('comparison'):
            from . import vision
            if project['comparison'] not in [v.get('id') for v in vision.VISIONS]:
                problems.append(f"{slug!r}: comparison {project['comparison']!r} is not in vision.py")
        if project.get('cover') and project['cover'] not in keys:
            problems.append(f"{slug!r}: cover {project['cover']!r} is not one of its photos")
        if project.get('layout') == 'light':
            group_ids = [g for g, _ in project.get('groups', [])]
            order = [item.get('group') for item in media]
            if any(g not in group_ids for g in order) or not all(_text(i.get('caption'), 'en') for i in media):
                problems.append(f'{slug!r}: every photo needs a known group and a caption')
            elif order != sorted(order, key=group_ids.index):
                problems.append(f'{slug!r}: photos must follow the order of the groups')
            if len(project.get('moments', [])) != 5 or any(m.get('image') not in keys for m in project.get('moments', [])):
                problems.append(f'{slug!r}: needs five moments, each one of its photos')
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

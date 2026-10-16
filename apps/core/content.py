"""
Homepage copy for Gindi Innovations, in English and Arabic.

This is static content kept in code for Phase 1 (no database). Everything
marked PLACEHOLDER is temporary and must be replaced with copy, images and
details confirmed by the studio. See docs/content-placeholders.md.

Rules:
- Numbers are always Western digits (01, 02, 2026), in both languages.
- `image` is a key from images.py (with `alt` text alongside it); `None`
  renders a labelled image placeholder instead.
"""

# Header and footer menu, after "Home". The Process section stays on the
# homepage but is no longer in the menu; the Philosophy section was removed.
NAV_SECTIONS = ('projects', 'services', 'about', 'contact')

CONTENT = {
    'en': {
        'meta': {
            # PLACEHOLDER: page title and description to be confirmed.
            'title': 'Gindi Innovations — Interior Design Studio',
            'description': (
                'Gindi Innovations is an interior design studio serving clients '
                'in Egypt and internationally.'
            ),
        },
        'ui': {
            'skip': 'Skip to content',
            'home': 'Gindi Innovations — home',
            'menu_open': 'Open menu',
            'menu_close': 'Close menu',
            'menu': 'Menu',
            'primary_nav': 'Primary',
            'footer_nav': 'Footer',
            'switch_label': 'Language',
            'switch_to': 'العربية',
            'switch_hint': 'View this page in Arabic',
            'enquire': 'Enquire',
            'scroll': 'Scroll',
            'image_placeholder': 'Image placeholder',
            'illustrative': 'Illustrative image',
            'illustrative_note': 'Illustrative image — not a studio project',
            'rights': 'All rights reserved.',
            'back_to_top': 'Back to top',
        },
        'not_found': {
            'title': 'Page not found',
            'heading': 'This page could not be found.',
            'text': 'The link may be out of date, or the page may have moved.',
            'home': 'Back to home',
            'projects': 'View projects',
        },
        'nav': {
            'home': 'Home',
            'projects': 'Projects',
            'services': 'Services',
            'process': 'Process',
            'about': 'About',
            'contact': 'Contact',
        },
        'hero': {
            'eyebrow': 'Interior Design Studio',
            'location': 'Egypt — International',
            # PLACEHOLDER: temporary brand messaging.
            'title': 'Spaces composed<br>with quiet intention.',
            'lead': (
                'Interior architecture and design, considered from the first line '
                'to the final detail.'
            ),
            'cta_primary': 'Get Quotation',        # links to #contact
            'cta_secondary': 'Free Services',      # links to /free-tools/
            'image_label': 'Hero photograph',
            'image_spec': 'Landscape interior · min. 2560 px wide',
            'image': 'hero-desktop',
            'alt': '',
        },
        'projects': {
            # Labels only: the projects themselves live in apps/core/projects.py.
            'eyebrow': 'Featured Projects',
            'explore': 'Explore Project',
            'all': 'View All Projects',
            'previous': 'Previous project',
            'next': 'Next project',
            'show': 'Show project',
            'of': 'of',
            'thumbnails': 'Choose a project',
            'image_missing': 'Project image to be added',
        },
        'services_page': {
            # Services page (/services/). The services: apps/core/services.py.
            'meta_title': 'Services — Gindi Innovations',
            'meta_description': '2D design, 3D design, interior finishing and fit-out by Gindi Innovations.',
            'eyebrow': 'Our Services',
            'title': 'Expertise for every stage.',
            'lead': 'From the first plan to the final detail.',
            'discuss': 'Discuss Your Project',
            'hero_alt': 'Illustrative image: a warm interior with an arched doorway, a travertine floor and an ivory sofa.',
            'help': 'How we can help',
            'deliverables': 'Key deliverables',
            'enquire': 'Enquire About This Service',
            'related': 'View Related Projects',
            'tools_title': 'Plan with more clarity.',
            'tools_text': 'Free tools for an initial estimate, each based on your own details.',
            'ready_title': 'Ready to discuss your project?',
            'ready_text': 'Let’s turn your ideas into exceptional spaces.',
            'ready_cta': 'Get Quotation',
        },
        'enquiry': {
            # The enquiry drawer. It posts to settings.ENQUIRY_FORM_ACTION once set.
            'title': 'Enquire',
            'about': 'Enquiring about',
            'general': 'General enquiry',
            'name': 'Your name',
            'email': 'Email',
            'phone': 'Phone (optional)',
            'service': 'Service',
            'message': 'Tell us about your space',
            'send': 'Send enquiry',
            'close': 'Close',
            'required': 'Required',
            'not_connected': 'Online enquiries are not available yet, so this form cannot be sent.',
            'whatsapp': 'Chat with Us on WhatsApp',
            'whatsapp_service': 'Hello, I’d like to enquire about {service}.',
            'whatsapp_general': 'Hello, I’d like to enquire about your services.',
            'new_window': 'opens WhatsApp in a new window',
        },
        'tools_page': {
            # /free-tools/ and /free-tools/<slug>/. The tools: apps/core/tools.py.
            'meta_title': 'Free Tools — Gindi Innovations',
            'meta_description': 'Free estimators for wiring, tiles, bricks and cement. Coming soon.',
            'eyebrow': 'Free Tools',
            'title': 'Free tools',
            'lead': 'Initial estimates for your project, each based on your own details.',
            'all': 'All free tools',
            'start': 'Start Free Estimate',
            'status': 'Coming soon',
            'soon': 'This tool is being prepared and is not available yet. No estimate is calculated on this page for now.',
            'back': 'Back to Free Tools',
            'back_services': 'Back to Services',
        },
        'projects_page': {
            # Projects page and project pages. The projects: apps/core/projects.py.
            'meta_title': 'Projects — Gindi Innovations',
            'meta_description': 'Interior design projects by Gindi Innovations.',
            'eyebrow': 'Our Projects',
            'title': 'Spaces & Stories',
            'lead': 'Explore the spaces. Discover the details.',
            'view': 'View Project',
            'back': 'Back to Projects',
            'more': 'Photos',
            'more_label': 'more photos and films',
            'film': 'Project Film',
            'play': 'Play the project film',
            'photo_missing': 'Photo to be added',
            'scope': 'Scope of work',
            'gallery': 'Photos and films',
            'open_photo': 'Open photo',
            'of': 'of',
            'lightbox': 'Photo gallery',
            'close': 'Close',
            'previous': 'Previous photo',
            'next': 'Next photo',
            'cta_title': 'Have a project in mind?',
            'cta_text': 'Let’s create spaces that work beautifully for you.',
            'cta': 'Get Quotation',
        },
        'vision': {
            # Labels only: the project name and images live in apps/core/vision.py.
            'title': 'From Vision to Reality',
            'design': 'The Design',
            'reality': 'The Reality',
            'hint': 'Drag to reveal',
            'slider': 'Compare the design with the finished space',
            'design_short': 'design',
            'reality_short': 'reality',
            'design_missing': 'Design image unavailable',
            'reality_missing': 'Photograph unavailable',
        },
        'services': {
            'eyebrow': 'Services',
            'title': 'What the studio offers.',
            'all': 'All services',  # the services themselves: apps/core/services.py
        },
        'process': {
            'eyebrow': 'Process',
            # The studio's confirmed workflow (six steps, numbered 01–06 by the template).
            'title': 'From Our First Call to After Handover',
            'intro': 'We work through every stage with you—from understanding your needs and refining the '
                     'design to approving materials and completing the work.',
            'steps': [
                {'title': 'A Call & a Free Site Visit',
                 'text': 'We start with a call to learn about your property—whether it’s a house, villa, '
                         'apartment, or shop—and what you need. Then we arrange a free site visit to see the '
                         'space in person.'},
                {'title': 'Agreement & Initial Design',
                 'text': 'After the visit, we agree on the scope of work and begin designing around your needs, '
                         'preferences, and how you’ll use the space.'},
                {'title': 'Design Meetings & Revisions',
                 'text': 'We present the design, discuss your feedback, and work through revisions together '
                         'until you approve the final design.'},
                {'title': 'Materials & Price Approval',
                 'text': 'We source material options that suit the approved design and share their prices with '
                         'you. Every selection and its cost are reviewed with you before we purchase.'},
                {'title': 'Purchasing & Execution',
                 'text': 'Once you approve, we purchase the materials and carry out the agreed work, keeping you '
                         'involved as the project progresses.'},
                {'title': 'Handover & Follow-Up',
                 'text': 'Our involvement continues after handover. If you have any concerns about the completed '
                         'work, we review them with you and follow through on the adjustments.'},
            ],
        },
        'about': {
            'eyebrow': 'About the Studio',
            'title': 'Gindi Innovations',
            # Homepage "Gindi Innovations" section text (two paragraphs).
            'paragraphs': [
                'At Gindi Innovations, we create spaces that balance character, comfort, and functionality. '
                'Our services cover 2D design, 3D visualization, interior finishing, and fit-out, connecting '
                'the initial idea with the details that bring it to life.',
                'We start by understanding your needs and how you use your space, then develop a clear direction '
                'for the layout, materials, and finishes. Whether you need design support or execution, we shape '
                'our involvement around the agreed scope of your project.',
            ],
            'image': 'about',
            'alt': 'Illustrative image: travertine, oak, walnut, linen and bouclé samples beside architectural drawings on an oak table.',
            'image_label': 'Studio or founder portrait',
            'image_spec': 'Portrait · 3:4',
            'more': 'More About Us',  # links to /about/
        },
        'contact': {
            'eyebrow': 'Contact',
            'title': 'Let’s begin with a conversation.',
            'intro': 'Share a little about your space and what you imagine for it.',
            # Real contact details only, e.g. {'label': 'Email', 'value': '…'}. While
            # the list is empty (none confirmed yet) neither the Contact section nor
            # the footer shows a details block. 'social': a confirmed link text.
            'details': [],
            'social_label': 'Follow',
            'social': '',
        },
        'footer': {
            'tagline': 'Interior design studio · Egypt — International',
        },
    },

    'ar': {
        'meta': {
            # PLACEHOLDER: page title and description to be confirmed.
            'title': 'Gindi Innovations — استوديو تصميم داخلي',
            'description': 'Gindi Innovations استوديو للتصميم الداخلي يخدم عملاءه في مصر وخارجها.',
        },
        'ui': {
            'skip': 'انتقل إلى المحتوى',
            'home': 'Gindi Innovations — الصفحة الرئيسية',
            'menu_open': 'فتح القائمة',
            'menu_close': 'إغلاق القائمة',
            'menu': 'القائمة',
            'primary_nav': 'التنقل الرئيسي',
            'footer_nav': 'روابط التذييل',
            'switch_label': 'اللغة',
            'switch_to': 'English',
            'switch_hint': 'عرض هذه الصفحة بالإنجليزية',
            'enquire': 'تواصل معنا',
            'scroll': 'مرّر',
            'image_placeholder': 'مكان مخصّص لصورة',
            'illustrative': 'صورة توضيحية',
            'illustrative_note': 'صورة توضيحية — ليست من مشاريع الاستوديو',
            'rights': 'جميع الحقوق محفوظة.',
            'back_to_top': 'العودة إلى الأعلى',
        },
        'not_found': {
            'title': 'الصفحة غير موجودة',
            'heading': 'تعذّر العثور على هذه الصفحة.',
            'text': 'ربما أصبح الرابط قديمًا، أو نُقلت الصفحة إلى مكان آخر.',
            'home': 'العودة إلى الرئيسية',
            'projects': 'عرض المشاريع',
        },
        'nav': {
            'home': 'الرئيسية',
            'projects': 'المشاريع',
            'services': 'الخدمات',
            'process': 'منهجية العمل',
            'about': 'عن الاستوديو',
            'contact': 'تواصل',
        },
        'hero': {
            'eyebrow': 'استوديو تصميم داخلي',
            'location': 'مصر — دوليًا',
            # PLACEHOLDER: temporary brand messaging.
            'title': 'مساحات تُصاغ<br>بهدوء ووعي.',
            'lead': 'عمارة داخلية وتصميم يُعنى بكل تفصيلة، من الخط الأول حتى اللمسة الأخيرة.',
            'cta_primary': 'اطلب عرض سعر',
            'cta_secondary': 'خدمات مجانية',
            'image_label': 'صورة الواجهة الرئيسية',
            'image_spec': 'صورة أفقية لمساحة داخلية · بعرض 2560 بكسل على الأقل',
            'image': 'hero-desktop',
            'alt': '',
        },
        'projects': {
            # Labels only: the projects themselves live in apps/core/projects.py.
            'eyebrow': 'مشاريع مميّزة',
            'explore': 'استكشف المشروع',
            'all': 'عرض كل المشاريع',
            'previous': 'المشروع السابق',
            'next': 'المشروع التالي',
            'show': 'اعرض المشروع',
            'of': 'من',
            'thumbnails': 'اختر مشروعًا',
            'image_missing': 'ستُضاف صورة المشروع',
        },
        'services_page': {
            # Services page (/services/). The services: apps/core/services.py.
            'meta_title': 'الخدمات — Gindi Innovations',
            'meta_description': 'التصميم ثنائي وثلاثي الأبعاد والتشطيبات الداخلية والتجهيز من Gindi Innovations.',
            'eyebrow': 'خدماتنا',
            'title': 'خبرة في كل مرحلة.',
            'lead': 'من المخطط الأول حتى آخر تفصيلة.',
            'discuss': 'ناقش مشروعك',
            'hero_alt': 'صورة توضيحية: مساحة داخلية دافئة بمدخل مقوّس وأرضية من الترافرتين وأريكة بلون العاج.',
            'help': 'كيف نساعدك',
            'deliverables': 'أبرز المخرجات',
            'enquire': 'استفسر عن هذه الخدمة',
            'related': 'عرض المشاريع المرتبطة',
            'tools_title': 'خطّط بوضوح أكبر.',
            'tools_text': 'أدوات مجانية لتقدير مبدئي، كلٌّ منها بناءً على تفاصيلك.',
            'ready_title': 'هل أنت مستعد لمناقشة مشروعك؟',
            'ready_text': 'لنحوّل أفكارك إلى مساحات استثنائية.',
            'ready_cta': 'اطلب عرض سعر',
        },
        'enquiry': {
            # The enquiry drawer. It posts to settings.ENQUIRY_FORM_ACTION once set.
            'title': 'استفسار',
            'about': 'الاستفسار عن',
            'general': 'استفسار عام',
            'name': 'الاسم',
            'email': 'البريد الإلكتروني',
            'phone': 'الهاتف (اختياري)',
            'service': 'الخدمة',
            'message': 'حدّثنا عن مساحتك',
            'send': 'إرسال الاستفسار',
            'close': 'إغلاق',
            'required': 'مطلوب',
            'not_connected': 'إرسال الاستفسارات عبر الموقع غير متاح بعد، لذا لا يمكن إرسال هذا النموذج.',
            'whatsapp': 'تواصل معنا عبر واتساب',
            'whatsapp_service': 'مرحبًا، أودّ الاستفسار عن {service}.',
            'whatsapp_general': 'مرحبًا، أودّ الاستفسار عن خدماتكم.',
            'new_window': 'يفتح واتساب في نافذة جديدة',
        },
        'tools_page': {
            # /free-tools/ and /free-tools/<slug>/. The tools: apps/core/tools.py.
            'meta_title': 'الأدوات المجانية — Gindi Innovations',
            'meta_description': 'حاسبات مجانية للأسلاك والبلاط والطوب والأسمنت. قريبًا.',
            'eyebrow': 'أدوات مجانية',
            'title': 'الأدوات المجانية',
            'lead': 'تقديرات مبدئية لمشروعك، كلٌّ منها بناءً على تفاصيلك.',
            'all': 'كل الأدوات المجانية',
            'start': 'ابدأ التقدير المجاني',
            'status': 'قريبًا',
            'soon': 'يجري إعداد هذه الأداة وهي غير متاحة بعد. لا تُحسب أي تقديرات في هذه الصفحة حاليًا.',
            'back': 'العودة إلى الأدوات المجانية',
            'back_services': 'العودة إلى الخدمات',
        },
        'projects_page': {
            # Projects page and project pages. The projects: apps/core/projects.py.
            'meta_title': 'المشاريع — Gindi Innovations',
            'meta_description': 'مشاريع التصميم الداخلي من Gindi Innovations.',
            'eyebrow': 'مشاريعنا',
            'title': 'مساحات وحكايات',
            'lead': 'استكشف المساحات، واكتشف التفاصيل.',
            'view': 'عرض المشروع',
            'back': 'العودة إلى المشاريع',
            'more': 'صور',
            'more_label': 'صور وأفلام أخرى',
            'film': 'فيلم المشروع',
            'play': 'شغّل فيلم المشروع',
            'photo_missing': 'ستُضاف الصورة',
            'scope': 'نطاق العمل',
            'gallery': 'الصور والأفلام',
            'open_photo': 'افتح الصورة',
            'of': 'من',
            'lightbox': 'معرض الصور',
            'close': 'إغلاق',
            'previous': 'الصورة السابقة',
            'next': 'الصورة التالية',
            'cta_title': 'لديك مشروع في ذهنك؟',
            'cta_text': 'لنصمّم معًا مساحات تعمل بجمال من أجلك.',
            'cta': 'اطلب عرض سعر',
        },
        'vision': {
            # Labels only: the project name and images live in apps/core/vision.py.
            'title': 'من الرؤية إلى الواقع',
            'design': 'التصميم',
            'reality': 'الواقع',
            'hint': 'اسحب للكشف',
            'slider': 'قارن التصميم بالمساحة بعد التنفيذ',
            'design_short': 'التصميم',
            'reality_short': 'الواقع',
            'design_missing': 'صورة التصميم غير متاحة',
            'reality_missing': 'صورة التنفيذ غير متاحة',
        },
        'services': {
            'eyebrow': 'الخدمات',
            'title': 'ما يقدّمه الاستوديو.',
            'all': 'كل الخدمات',  # the services themselves: apps/core/services.py
        },
        'process': {
            'eyebrow': 'منهجية العمل',
            # The studio's confirmed workflow (six steps, numbered 01–06 by the template).
            'title': 'من أول اتصال حتى ما بعد التسليم',
            'intro': 'نرافقك في كل مرحلة، من فهم احتياجاتك وتطوير التصميم إلى اعتماد الخامات وإنجاز الأعمال.',
            'steps': [
                {'title': 'اتصال وزيارة مجانية للموقع',
                 'text': 'نبدأ باتصال نتعرّف فيه على عقارك، سواء كان منزلًا أو فيلا أو شقة أو محلًا، وعلى ما '
                         'تحتاج إليه. ثم نرتّب زيارة مجانية للموقع لنعاين المساحة على أرض الواقع.'},
                {'title': 'الاتفاق والتصميم المبدئي',
                 'text': 'بعد الزيارة نتفق على نطاق العمل، ونبدأ التصميم وفق احتياجاتك وتفضيلاتك وطريقة '
                         'استخدامك للمساحة.'},
                {'title': 'اجتماعات التصميم والتعديلات',
                 'text': 'نعرض عليك التصميم ونناقش ملاحظاتك، ونُجري التعديلات معًا حتى تعتمد التصميم النهائي.'},
                {'title': 'اعتماد الخامات والأسعار',
                 'text': 'نوفّر خيارات من الخامات تناسب التصميم المعتمد ونطلعك على أسعارها، ونراجع معك كل '
                         'اختيار وتكلفته قبل الشراء.'},
                {'title': 'الشراء والتنفيذ',
                 'text': 'بعد موافقتك نشتري الخامات وننفّذ الأعمال المتفق عليها، ونُشركك في سير العمل مع تقدّم '
                         'المشروع.'},
                {'title': 'التسليم والمتابعة',
                 'text': 'لا ينتهي دورنا عند التسليم؛ فإن كانت لديك أي ملاحظات على الأعمال المنفّذة، نراجعها '
                         'معك ونتابع تنفيذ التعديلات اللازمة.'},
            ],
        },
        'about': {
            'eyebrow': 'عن الاستوديو',
            'title': 'Gindi Innovations',
            # Homepage "Gindi Innovations" section text (two paragraphs).
            'paragraphs': [
                'في Gindi Innovations نصمّم مساحات توازن بين الطابع والراحة والوظيفة. تشمل خدماتنا التصميم ثنائي '
                'الأبعاد والتصور ثلاثي الأبعاد والتشطيبات الداخلية والتجهيز، لنربط الفكرة الأولى بالتفاصيل التي '
                'تمنحها الحياة.',
                'نبدأ بفهم احتياجاتك وطريقة استخدامك لمساحتك، ثم نضع توجهًا واضحًا للتوزيع والخامات والتشطيبات. '
                'وسواء احتجت إلى دعم في التصميم أو إلى التنفيذ، نحدّد دورنا وفق النطاق المتفق عليه لمشروعك.',
            ],
            'image': 'about',
            'alt': 'صورة توضيحية: عيّنات من الترافرتين والبلوط والجوز والكتان والبوكليه بجوار رسومات معمارية على طاولة من خشب البلوط.',
            'image_label': 'صورة للاستوديو أو المؤسس',
            'image_spec': 'عمودية · 3:4',
            'more': 'المزيد عنّا',  # links to /about/
        },
        'contact': {
            'eyebrow': 'تواصل',
            'title': 'لنبدأ بحديث.',
            'intro': 'حدّثنا قليلًا عن مساحتك وما تتخيّله لها.',
            # Real contact details only (see the English block); empty: not shown.
            'details': [],
            'social_label': 'تابعنا',
            'social': '',
        },
        'footer': {
            'tagline': 'استوديو تصميم داخلي · مصر — دوليًا',
        },
    },
}

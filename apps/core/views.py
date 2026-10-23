from django.conf import settings
from django.http import Http404, HttpResponseServerError
from django.shortcuts import redirect, render
from django.template import loader
from django.templatetags.static import static
from django.urls import reverse

from . import about, emblem, projects, services, studio, tools, vision
from .content import CONTENT, NAV_SECTIONS
from .images import resolve, resolve_content

LANGUAGES = {
    'en': {'dir': 'ltr', 'url_name': 'core:home', 'suffix': ''},
    'ar': {'dir': 'rtl', 'url_name': 'core:home_ar', 'suffix': '_ar'},
}


def _context(lang, page, view, kwargs=None):
    """What every page shares: language, navigation, and the URL of this same
    page in the other language. `view` is the URL name without the language
    suffix ('core:projects'); on pages other than the homepage, section links
    in the header and footer point back to the homepage."""
    other = 'ar' if lang == 'en' else 'en'
    home_url = reverse(LANGUAGES[lang]['url_name'])
    suffix = LANGUAGES[lang]['suffix']
    nav_base = '' if page == 'home' else home_url
    # Sections with their own page: link there (marked current on it and on
    # its sub-pages). On the homepage, Projects stays an in-page link.
    own_pages = {
        'projects': (reverse('core:projects' + suffix), {'projects': 'page', 'project': 'true'}),
        'services': (reverse('core:services' + suffix), {'services': 'page', 'free_tools': 'true', 'free_tool': 'true'}),
        'about': (reverse('core:about' + suffix), {'about': 'page'}),
        'contact': (reverse('core:contact' + suffix), {'contact': 'page'}),
    }
    # "Home" first: the top of the homepage from anywhere.
    nav = [{'id': 'home', 'label': CONTENT[lang]['nav']['home'], 'href': '#top' if page == 'home' else home_url,
            'current': '', 'section': False}]
    for section in NAV_SECTIONS:
        if section == 'projects' and not projects.PUBLISHED:
            continue  # no verified projects yet: no link to the section or the pages
        label = CONTENT[lang]['nav'][section]
        if section in own_pages and not (section == 'projects' and page == 'home'):
            href, current = own_pages[section]
            nav.append({'id': section, 'label': label, 'href': href, 'current': current.get(page, ''), 'section': False})
        else:
            nav.append({'id': section, 'label': label, 'href': f'{nav_base}#{section}', 'current': '', 'section': True})
    return {
        'lang': lang,
        'dir': LANGUAGES[lang]['dir'],
        'page': page,
        'other_lang': other,
        'other_url_name': LANGUAGES[other]['url_name'],
        'other_url': reverse(view + LANGUAGES[other]['suffix'], kwargs=kwargs),
        'page_url': reverse(view + LANGUAGES[lang]['suffix'], kwargs=kwargs),
        'alternate': {code: reverse(view + LANGUAGES[code]['suffix'], kwargs=kwargs) for code in LANGUAGES},
        'url_name': LANGUAGES[lang]['url_name'],
        'nav_base': nav_base,
        'projects_url': own_pages['projects'][0],
        'services_url': own_pages['services'][0],
        'about_url': own_pages['about'][0],
        'contact_url': own_pages['contact'][0],
        'tools_url': reverse('core:free_tools' + suffix),
        'nav': nav,
        'show_projects': projects.PUBLISHED,
        # Quotation form destinations (partials/quote_drawer.html); empty = not configured.
        'quote_email': settings.QUOTATION_EMAIL,
        'quote_whatsapp': settings.WHATSAPP_NUMBER,
        # The site's own form backend (static/js/form-backend.js); None = not configured.
        'forms_backend': _forms_backend(lang),
        'site_noindex': settings.SITE_NOINDEX,
    }


def _forms_backend(lang):
    """Where the forms send and the public Turnstile key, with the forms'
    status texts. None unless both settings are set."""
    if not (settings.CONTACT_API_URL and settings.TURNSTILE_SITE_KEY):
        return None
    return {'url': settings.CONTACT_API_URL, 'sitekey': settings.TURNSTILE_SITE_KEY,
            'lang': lang, 'texts': CONTENT[lang]['forms']}


# Homepage sections with a number in their heading, in page order. Projects,
# when published, comes first (as 01) and is numbered by its own layout.
NUMBERED_SECTIONS = ('services', 'process', 'about')


def _section_numbers():
    first = 2 if projects.PUBLISHED else 1
    return {name: f'{first + i:02d}' for i, name in enumerate(NUMBERED_SECTIONS)}


def home(request, lang='en'):
    """Static homepage. The language comes from the URL (/ or /ar/), and the
    copy from content.py; this is not Django's gettext-based i18n."""
    content = resolve_content(CONTENT[lang])
    content['hero']['image_mobile'] = resolve('hero-mobile')
    context = _context(lang, 'home', 'core:home')
    context.update({
        'c': content,
        'emblem': emblem.context(),
        'projects': projects.for_language(lang) if projects.PUBLISHED else [],
        'services': services.for_language(lang),
        'tools': tools.for_language(lang),  # "Free Services" in the Services section
        'visions': vision.for_language(lang),  # complete entries only
        'studio_invite': {
            'url': reverse('core:design_studio' + LANGUAGES[lang]['suffix']),
            'styles': [{'name': s['name'], 'preview': studio.style_preview(s['id'])} for s in studio.for_language(lang)],
        },
        'nums': _section_numbers(),
    })
    return render(request, 'core/home.html', context)


def projects_index(request, lang='en'):
    """All projects, each with its editorial group of photos (/projects/).
    Not public until projects.PUBLISHED (no verified projects yet)."""
    if not projects.PUBLISHED:
        raise Http404('Projects are not published')
    context = _context(lang, 'projects', 'core:projects')
    context.update({'c': CONTENT[lang], 'projects': projects.for_language(lang)})
    return render(request, 'core/projects.html', context)


def project_detail(request, slug, lang='en'):
    """One project with all its photos and films (/projects/<slug>/)."""
    project = projects.get(slug, lang) if projects.PUBLISHED else None
    if project is None:
        raise Http404('No such project')
    context = _context(lang, 'project', 'core:project', {'slug': slug})
    # Its "From Vision to Reality" pair, the same entry as on the homepage.
    comparison = next((v for v in vision.for_language(lang) if v['id'] == project['comparison']), None) \
        if project.get('comparison') else None
    context.update({'c': CONTENT[lang], 'project': project, 'comparison': comparison})
    # A project with its own page design (projects.py 'layout'), e.g. the villa's "Follow the Light".
    template = 'core/project_light.html' if project['layout'] == 'light' else 'core/project_detail.html'
    return render(request, template, context)


def about_page(request, lang='en'):
    """About Gindi (/about/): hero, three chapters, details, closing enquiry.
    Content: apps/core/about.py."""
    from urllib.parse import quote

    service_list = services.for_language(lang)
    content = about.for_language(lang, service_list)
    whatsapp = settings.WHATSAPP_NUMBER
    context = _context(lang, 'about', 'core:about')
    context.update({
        'c': CONTENT[lang],
        'about': content,
        'services': service_list,  # enquiry drawer options
        'enquiry_action': settings.ENQUIRY_FORM_ACTION,
        'whatsapp_number': whatsapp,
        'whatsapp_url': f"https://wa.me/{whatsapp}?text={quote(content['closing']['whatsapp_message'])}" if whatsapp else '',
    })
    return render(request, 'core/about.html', context)


def services_page(request, lang='en'):
    """All services as an accordion, with the enquiry drawer (/services/)."""
    context = _context(lang, 'services', 'core:services')
    context.update({
        'c': CONTENT[lang],
        'services': services.for_language(lang),
        'tools': tools.for_language(lang),
        'emblem': emblem.context(),  # the monogram watermark in the planning-tools band
        'enquiry_action': settings.ENQUIRY_FORM_ACTION,
        'whatsapp_number': settings.WHATSAPP_NUMBER,
    })
    return render(request, 'core/services.html', context)


def design_studio(request, lang='en'):
    """GINDI Design Studio (/design-studio/): three styles, each one fixed
    concept image whose upholstery, stone and wood can be changed. Catalogue
    and assets: apps/core/studio.py; compositor and page: static/studio/.
    Only styles whose files all exist are offered."""
    content = CONTENT[lang]
    page = content['studio_page']
    styles = studio.for_language(lang)
    context = _context(lang, 'design_studio', 'core:design_studio')
    context.update({
        'c': content,
        'styles': styles,
        'studio_data': {
            'lang': lang,
            'styles': styles,
            'quiz': studio.quiz_for_language(lang),
            'contact_url': reverse('core:contact' + LANGUAGES[lang]['suffix']),
            'logo': static('images/brand/gindi-logo.png'),
            'labels': {
                **{k: page[k] for k in (
                    'selected', 'custom', 'copied', 'copy_failed', 'canvas_label', 'message', 'loading_material',
                    'saving', 'saved', 'save_failed', 'board', 'quiz', 'legacy_link')},
                'presets': page['presets'], 'reference': page['reference'],
            },
        },
    })
    return render(request, 'core/design_studio.html', context)


def contact_page(request, lang='en'):
    """Contact Us (/contact/): the brand panel and the project enquiry form.
    The form works like the quotation form (same lists, rules and script):
    the visitor sends the enquiry from their own email app or WhatsApp, to
    settings.QUOTATION_EMAIL / settings.WHATSAPP_NUMBER. Copy: content.py
    (contact_page, quote)."""
    content = CONTENT[lang]
    page = content['contact_page']
    texts = dict(content['quote']['js'], subject=page['js']['subject'])
    texts['errors'] = {**content['quote']['js']['errors'], **page['js']['errors']}
    texts['message'] = {**content['quote']['js']['message'], **page['js']['message']}
    context = _context(lang, 'contact', 'core:contact')
    context.update({'c': content, 'contact_texts': texts})
    return render(request, 'core/contact.html', context)


def free_tools(request, lang='en'):
    """Overview of the free tools (/free-tools/)."""
    context = _context(lang, 'free_tools', 'core:free_tools')
    context.update({'c': CONTENT[lang], 'tools': tools.for_language(lang)})
    return render(request, 'core/free_tools.html', context)


def free_tool(request, slug, lang='en'):
    """One free calculator's page (/free-tools/<slug>/). The calculator itself
    runs in the browser: static/js/tools/<slug>.js on <slug>-calc.js."""
    tool = tools.get(slug, lang)
    if tool is None:
        raise Http404('No such tool')
    context = _context(lang, 'free_tool', 'core:free_tool', {'slug': slug})
    context.update({'c': CONTENT[lang], 'tool': tool})
    return render(request, 'core/free_tool.html', context)


# Site plumbing: robots.txt, favicon and error pages.

def robots_txt(request):
    """robots.txt. While SITE_NOINDEX is on, crawling stays allowed on purpose:
    a crawler blocked by robots.txt never sees the noindex rule on the pages."""
    return render(request, 'robots.txt', {'noindex': settings.SITE_NOINDEX}, content_type='text/plain')


def favicon(request):
    """Browsers request /favicon.ico regardless of the <link rel="icon">."""
    return redirect(static('images/brand/favicon-g-32.png'))


def page_not_found(request, exception):
    """Branded 404 (handler404), in the language of the requested URL."""
    lang = 'ar' if request.path.startswith('/ar/') else 'en'
    context = _context(lang, 'error', 'core:home')
    context.update({'c': CONTENT[lang]})
    return render(request, 'core/404.html', context, status=404)


def server_error(request):
    """Branded 500 (handler500). Self-contained on purpose: no database, no
    shared context, no static files, so it renders even when those fail."""
    return HttpResponseServerError(loader.get_template('500.html').render())

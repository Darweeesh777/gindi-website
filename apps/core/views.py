from django.conf import settings
from django.http import Http404, HttpResponseServerError
from django.shortcuts import redirect, render
from django.template import loader
from django.templatetags.static import static
from django.urls import reverse

from . import about, emblem, projects, services, tools, vision
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
        'tools_url': reverse('core:free_tools' + suffix),
        'nav': nav,
        'show_projects': projects.PUBLISHED,
        'site_noindex': settings.SITE_NOINDEX,
    }


# Homepage sections with a number in their heading, in page order. Projects,
# when published, comes first (as 01) and is numbered by its own layout.
NUMBERED_SECTIONS = ('services', 'process', 'about', 'contact')


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
        'vision': vision.for_language(lang),
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
    context.update({'c': CONTENT[lang], 'project': project})
    return render(request, 'core/project_detail.html', context)


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
        'hero_image': resolve('hero-desktop', CONTENT[lang]['services_page']['hero_alt']),
        'enquiry_action': settings.ENQUIRY_FORM_ACTION,
        'whatsapp_number': settings.WHATSAPP_NUMBER,
    })
    return render(request, 'core/services.html', context)


def free_tools(request, lang='en'):
    """Overview of the free tools (/free-tools/)."""
    context = _context(lang, 'free_tools', 'core:free_tools')
    context.update({'c': CONTENT[lang], 'tools': tools.for_language(lang)})
    return render(request, 'core/free_tools.html', context)


def free_tool(request, slug, lang='en'):
    """One free tool's page: the integration area for its own agent, 'Coming
    soon' until its script is set in settings.FREE_TOOL_SCRIPTS
    (/free-tools/<slug>/)."""
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
    return redirect(static('images/brand/favicon-32.png'))


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

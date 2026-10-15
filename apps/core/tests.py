import re

from django.test import SimpleTestCase
from django.urls import reverse

SECTION_ORDER = ['top', 'projects', 'vision', 'services', 'process', 'about', 'contact']


class HomepageTests(SimpleTestCase):
    def get(self, name):
        response = self.client.get(reverse(name))
        self.assertEqual(response.status_code, 200)
        return response.content.decode()

    def test_english_is_default_and_ltr(self):
        html = self.get('core:home')
        self.assertIn('<html lang="en" dir="ltr"', html)
        self.assertIn('href="/ar/"', html)  # language switch

    def test_arabic_is_rtl_and_uses_english_logo(self):
        html = self.get('core:home_ar')
        self.assertIn('<html lang="ar" dir="rtl"', html)
        self.assertIn('images/brand/gindi-logo.png', html)
        self.assertIn('images/brand/gindi-monogram.png', html)
        self.assertIn('IBM+Plex+Sans+Arabic', html)

    def test_sections_in_approved_order(self):
        for name in ('core:home', 'core:home_ar'):
            html = self.get(name)
            positions = [html.index(f'id="{section}"') for section in SECTION_ORDER]
            self.assertEqual(positions, sorted(positions), name)
            self.assertLess(html.index('id="contact"'), html.index('<footer'))

    def test_arabic_page_uses_western_digits_only(self):
        html = self.get('core:home_ar')
        self.assertIsNone(re.search('[٠-٩۰-۹]', html))
        self.assertIn('>01<', html)

    def test_images_are_responsive_and_labelled_illustrative(self):
        from django.contrib.staticfiles import finders

        from .images import IMAGES

        for entry in IMAGES.values():
            for width in entry['widths']:
                self.assertTrue(finders.find(f"images/site/{entry['name']}-{width}.webp"), entry['name'])
        for name, label in (('core:home', 'Illustrative image'), ('core:home_ar', 'صورة توضيحية')):
            html = self.get(name)
            self.assertIn('<source media="(orientation: portrait)"', html)
            self.assertEqual(html.count('class="media__tag"'), 5)  # 4 projects + about
            self.assertIn(label, html)
            self.assertNotIn('{#', html)  # no template comments leaking into the page

    def test_hero_is_the_original(self):
        html = self.get('core:home')
        hero = html[html.index('id="top"'):html.index('id="projects"')]
        self.assertIn('class="hero__eyebrow label hero-intro" style="--i: 0"', hero)
        self.assertIn('Spaces composed<br>with quiet intention.', hero)
        self.assertIn('class="hero__actions hero-intro" style="--i: 3"', hero)
        # Concept 05 CTAs, linked to existing sections only.
        self.assertIn('<a class="btn hero__quote" href="#contact">Get Quotation</a>', hero)
        self.assertIn('<a class="link-arrow hero__services" href="/free-tools/">Free Services', hero)
        self.assertIn('images/site/hero-desktop-1672.webp', hero)
        self.assertIn('data-parallax', hero)
        # None of the later experiments.
        for experiment in ('hero-scene', 'hero-reveal', 'data-hero-assembly', 'data-hero-reveal', 'emblem', '<mask'):
            self.assertNotIn(experiment, hero)

    def test_emblem_reveal_only_in_gindi_innovations(self):
        from .emblem import paths

        p = paths()
        for name in ('core:home', 'core:home_ar'):
            html = self.get(name)
            about = html[html.index('id="about"'):html.index('id="contact"')]
            self.assertEqual(html.count('data-emblem-reveal'), 1)
            self.assertIn('data-emblem-reveal', about)
            self.assertIn('id="about-title" data-reveal>Gindi Innovations</h2>', about)
            # Visible emblem: outline only, drawn with dashes. Filled shape: mask only.
            self.assertIn('class="emblem-reveal__outline"', about)
            self.assertIn('fill="none"', about)
            for key in ('main', 'arm', 'keystone'):
                self.assertIn(f'<path d="{p[key]}" pathLength="1" data-emblem-draw="{key}">', about)
            self.assertIn('<mask id="emblem-mask"', about)
            self.assertIn('images/site/about-studio-materials-1086.webp', about)
            self.assertIn('js/emblem-reveal.js', html)
            # The reveal traces the original emblem, not the generated transparent
            # variant (which Projects uses, as requested, only as a faint watermark).
            self.assertNotIn('monogram-transparent', about)
            for unused in ('-layer', 'hero-assembly', 'hero-reveal'):
                self.assertNotIn(unused, html)

    def test_emblem_geometry(self):
        import math

        from .emblem import (CX, CY, R_IN, R_OUT, _keystone_meets, _keystone_side, _point, paths,
                             window_end, window_start)

        # Where the keystone cuts the band, each corner lies on its arch circle
        # and on the keystone's side, and the paths use exactly those corners.
        body = paths()['main'] + paths()['arm']
        for radius in (R_IN, R_OUT):
            for side in (0, 1):
                x, y = _keystone_meets(radius, side)
                self.assertAlmostEqual(math.hypot(x - CX, y - CY), radius, places=2)
                self.assertAlmostEqual(x, _keystone_side(y, side), places=6)
                self.assertIn(_point((x, y)), body)
        # The window opens from inside the frame to beyond its arched edge.
        cx, cy, r, bottom = window_start()
        self.assertTrue(0 < cx - r and cx + r < 300 and bottom < 400)
        cx, cy, r, bottom = window_end()
        self.assertTrue(cx - r < 0 and cx + r > 300 and cy - r < 0 and bottom > 400)

    def test_vision_section(self):
        from .vision import VISION, validate

        self.assertEqual(validate(), [])
        for name, title in (('core:home', 'From Vision to Reality'), ('core:home_ar', 'من الرؤية إلى الواقع')):
            html = self.get(name)
            section = html[html.index('id="vision"'):html.index('id="services"')]
            self.assertIn(f'id="vision-title" data-reveal>{title}</h2>', section)
            # One accessible slider, starting at 50%.
            self.assertEqual(section.count('role="slider"'), 1)
            for attr in ('tabindex="0"', 'aria-valuemin="0"', 'aria-valuemax="100"', 'aria-valuenow="50"', 'aria-label="'):
                self.assertIn(attr, section)
            # Design under reality in the markup, so the clipped design layer sits on top.
            self.assertLess(section.index('compare__layer--reality'), section.index('compare__layer--design'))
            self.assertIn('js/compare-slider.js', html)
            # Real images: both shown with the same crop, no placeholder notices.
            for side in ('design', 'reality'):
                key = VISION[side]['image']
                if key:
                    from .images import IMAGES
                    self.assertIn(f"/static/images/site/{IMAGES[key]['name']}-", section)
                else:
                    self.assertIn(f'compare__missing--{side}', section)
            if VISION['design']['image'] and VISION['reality']['image']:
                self.assertNotIn('compare__missing', section)
                self.assertNotIn('compare__art', section)
                self.assertEqual(section.count(f"style=\"object-position: {VISION['focus']};\""), 2)
                self.assertNotIn('C:\\', section)

    def test_vision_images_render_when_set(self):
        from unittest import mock

        from . import vision

        data = dict(vision.VISION, design={'image': 'project-3', 'alt': 'Design of the kitchen.'},
                    reality={'image': 'project-3', 'alt': 'The finished kitchen.'})
        with mock.patch.object(vision, 'VISION', data):
            self.assertEqual(vision.validate(), [])
            html = self.get('core:home')
        section = html[html.index('id="vision"'):html.index('id="services"')]
        self.assertIn('alt="Design of the kitchen."', section)
        self.assertIn('alt="The finished kitchen."', section)
        self.assertNotIn('compare__missing', section)

    def test_project_data_is_valid(self):
        from .projects import validate

        self.assertEqual(validate(), [])

    def test_projects_carousel(self):
        from .projects import PROJECTS

        for name, show in (('core:home', 'Show project'), ('core:home_ar', 'اعرض المشروع')):
            html = self.get(name)
            section = html[html.index('id="projects"'):html.index('id="vision"')]
            count = len(PROJECTS)
            self.assertEqual(section.count('data-panel'), count)
            self.assertEqual(section.count('data-slide'), count)
            self.assertEqual(section.count('data-thumb='), count)
            # First project active and loaded; the others wait (hidden, inert).
            self.assertEqual(section.count('aria-current="true"'), 1)
            self.assertEqual(section.count('data-slide hidden'), count - 1)
            self.assertEqual(section.count('aria-hidden="true" inert'), count - 1)
            self.assertIn(f'{show} 1 ', section)
            self.assertIn('data-prev', section)
            self.assertIn('data-next', section)
            # The real monogram as decoration, by its static URL.
            self.assertIn('src="/static/images/brand/gindi-monogram-transparent.png"', section)
            self.assertNotIn('C:/', section)
            # "Explore Project" on every project, to that project on the Projects page.
            prefix = '/ar' if name.endswith('_ar') else ''
            for project in PROJECTS:
                self.assertIn(f'<a class="btn btn--primary featured__explore" href="{prefix}/projects/#{project["slug"]}">', section)
            self.assertIn(f'<a class="link-arrow featured__all" href="{prefix}/projects/">', section)
            self.assertNotIn('href="#"', section)
            self.assertNotIn('disabled', section)
            self.assertIn('js/projects-carousel.js', html)

    def test_long_project_names_get_the_smaller_size(self):
        from unittest import mock

        from . import projects

        long_name = dict(projects.PROJECTS[0], name='Residence at the Garden Courtyard, Phase II')
        with mock.patch.object(projects, 'PROJECTS', [long_name] + projects.PROJECTS[1:]):
            html = self.get('core:home')
        self.assertIn('class="featured__name featured__name--long">Residence at the Garden Courtyard, Phase II<', html)
        self.assertIn('class="featured__name">Project 02<', html)

    def test_projects_page(self):
        from .projects import PROJECTS

        for name, prefix, title in (('core:projects', '', 'Spaces &amp; Stories'), ('core:projects_ar', '/ar', 'مساحات وحكايات')):
            html = self.get(name)
            self.assertIn(f'>{title}</h1>', html)
            for number, project in enumerate(PROJECTS, start=1):
                slug = project['slug']
                # The anchor the homepage links to, and the link on to the project page.
                self.assertIn(f'id="{slug}"', html)
                self.assertIn(f'<a class="link-arrow project-entry__view" href="{prefix}/projects/{slug}/">', html)
            self.assertEqual(html.count('project-entry--flip'), len(PROJECTS) // 2)
            # Placeholders are labelled; illustrative photos too.
            self.assertIn('tile--placeholder', html)
            self.assertIn('class="media__tag"', html)
            # Header: solid, Projects marked current; section links go home.
            self.assertIn('site-header theme-dark is-solid', html)
            self.assertIn(f'href="{prefix}/projects/" aria-current="page"', html)
            self.assertIn(f'href="{prefix}/#contact"', html)  # homepage sections from other pages
            self.assertIn(f'href="{prefix}/services/"', html)
            self.assertIn('js/projects-page.js', html)
            self.assertNotIn('C:\\', html)

    def test_language_switch_keeps_the_page(self):
        html = self.client.get('/projects/project-2/').content.decode()
        self.assertIn('class="lang-switch" href="/ar/projects/project-2/"', html)
        html = self.client.get('/ar/projects/').content.decode()
        self.assertIn('class="lang-switch" href="/projects/"', html)

    def test_project_pages(self):
        from .projects import PROJECTS, for_language

        for project in for_language('en'):
            response = self.client.get(f"/projects/{project['slug']}/")
            self.assertEqual(response.status_code, 200)
            html = response.content.decode()
            self.assertIn(f'id="project-title" data-reveal>{project["name"]}</h1>', html)
            self.assertIn(f'href="/projects/#{project["slug"]}"', html)  # Back to Projects
            self.assertIn('Back to Projects', html)
            self.assertEqual(html.count('data-lightbox-open='), len(project['photos']))
            self.assertEqual(html.count('Photo to be added'), sum(1 for m in project['media'] if m['kind'] == 'placeholder'))
            if project['photos']:
                self.assertIn('<dialog class="lightbox"', html)
            if len(project['photos']) < 2:
                self.assertNotIn('data-lightbox-next', html)
        self.assertEqual(self.client.get('/ar/projects/project-1/').status_code, 200)
        self.assertEqual(self.client.get('/projects/no-such-project/').status_code, 404)
        self.assertEqual(len(PROJECTS), len({p['slug'] for p in PROJECTS}))

    def test_project_films_and_galleries(self):
        from unittest import mock

        from . import projects

        rich = dict(projects.PROJECTS[0], media=[
            {'video': 'videos/example.mp4', 'poster': 'project-1', 'title': 'Project Film'},
            {'image': 'project-1', 'alt': 'First photo.'},
            {'image': 'project-3', 'alt': 'Second photo.'},
            {'image': 'project-4', 'alt': 'Third photo.'},
            {'image': 'project-2', 'alt': 'Fourth photo.'},
        ])
        with mock.patch.object(projects, 'PROJECTS', [rich] + projects.PROJECTS[1:]):
            index = self.get('core:projects')
            detail = self.client.get('/projects/project-1/').content.decode()
            carousel = self.get('core:home')
        # Projects page: the film tile with a play button, and "+2 Photos" for the rest.
        self.assertIn('data-video-tile data-src="/static/videos/example.mp4"', index)
        self.assertIn('class="tile__play"', index)
        self.assertIn('>+2 Photos<', index)
        # Project page: a film with controls and no autoplay; four photos in the gallery.
        self.assertIn('<video controls preload="metadata" playsinline poster=', detail)
        self.assertNotIn('autoplay', detail)
        self.assertEqual(detail.count('data-lightbox-open='), 4)
        self.assertIn('data-lightbox-next', detail)
        # Homepage carousel uses the first photo, not the film.
        self.assertIn('alt="First photo."', carousel)

    def test_single_project_hides_navigation(self):
        from unittest import mock

        from . import projects

        with mock.patch.object(projects, 'PROJECTS', projects.PROJECTS[:1]):
            html = self.get('core:home')
        section = html[html.index('id="projects"'):html.index('id="vision"')]
        self.assertNotIn('data-carousel', section)
        self.assertNotIn('data-thumb=', section)
        self.assertNotIn('featured__counter', section)

    def test_services_data_is_valid(self):
        from .services import validate

        self.assertEqual(validate(), [])

    def test_services_page(self):
        from .services import SERVICES

        names = ['2D Design', '3D Design', 'Interior Finishing', 'Fit-Out']
        for name, prefix in (('core:services', ''), ('core:services_ar', '/ar')):
            html = self.get(name)
            if not prefix:
                self.assertIn('>Expertise for every stage.</h1>', html)
                self.assertIn('Discuss Your Project', html)
                for service_name in names:
                    self.assertIn(f'<span class="accordion__name">{service_name}</span>', html)
            # One accordion item per service, anchored by slug; the first open.
            for i, service in enumerate(SERVICES):
                slug = service['slug']
                self.assertIn(f'id="{slug}" data-accordion-item', html)
                expanded = 'true' if i == 0 else 'false'
                self.assertIn(f'id="{slug}-trigger"\n                        aria-expanded="{expanded}"', html)
                self.assertIn(f'aria-haspopup="dialog" data-enquire="{slug}"', html)
            self.assertEqual(html.count('accordion__item is-open'), 1)
            # Free Tools: four cards, each to its own page; no inputs outside the enquiry drawer.
            for slug in ('wire', 'tiles', 'bricks', 'cement'):
                self.assertIn(f'class="btn btn--primary tool-card__cta" href="{prefix}/free-tools/{slug}/"', html)
            self.assertIn(f'href="{prefix}/free-tools/"', html)
            body = html[:html.index('<dialog class="drawer')]
            self.assertNotIn('<input', body)
            self.assertNotIn('<select', body)
            # The form offers exactly the services, each enquiry button preselecting its own.
            drawer_options = html[html.index('id="enquiry-service"'):html.index('</select>')]
            for service in SERVICES:
                self.assertIn(f'<option value="{service["slug"]}">', drawer_options)
            self.assertEqual(drawer_options.count('<option'), len(SERVICES) + 1)
            # Enquiry drawer: not connected yet, so it cannot be sent and says so.
            drawer = html[html.index('<dialog class="drawer'):html.index('</dialog>')]
            self.assertIn('data-not-connected', drawer)
            self.assertIn('type="submit" disabled', drawer)
            self.assertNotIn('action=', drawer)
            self.assertIn(f'href="{prefix}/#contact"', drawer)
            # Header: Services is this page.
            self.assertIn(f'href="{prefix}/services/" aria-current="page"', html)

    def test_enquiry_form_posts_once_configured(self):
        from django.test import override_settings

        with override_settings(ENQUIRY_FORM_ACTION='https://forms.example.com/gindi'):
            html = self.get('core:services')
        drawer = html[html.index('<dialog class="drawer'):html.index('</dialog>')]
        self.assertIn('method="post" action="https://forms.example.com/gindi"', drawer)
        self.assertNotIn('disabled', drawer)
        self.assertNotIn('data-not-connected', drawer)

    def test_whatsapp_button(self):
        from urllib.parse import quote

        from django.test import override_settings

        # No number configured: no button (nothing invented).
        self.assertNotIn('data-whatsapp', self.get('core:services'))
        with override_settings(WHATSAPP_NUMBER='15550000000'):  # test value only
            html = self.get('core:services')
            ar = self.get('core:services_ar')
        drawer = html[html.index('<dialog class="drawer'):html.index('</dialog>')]
        general = 'Hello, I’d like to enquire about your services.'
        self.assertIn(f'href="https://wa.me/15550000000?text={quote(general)}"', drawer)
        self.assertIn('target="_blank" rel="noopener" data-whatsapp="15550000000"', drawer)
        self.assertIn('data-message-service="Hello, I’d like to enquire about {service}."', drawer)
        self.assertIn('Chat with Us on WhatsApp', drawer)
        # Below "Send enquiry", outside the form (no fields needed).
        self.assertLess(drawer.index('enquiry-form__send'), drawer.index('drawer__whatsapp'))
        self.assertLess(drawer.index('</form>'), drawer.index('drawer__whatsapp'))
        self.assertIn('تواصل معنا عبر واتساب', ar)

    def test_free_tools(self):
        from django.test import override_settings

        from .tools import TOOLS

        slugs = [tool['slug'] for tool in TOOLS]
        self.assertEqual(slugs, ['wire', 'tiles', 'bricks', 'cement'])
        for name, prefix in (('core:free_tools', ''), ('core:free_tools_ar', '/ar')):
            html = self.get(name)
            for slug in slugs:
                self.assertIn(f'href="{prefix}/free-tools/{slug}/"', html)
            self.assertEqual(html.count('class="tool-card__status label"'), 4)  # all coming soon
            self.assertIn(f'href="{prefix}/services/" aria-current="true"', html)
            self.assertNotIn('<input', html)
        for slug in slugs:
            for prefix in ('', '/ar'):
                response = self.client.get(f'{prefix}/free-tools/{slug}/')
                self.assertEqual(response.status_code, 200)
                html = response.content.decode()
                # Its own integration area, "Coming soon", nothing calculated, no agent loaded.
                self.assertIn(f'id="tool-{slug}" aria-live="polite" data-tool-root="{slug}"', html)
                self.assertIn('data-tool-placeholder', html)
                self.assertIn(f'href="{prefix}/free-tools/"', html)  # back to Free Tools
                self.assertNotIn('data-tool-script', html)
                self.assertNotIn('<input', html)
                self.assertNotIn('<form', html)
        self.assertIn('Coming soon', self.client.get('/free-tools/tiles/').content.decode())
        self.assertEqual(self.client.get('/free-tools/no-such-tool/').status_code, 404)
        # Each agent is independent: connecting one loads only that one.
        with override_settings(FREE_TOOL_SCRIPTS={'tiles': 'https://agents.example.com/tiles.js'}):
            tiles = self.client.get('/free-tools/tiles/').content.decode()
            wire = self.client.get('/free-tools/wire/').content.decode()
            overview = self.get('core:free_tools')
        self.assertIn('<script src="https://agents.example.com/tiles.js" defer data-tool-script="tiles"></script>', tiles)
        self.assertNotIn('data-tool-script', wire)
        self.assertEqual(overview.count('class="tool-card__status label"'), 3)

    def test_old_estimate_route_redirects(self):
        response = self.client.get('/free-estimate/')
        self.assertEqual((response.status_code, response['Location']), (301, '/free-tools/'))
        response = self.client.get('/ar/free-estimate/')
        self.assertEqual((response.status_code, response['Location']), (301, '/ar/free-tools/'))

    def test_homepage_service_links(self):
        from .services import SERVICES

        for name, prefix in (('core:home', ''), ('core:home_ar', '/ar')):
            html = self.get(name)
            section = html[html.index('id="services"'):html.index('id="process"')]
            for service in SERVICES:
                self.assertIn(f'<a class="service__link" href="{prefix}/services/#{service["slug"]}">', section)
            self.assertIn(f'href="{prefix}/services/"', section)  # All services
            header = html[html.index('<header class="site-header'):html.index('</header>')]
            footer = html[html.index('<footer'):html.index('</footer>')]
            self.assertIn(f'href="{prefix}/services/"', header)
            self.assertIn(f'href="{prefix}/services/"', footer)
            self.assertNotIn('href="#services"', header + footer)
            self.assertIn('href="#projects"', header)  # in-page sections still work on the homepage

    def test_about_page(self):
        from .about import ABOUT

        for name, prefix in (('core:about', ''), ('core:about_ar', '/ar')):
            html = self.get(name)
            self.assertEqual(html.count('<h1'), 1)
            self.assertIn(f'href="{prefix}/about/" aria-current="page"', html)
            # Hero, three chapters joined by the line, details, closing.
            for marker in ('class="ab-hero', 'id="chapter-1"', 'id="chapter-2"', 'id="chapter-3"', 'data-story-line',
                           'class="ab-details', 'class="ab-closing'):
                self.assertIn(marker, html)
            self.assertEqual(html.count('data-marker '), 0)
            self.assertEqual(html.count('aria-hidden="true" data-marker>'), 3)
            self.assertIn('href="#chapter-1"', html)  # scroll link
            # Images from images.py, by public URL; each informative image has alt text.
            for key in ('about-hero', 'about-who', 'about-what', 'about-how', 'about-detail-1', 'about-detail-2'):
                self.assertIn(f'/static/images/site/{key}-', html)
            self.assertNotIn('C:\\', html)
            self.assertIn('src="/static/images/brand/gindi-monogram-transparent.png"', html)
            # Chapter 02 services link to their accordion items; Explore to /services/.
            for slug in ('2d-design', '3d-design', 'interior-finishing', 'fit-out'):
                self.assertIn(f'<a class="ab-service" href="{prefix}/services/#{slug}">', html)
            self.assertIn(f'<a class="ab-arrow-link rv rv--text" href="{prefix}/services/">', html)
            # Five timeline steps.
            self.assertEqual(html.count('data-step>'), 5)
            # Closing: the shared drawer, no service forced; no WhatsApp without a number.
            self.assertIn('aria-haspopup="dialog" data-enquire="">', html)
            self.assertIn('<dialog class="drawer', html)
            self.assertNotIn('wa.me', html)
            self.assertIn('js/about-page.js', html)
        html = self.get('core:about')
        self.assertIn('From an Idea<br>to a Finished Space</h1>', html)
        self.assertIn('>Who We Are</h2>', html)
        self.assertIn('Execution and handover stages depend on the agreed service scope.', html)
        self.assertIn('Let’s write your next chapter.', html)
        self.assertEqual(len(ABOUT['how']['steps']), 5)

    def test_about_whatsapp_once_configured(self):
        from django.test import override_settings

        with override_settings(WHATSAPP_NUMBER='15550000000'):  # test value only
            html = self.get('core:about')
        self.assertIn('href="https://wa.me/15550000000?text=Hello%2C%20I%E2%80%99d%20like%20to%20discuss%20a%20project'
                      '%20with%20Gindi%20Innovations." target="_blank" rel="noopener">Chat on WhatsApp', html)

    def test_homepage_gindi_innovations_text(self):
        for name, prefix, lead in (
                ('core:home', '', 'At Gindi Innovations, we create spaces that balance character, comfort, and functionality.'),
                ('core:home_ar', '/ar', 'في Gindi Innovations نصمّم مساحات توازن بين الطابع والراحة والوظيفة.')):
            html = self.get(name)
            section = html[html.index('id="about"'):html.index('id="contact"')]
            self.assertIn(f'<p class="about__text lead" data-reveal>{lead}', section)
            self.assertEqual(section.count('class="about__text'), 2)
            self.assertIn(f'<a class="btn btn--primary about__more" href="{prefix}/about/">', section)
            self.assertIn('data-emblem-reveal', section)  # the reveal stays
        self.assertIn('>More About Us</a>', self.get('core:home'))

    def test_menu_has_home_and_no_process(self):
        for name, prefix, home in (('core:home', '', '#top'), ('core:home_ar', '/ar', '#top'),
                                   ('core:about', '', '/'), ('core:services_ar', '/ar', '/ar/')):
            html = self.get(name)
            header = html[html.index('<header class="site-header'):html.index('</header>')]
            footer = html[html.index('<footer'):html.index('</footer>')]
            self.assertIn(f'<a class="site-nav__link" href="{home}">', header)
            self.assertIn(f'<li><a href="{home}">', footer)
            for part in (header, footer):
                self.assertNotIn('#process', part)
                self.assertNotIn('>Process<', part)
                self.assertNotIn('منهجية العمل', part)
        self.assertIn('id="process"', self.get('core:home'))  # the section itself stays
        # Philosophy is gone: no section, no menu links, in either language.
        for name in ('core:home', 'core:home_ar', 'core:about'):
            html = self.get(name)
            self.assertNotIn('id="philosophy"', html)
            self.assertNotIn('#philosophy', html)
            self.assertNotIn('Philosophy', html)
            self.assertNotIn('فلسفتنا', html)

    def test_about_links_from_homepage(self):
        for name, prefix in (('core:home', ''), ('core:home_ar', '/ar')):
            html = self.get(name)
            header = html[html.index('<header class="site-header'):html.index('</header>')]
            footer = html[html.index('<footer'):html.index('</footer>')]
            self.assertIn(f'href="{prefix}/about/"', header)
            self.assertIn(f'href="{prefix}/about/"', footer)
            self.assertIn(f'<a class="btn btn--primary about__more" href="{prefix}/about/"', html)

    def test_no_live_contact_links(self):
        for name in ('core:home', 'core:home_ar'):
            html = self.get(name)
            self.assertNotIn('mailto:', html)
            self.assertNotIn('tel:', html)

class DeploymentTests(SimpleTestCase):
    """Preview/production plumbing: placeholders, noindex, robots, errors."""

    def test_placeholder_badges_do_not_depend_on_debug(self):
        # The test runner always runs with DEBUG=False.
        html = self.client.get(reverse('core:home')).content.decode()
        self.assertIn('<span class="ph-badge">Placeholder</span>', html)
        with self.settings(SHOW_PLACEHOLDER_BADGES=False):
            html = self.client.get(reverse('core:home')).content.decode()
            self.assertNotIn('class="ph-badge"', html)

    def test_free_tools_stay_coming_soon_without_scripts(self):
        for slug in ('wire', 'tiles', 'bricks', 'cement'):
            html = self.client.get(reverse('core:free_tool', kwargs={'slug': slug})).content.decode()
            self.assertIn('data-tool-placeholder', html)
            self.assertNotIn('data-tool-script', html)

    def test_noindex_header_meta_and_robots(self):
        response = self.client.get(reverse('core:home'))
        self.assertEqual(response['X-Robots-Tag'], 'noindex, nofollow')
        self.assertIn('<meta name="robots" content="noindex, nofollow">', response.content.decode())
        robots = self.client.get('/robots.txt')
        self.assertEqual(robots.status_code, 200)
        self.assertTrue(robots['Content-Type'].startswith('text/plain'))
        self.assertIn('User-agent: *\nDisallow:\n', robots.content.decode())
        self.assertEqual(robots['X-Robots-Tag'], 'noindex, nofollow')

    def test_indexing_can_be_enabled_for_launch(self):
        with self.settings(SITE_NOINDEX=False):
            response = self.client.get(reverse('core:home'))
            self.assertFalse(response.has_header('X-Robots-Tag'))
            self.assertNotIn('name="robots"', response.content.decode())
            self.assertIn('Allow: /', self.client.get('/robots.txt').content.decode())

    def test_favicon_redirects_to_the_brand_icon(self):
        response = self.client.get('/favicon.ico')
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response['Location'].endswith('images/brand/favicon-32.png'))

    def test_branded_404_in_both_languages(self):
        for path, lang, heading in (('/no-such-page/', 'en', 'This page could not be found.'),
                                    ('/ar/no-such-page/', 'ar', 'تعذّر العثور على هذه الصفحة.'),
                                    ('/projects/no-such-project/', 'en', 'This page could not be found.')):
            response = self.client.get(path)
            html = response.content.decode()
            self.assertEqual(response.status_code, 404, path)
            self.assertIn(f'<html lang="{lang}"', html)
            self.assertIn(heading, html)
            self.assertIn('class="site-header', html)
            self.assertIn('<footer', html)
            self.assertIn('<meta name="robots" content="noindex">', html)

    def test_branded_500_is_self_contained(self):
        from django.test import RequestFactory

        from . import views
        response = views.server_error(RequestFactory().get('/'))
        html = response.content.decode()
        self.assertEqual(response.status_code, 500)
        self.assertIn('Something went wrong on our side.', html)
        self.assertIn('حدث خطأ من جهتنا.', html)
        self.assertNotIn('/static/', html)

    def test_production_settings_for_render(self):
        import importlib
        import os
        import sys
        from unittest import mock

        env = {'DJANGO_SECRET_KEY': 'x' * 60, 'DATABASE_URL': 'sqlite:///db.sqlite3',
               'RENDER_EXTERNAL_HOSTNAME': 'gindi-website.onrender.com'}
        with mock.patch.dict(os.environ, env):
            sys.modules.pop('config.settings.production', None)
            prod = importlib.import_module('config.settings.production')
        sys.modules.pop('config.settings.production', None)
        self.assertFalse(prod.DEBUG)
        self.assertIn('gindi-website.onrender.com', prod.ALLOWED_HOSTS)
        self.assertIn('https://gindi-website.onrender.com', prod.CSRF_TRUSTED_ORIGINS)
        self.assertEqual(prod.SECURE_PROXY_SSL_HEADER, ('HTTP_X_FORWARDED_PROTO', 'https'))
        self.assertTrue(prod.SECURE_SSL_REDIRECT)
        self.assertEqual(prod.DATABASES['default']['NAME'], prod.BASE_DIR / 'db.sqlite3')
        self.assertEqual(prod.MIDDLEWARE[:3], ['apps.core.middleware.NoIndexMiddleware',
                                               'django.middleware.security.SecurityMiddleware',
                                               'whitenoise.middleware.WhiteNoiseMiddleware'])
        self.assertTrue(prod.LOGGING['handlers']['console'])

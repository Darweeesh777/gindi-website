import re
from unittest import mock

from django.test import SimpleTestCase
from django.urls import reverse

from . import projects as project_data

SECTION_ORDER = ['top', 'projects', 'vision', 'services', 'process', 'about', 'contact']


# The whole site as it is once real projects are published (projects.PUBLISHED).
# The unpublished default is covered by PublicContentTests below.
@mock.patch.object(project_data, 'PUBLISHED', True)
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
            self.assertEqual(html.count('class="media__tag"'), 3)  # projects 03-04 (01 and 02 are real) + about
            self.assertIn(label, html)
            self.assertNotIn('{#', html)  # no template comments leaking into the page

    def test_hero_is_the_original(self):
        html = self.get('core:home')
        hero = html[html.index('id="top"'):html.index('id="projects"')]
        self.assertIn('class="hero__eyebrow label hero-intro" style="--i: 0"', hero)
        self.assertIn('Spaces composed<br>with quiet intention.', hero)
        self.assertIn('class="hero__actions hero-intro" style="--i: 3"', hero)
        # Concept 05 CTAs, linked to existing sections only.
        self.assertIn('<a class="btn hero__quote" href="#contact" data-quote>Get Quotation</a>', hero)
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

    def vision_section(self, name):
        html = self.get(name)
        return html, html[html.index('id="vision"'):html.index('id="services"')]

    def test_vision_section(self):
        from .images import IMAGES
        from .vision import VISIONS, validate

        self.assertEqual(validate(), [])
        for name, title, hint in (('core:home', 'From Vision to Reality', 'Drag to compare'),
                                  ('core:home_ar', 'من الرؤية إلى الواقع', 'اسحب للمقارنة')):
            html, section = self.vision_section(name)
            self.assertIn(f'id="vision-title" data-reveal>{title}</h2>', section)
            # One accessible slider, starting at 50%.
            self.assertEqual(section.count('role="slider"'), 1)
            for attr in ('tabindex="0"', 'aria-valuemin="0"', 'aria-valuemax="100"', 'aria-valuenow="50"', 'aria-label="'):
                self.assertIn(attr, section)
            # Design under reality in the markup, so the clipped design layer sits on top.
            self.assertLess(section.index('compare__layer--reality'), section.index('compare__layer--design'))
            self.assertIn('js/compare-slider.js', html)
            self.assertIn('js/vision-nav.js', html)
            # Labels row: design | hint | reality, with the gold rules between.
            labels = section[section.index('class="compare__labels"'):]
            self.assertLess(labels.index('compare__label'), labels.index(hint))
            self.assertEqual(labels[:labels.index('</div>')].count('compare__rule'), 2)
            # Real images, the same crop on both layers; no explanatory sentence.
            entry = VISIONS[0]
            for side in ('design', 'reality'):
                self.assertIn(f"/static/images/site/{IMAGES[entry[side]['image']]['name']}-", section)
            self.assertEqual(section.count(f"style=\"object-position: {entry['focus']};\""), 2)
            self.assertNotIn('C:\\', section)
            self.assertNotIn('One project at a time', section)
            # One verified pair: one slide, and no counter, dots or arrows.
            self.assertEqual(section.count('data-vision-slide'), len(VISIONS))
            if len(VISIONS) == 1:
                self.assertNotIn('data-vision-nav', section)
                self.assertNotIn('01 / ', section)

    def test_vision_navigation_follows_entries(self):
        from . import vision

        second = {
            'id': 'test-kitchen', 'project_name': {'en': 'Test Kitchen', 'ar': 'مطبخ تجريبي'},
            'design': {'image': 'project-3', 'alt': 'Design of the kitchen.'},
            'reality': {'image': 'project-4', 'alt': 'The finished kitchen.'},
        }
        incomplete = dict(second, id='test-incomplete', design={'image': 'no-such-image', 'alt': 'x'},
                          reality={'image': 'project-2', 'alt': 'y'})
        with mock.patch.object(vision, 'VISIONS', vision.VISIONS[:1] + [second, incomplete]):
            self.assertIn("test-incomplete: design image 'no-such-image' is not in images.py", vision.validate())
            for name, label in (('core:home', 'Choose project'), ('core:home_ar', 'اختر المشروع')):
                _, section = self.vision_section(name)
                # Only complete entries count: two slides, "01 / 02", two dots.
                self.assertEqual(section.count('data-vision-slide'), 2)
                self.assertIn('<span data-vision-current>01</span> / 02', section)
                self.assertEqual(section.count('data-vision-dot='), 2)
                self.assertEqual(section.count('aria-current="true"'), 1)
                self.assertIn(label, section)
                self.assertNotIn('test-incomplete', section)
                # The second slide is hidden until chosen; the first is shown.
                first = section[section.index('id="vision-kk-barbershop"'):]
                self.assertNotIn(' hidden>', first[:first.index('>') + 1])
                tail = section[section.index('id="vision-test-kitchen"'):]
                self.assertIn(' hidden>', tail[:tail.index('>') + 1])
            self.assertIn('alt="Design of the kitchen."', section)
        # The same image for design and reality, or one image in two entries, is rejected.
        same = dict(second, reality={'image': 'project-3', 'alt': 'z'})
        with mock.patch.object(vision, 'VISIONS', [same]):
            self.assertIn('test-kitchen: design and reality are the same image', vision.validate())
        reused = dict(second, design=vision.VISIONS[0]['design'])
        with mock.patch.object(vision, 'VISIONS', vision.VISIONS + [reused]):
            self.assertIn('an image is used by more than one entry', vision.validate())

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
            self.assertIn('src="/static/images/brand/gindi-monogram-transparent.png', section)
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
        self.assertIn('class="featured__name">Project 03<', html)

    def test_projects_page(self):
        from .projects import PROJECTS

        for name, prefix, title in (('core:projects', '', 'Every space begins with a vision.'), ('core:projects_ar', '/ar', 'كل مساحة تبدأ برؤية.')):
            html = self.get(name)
            # The Gindi Gate: the entrance, its headline, and the way on to the projects.
            self.assertIn(f'id="pgate-title">{title}</h1>', html)
            self.assertIn('data-gate', html)
            self.assertIn('href="#projects-list" data-gate-go', html)
            self.assertIn('id="projects-list"', html)
            self.assertIn('js/projects-gate.js', html)
            self.assertNotIn('<img', html[html.index('data-gate'):html.index('id="projects-list"')])  # no photos in the gate
            # The open gate's introduction: the approved copy, no figures or credentials.
            intro = html[html.index('class="pgate__intro"'):html.index('class="pgate__cue"')]
            copy = (('Behind every detail', 'From vision to spaces you can experience.',
                     'Explore projects brought to life by Eng. Mostafa Elgindi and his team, where thoughtful planning, '
                     'coordinated execution, and attention to detail come together.',
                     'Eng. Mostafa Elgindi &amp; the Gindi Innovations team', 'Explore the projects') if prefix == '' else
                    ('وراء كل تفصيلة', 'من رؤية إلى مساحات تعيشها.',
                     'اكتشف مشروعات نفّذها المهندس مصطفى الجندي وفريقه، يجتمع فيها التخطيط المدروس وتكامل التنفيذ والاهتمام بالتفاصيل.',
                     'المهندس مصطفى الجندي وفريق جندي إنوفيشنز', 'استكشف المشروعات'))
            for text in copy:
                self.assertIn(text, intro)
            self.assertIn('id="pgate-intro-title"', intro)
            self.assertIn('href="#projects-list" data-gate-go', intro)
            self.assertIn('Scroll down to discover' if prefix == '' else 'مرّر لأسفل لاكتشاف المشروعات', html)
            self.assertNotRegex(re.sub(r'<[^>]+>', '', intro), r'\d')  # no counts, years or other figures in the text
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
            self.assertIn(f'href="/projects/#{project["slug"]}"', html)  # Back to Projects
            self.assertIn('Back to Projects', html)
            if project['interactive'] or project['layout']:
                continue  # KK Barbershop and the villa have their own tests
            self.assertIn(f'id="project-title" data-reveal>{project["name"]}</h1>', html)
            self.assertEqual(html.count('data-lightbox-open='), len(project['photos']))
            self.assertEqual(html.count('Photo to be added'), sum(1 for m in project['media'] if m['kind'] == 'placeholder'))
            if project['photos']:
                self.assertIn('<dialog class="lightbox"', html)
            if len(project['photos']) < 2:
                self.assertNotIn('data-lightbox-next', html)
        self.assertEqual(self.client.get('/ar/projects/project-1/').status_code, 200)
        self.assertEqual(self.client.get('/projects/no-such-project/').status_code, 404)
        self.assertEqual(len(PROJECTS), len({p['slug'] for p in PROJECTS}))

    def test_villa_follow_the_light_page(self):
        import os

        from .images import IMAGES
        from .projects import PROJECTS, get

        villa = PROJECTS[1]
        self.assertEqual(villa['slug'], 'project-2')  # the existing route
        # Every photograph in the folder, once, in the carousel; the originals stay where they are.
        folder = 'static/images/Villa ( pictures )'
        files = sorted(f[:8].lower() for f in os.listdir(folder) if f.lower().endswith('.png'))
        keys = [item['image'] for item in villa['media']]
        self.assertEqual(sorted(k[len('villa-'):] for k in keys), files)
        self.assertEqual(len(keys), 30)
        self.assertTrue(all(IMAGES[k]['illustrative'] is False for k in keys))
        moments = [m['image'] for m in villa['moments']]
        self.assertEqual(moments, ['villa-4e987bed', 'villa-63aed22b', 'villa-a32d2d56', 'villa-6cc5e965', 'villa-3e7ab2b8'])
        groups = [g for g, _ in villa['groups']]
        self.assertEqual(groups, ['entrance', 'kitchen', 'stairs', 'doors', 'bathrooms', 'terrace'])
        for lang, prefix, title, explore in (('en', '', 'Follow the light.', 'Explore the Villa'),
                                             ('ar', '/ar', 'اتبع الضوء.', 'استكشف تفاصيل الفيلا')):
            response = self.client.get(f'{prefix}/projects/project-2/')
            self.assertEqual(response.status_code, 200)
            html = response.content.decode()
            self.assertIn('<title>villa-New El Sheikh Zayed City — ', html)
            self.assertIn('<p class="villa-hero__name">villa-New El Sheikh Zayed City</p>', html)
            self.assertIn(f'id="villa-title">{title}</h1>', html)
            self.assertIn(f'id="explore-title">{explore}</h2>', html)
            self.assertIn('href="#villa-moments-2"', html)  # Explore the villa: the second section
            self.assertIn('id="villa-moments-2"', html)
            self.assertEqual(html.count('data-moment>'), 5)
            self.assertEqual(html.count('class="villa-pair"'), 2)
            self.assertEqual(html.count('data-lightbox-item='), 30)
            self.assertEqual(html.count('class="explore__sep"'), 6)
            self.assertIn('js/project-light.js', html)
            self.assertNotIn('#}', html)  # no template comment leaking
            # The approved copy.
            self.assertIn('A cascade of illuminated pendants draws the eye' if lang == 'en' else 'تمتد وحدات الإضاءة المعلّقة', html)
            self.assertIn('The Terrace' if lang == 'en' else 'التراس', html)
        # Listing card and homepage: the villa's own photographs, no "illustrative" label.
        card = get('project-2', 'en')
        self.assertEqual(card['image']['src'].split('?')[0], '/static/images/site/villa-4e987bed-945.webp')
        self.assertFalse(card['image']['illustrative'])
        index = self.client.get('/projects/').content.decode()
        entry = index[index.index('id="project-2"'):index.index('id="project-3"')]
        self.assertIn('villa-New El Sheikh Zayed City', entry)
        self.assertIn('+27', entry)

    def test_interactive_project_page(self):
        from .images import IMAGES
        from .projects import PROJECTS

        kk = PROJECTS[0]
        self.assertEqual(kk['slug'], 'project-1')  # existing links keep working
        files = [IMAGES[item['image']]['name'] for item in kk['media']]
        self.assertEqual(files, [f'kk-img-{n}' for n in range(8891, 8897)])
        for lang, prefix, name, tabs in (
                ('en', '', 'KK Barbershop - Sheikh Zayed', ('Completed', 'Concept Visualization')),
                ('ar', '/ar', 'صالون KK - الشيخ زايد', ('بعد التنفيذ', 'تصور للمكان'))):
            html = self.client.get(f'{prefix}/projects/project-1/').content.decode()
            title = name.replace(' - ', ' - ')  # the hyphen never starts a line
            self.assertIn(f'id="project-title">{title}</h1>', html)
            for label in tabs:
                self.assertIn(f'data-pg-tab>{label}</button>', html)
            self.assertIn('aria-selected="true" data-pg-tab', html)
            # The overview first, six thumbnails, three markers opening photos 4, 3 and 5.
            self.assertIn('images/site/kk-img-8891-2048.webp', html.split('data-pg-image')[0].rsplit('<img', 1)[1])
            completed, concept = html.split('id="pg-concept"')
            self.assertEqual(completed.count('data-pg-thumb='), 6)
            # Markers on every photo, linking the connected views (Overview: the toolbar button).
            sets = re.findall(r'data-pg-hotspots="(\d)"(.*?)</div>', html, re.S)
            links = {int(i): [int(t) for t in re.findall(r'data-pg-goto="(\d)"', body)] for i, body in sets}
            self.assertEqual(links, {0: [3, 2, 4], 1: [2, 5], 2: [1, 5], 3: [4], 4: [3, 5], 5: [2, 4]})
            self.assertIn('data-pg-previous disabled', html)
            self.assertIn('data-pg-home disabled aria-current="true"', html)
            self.assertIn('<span data-pg-count>01</span> / 06', html)
            # The concept visualizations: their own gallery (six, in the photos' order), no markers
            # or history, never mixed with the photographs; no tags or placeholders.
            renders = ['kk-render-2'] + [f'kk-concept-{v}' for v in ('stations', 'styling', 'coffee', 'waiting', 'front')]
            self.assertEqual(re.findall(r'data-pg-thumb="\d"[^>]*?data-src="/static/images/site/([a-z0-9-]+?)-\d+\.webp', concept, re.S), renders)
            self.assertNotIn('data-pg-goto', concept)
            self.assertNotIn('data-pg-previous', concept)
            self.assertIn('data-pg-step="-1"', concept)
            self.assertIn('<span data-pg-count>01</span> / 06', concept)
            self.assertFalse(any(r in completed for r in renders))
            self.assertNotIn('kk-img-', concept.split('id="pv-compare"')[0])
            # "From Vision to Reality": below the gallery, above the closing call to action, with
            # exactly the homepage's KK pair, and none of the homepage's project switching.
            self.assertLess(html.index('id="pg-concept"'), html.index('id="pv-compare"'))
            self.assertLess(html.index('id="pv-compare"'), html.index('id="contact"'))
            section = html[html.index('id="pv-compare"'):html.index('</section>', html.index('id="pv-compare"'))]
            home = self.client.get(f'{prefix}/').content.decode()
            home_slide = home[home.index('id="vision-kk-barbershop"'):home.index('</div>', home.index('compare__layer--design'))]
            for layer in ('reality', 'design'):
                src = re.search(rf'compare__layer--{layer}">\s*<img src="([^"]+)"', home_slide).group(1)
                self.assertIn(f'src="{src}"', section)
            self.assertLess(section.index('compare__layer--reality'), section.index('compare__layer--design'))
            self.assertEqual(section.count('role="slider"'), 1)
            self.assertIn('aria-valuenow="50"', section)
            for absent in ('data-vision-nav', 'data-vision-dot', 'data-vision-slide', 'vision-nav'):
                self.assertNotIn(absent, section)
            self.assertIn('js/compare-slider.js', html)
            ids = re.findall(r'\sid="([^"]+)"', html)
            self.assertEqual(len(ids), len(set(ids)), [i for i in ids if ids.count(i) > 1])
            self.assertNotIn('pv-compare', self.client.get(f'{prefix}/projects/project-2/').content.decode())
            self.assertNotIn('media__tag', html)
            self.assertNotIn('tile--placeholder', html)
            # The Projects page entry: the real name, three real photos, the neutral line.
            index = self.client.get(f'{prefix}/projects/').content.decode()
            entry = index[index.index('id="project-1"'):index.index('id="project-2"')]
            self.assertIn(name, entry)
            self.assertEqual(list(dict.fromkeys(re.findall(r'kk-img-(\d{4})-2048', entry))), ['8891', '8894', '8896'])
            self.assertIn('Explore the completed space and its different views.' if lang == 'en'
                          else 'استكشف المساحة بعد التنفيذ من زوايا مختلفة.', entry)
            self.assertIn(f'href="{prefix}/projects/project-1/"', entry)
            self.assertNotIn('media__tag', entry)
            self.assertNotIn('tile__missing', entry)

    def test_project_films_and_galleries(self):
        from unittest import mock

        from . import projects

        rich = dict(projects.PROJECTS[0], tiles=None, concept=None, media=[
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
                self.assertIn('>Your space. Every detail considered.</h1>', html)
                self.assertIn('Explore 2D design, 3D visualization, interior finishing, and fit-out services', html)
                self.assertEqual(re.findall(r'<span class="sp-card__title">([^<]+)</span>', html), names)
                for text in ('Layouts shaped around your needs.', 'Explore your space before execution.',
                             'Bring the approved finishes to life.', 'Prepare your space for everyday use.',
                             'A practical place to start.', 'Let’s discuss your project.', 'Estimate initial electrical wire quantities.'):
                    self.assertIn(text, html)
            # One card per service, anchored by its slug, with its arched photo and one keystone;
            # details (summary, deliverables, enquiry) in a closed <details>.
            self.assertEqual(html.count('data-service-card'), 4)
            self.assertEqual(html.count('class="sp-card__keystone"'), 4)
            self.assertEqual(html.count('<details class="sp-card__more" data-service-details>'), 4)  # closed by default
            parts = html[:html.index('</ol>')].split('data-service-card')
            cards = {re.search(r'id="([^"]+)" $', before).group(1): part for before, part in zip(parts, parts[1:])}
            for service in SERVICES:
                slug = service['slug']
                card = cards[slug]
                self.assertIn('<div class="sp-card__photo">', card)
                self.assertRegex(card, r'<img src="/static/images/site/[^"]+\.webp')
                self.assertIn(f'aria-haspopup="dialog" data-enquire="{slug}"', card)
                self.assertIn('class="sp-card__list"', card)  # verified deliverables kept
                self.assertNotIn('keystone"></span>', card)  # no badge beside the number
            # Free planning tools: each opens its working calculator, in this language.
            tools = html[html.index('class="sp-tools'):html.index('class="footer-cta')]
            self.assertIn('id="free-tools"', tools)  # the calculators' "back" links land here
            start = 'Start calculating' if prefix == '' else 'ابدأ الحساب'
            for slug in ('wire', 'tiles', 'bricks', 'paint', 'plaster'):
                self.assertIn(f'<a class="sp-tool__link" href="{prefix}/free-tools/{slug}/">{start}', tools)
            self.assertEqual(tools.count('class="sp-tool__link"'), 5)
            self.assertNotIn('sp-tool__status', tools)
            self.assertNotIn('Coming soon', tools)
            self.assertNotIn('قريبًا', tools)
            self.assertNotIn('/free-tools/cement/', tools)  # the old Cement Estimator card is gone
            self.assertIn('Paint Quantity &amp; Cost Calculator' if prefix == '' else 'حاسبة كميات وتكلفة الدهانات', tools)
            self.assertEqual(tools.count('class="sp-tool__icon"'), 5)
            self.assertIn('class="sp-tools__mark"', tools)  # the monogram watermark, decorative
            # Get Quotation opens the existing quotation form.
            self.assertRegex(html, r'class="btn footer-cta__btn" href="[^"]*#contact" aria-haspopup="dialog" data-quote>')
            self.assertEqual(html.count('data-quote-drawer'), 1)  # one quotation form, in the shared page end
            self.assertIn('data-quote-drawer', html)
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
            self.assertIn('id="enquiry-notice"', drawer)
            self.assertNotIn('#contact', drawer)  # no contact details to point to yet
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

    def test_forms_send_to_the_backend_once_configured(self):
        from django.test import override_settings

        # Not configured (the default): no backend, no Turnstile, the forms as before.
        html = self.get('core:services')
        self.assertNotIn('forms-backend', html)
        self.assertNotIn('challenges.cloudflare.com', html)
        self.assertNotIn('data-turnstile', html)
        self.assertIn('data-quote-send="email"', html)
        # Only one of the two settings: still not configured.
        with override_settings(CONTACT_API_URL='/api/contact', TURNSTILE_SITE_KEY=''):
            self.assertNotIn('forms-backend', self.get('core:services'))

        with override_settings(CONTACT_API_URL='/api/contact', TURNSTILE_SITE_KEY='1x00000000000000000000AA'):
            pages = {name: self.get(name) for name in ('core:services', 'core:about', 'core:contact', 'core:contact_ar')}
        for name, html in pages.items():
            self.assertIn('<script id="forms-backend" type="application/json">', html)
            self.assertIn('"url": "/api/contact"', html)
            self.assertIn('"sitekey": "1x00000000000000000000AA"', html)
            self.assertIn('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', html)
            self.assertIn('js/form-backend', html)
            # Quotation drawer (every page): "Send Request", WhatsApp unchanged, guarded.
            drawer = html[html.index('data-quote-drawer'):]
            drawer = drawer[:drawer.index('</dialog>')]
            self.assertIn('data-quote-send="server"', drawer)
            self.assertNotIn('data-quote-send="email"', drawer)
            self.assertIn('data-quote-send="whatsapp"', drawer)
            self.assertIn('data-turnstile', drawer)
            self.assertIn('name="website" tabindex="-1"', drawer)
        for name in ('core:services', 'core:about'):
            drawer = pages[name][pages[name].index('<dialog class="drawer'):]
            drawer = drawer[:drawer.index('</dialog>')]
            self.assertIn('data-enquiry-backend', drawer)
            self.assertNotIn('data-not-connected', drawer)
            self.assertNotIn('disabled', drawer)
            self.assertIn('data-turnstile', drawer)
            self.assertIn('data-enquiry-status', drawer)
        for name, label in (('core:contact', 'Send Request'), ('core:contact_ar', 'إرسال الطلب')):
            form = pages[name][pages[name].index('data-form-kind="contact"'):]
            form = form[:form.index('</form>')]
            self.assertIn('data-quote-send="server"', form)
            self.assertIn(label, form)
            self.assertIn('data-turnstile', form)

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
        from .tools import TOOLS

        slugs = [tool['slug'] for tool in TOOLS]
        self.assertEqual(slugs, ['wire', 'tiles', 'bricks', 'paint', 'plaster'])
        for name, prefix in (('core:free_tools', ''), ('core:free_tools_ar', '/ar')):
            html = self.get(name)
            # Every card starts its calculator; nothing is "coming soon".
            self.assertEqual(html.count('tool-card__cta'), 5)
            for slug in slugs:
                self.assertIn(f'class="btn btn--primary tool-card__cta" href="{prefix}/free-tools/{slug}/"', html)
            self.assertNotIn('tool-card__status', html)
            self.assertIn(f'href="{prefix}/services/" aria-current="true"', html)
        self.assertEqual(self.client.get('/free-tools/no-such-tool/').status_code, 404)

    def test_calculator_pages(self):
        # Titles and introductions as approved; each page loads its own calculator.
        expected = {
            'wire': (('Electrical Wire Calculator', 'Estimate wire lengths, the number of rolls and the cost from your project’s details.'),
                     ('حاسبة كميات أسلاك الكهرباء', 'قدّر أطوال الأسلاك وعدد اللفات والتكلفة وفق بيانات مشروعك.')),
            'tiles': (('Tile &amp; Ceramic Calculator', 'Calculate what your floors, walls and skirting need, with waste and a purchase breakdown.'),
                      ('حاسبة السيراميك والبلاط', 'احسب احتياجات الأرضيات والحوائط والوزرات، مع الهالك وتفاصيل الشراء.')),
            'bricks': (('Brick Quantity &amp; Cost Calculator', 'Plan quantities and cost before the work begins.'),
                       ('حاسبة كميات وتكلفة الطوب', 'خطّط للكميات والتكلفة قبل التنفيذ.')),
            'paint': (('Paint Quantity &amp; Cost Calculator', 'Estimate the quantities for each painting stage, the number of packs and the cost, '
                       'from the area and the products you choose.'),
                      ('حاسبة كميات وتكلفة الدهانات', 'قدّر كميات مراحل الدهان وعدد العبوات والتكلفة حسب المساحة والمنتجات المختارة.')),
            'plaster': (('Plaster Cement &amp; Sand Calculator', 'Calculate the cement bags and sand to buy for plastering and the spatter dash, '
                         'including waste and purchase rounding.'),
                        ('حاسبة أسمنت ورمل المحارة والطرطشة', 'احسب شكاير الأسمنت وكمية الرمل اللازمة للمحارة والطرطشة، شاملة الهالك وتقريب الشراء.')),
        }
        for slug, langs in expected.items():
            for (title, intro), prefix in zip(langs, ('', '/ar')):
                response = self.client.get(f'{prefix}/free-tools/{slug}/')
                self.assertEqual(response.status_code, 200)
                html = response.content.decode()
                self.assertIn(f'id="tool-title">{title}</h1>', html)
                self.assertIn(f'<p class="calc-hero__lead">{intro}</p>', html)
                self.assertRegex(html, rf'<div class="calc" data-calc="{slug}" data-logo="/static/images/brand/gindi-logo\.png[^"]*">')
                for script in ('calc-ui', f'{slug}-calc', slug):
                    self.assertRegex(html, rf'<script src="/static/js/tools/{script}\.js[^"]*" defer></script>')
                self.assertIn('css/calculator.css', html)
                self.assertIn('<section class="calc-report" id="report" aria-hidden="true"></section>', html)
                self.assertIn(f'href="{prefix}/services/#free-tools"', html)  # back to the planning tools
                self.assertIn('<svg class="calc-art"', html)  # the tool's faint drawing
                self.assertIn('<noscript>', html)
                self.assertNotIn('<iframe', html)
                for soon in ('Coming soon', 'قريبًا', 'data-tool-placeholder'):
                    self.assertNotIn(soon, html)
        # The cement page was replaced by the paint calculator.
        for prefix in ('', '/ar'):
            response = self.client.get(f'{prefix}/free-tools/cement/')
            self.assertEqual((response.status_code, response['Location']), (302, f'{prefix}/free-tools/'))

    def test_calculator_originals_and_their_logic(self):
        # The originals stay as they are; the modules carry their data and formulas word for word.
        # (Every figure on the pages is compared with the originals by tools/calc-tests/run.py.)
        import hashlib
        import os

        from django.conf import settings

        tools_dir = os.path.join(settings.BASE_DIR, 'static', 'Tools')
        js_dir = os.path.join(settings.BASE_DIR, 'static', 'js', 'tools')
        originals = {
            'bricks': ('brick-calculator.txt', '1216817fa653fef11df590c00dd777cf', ('var BRICKS = [', 'var THICK')),
            'tiles': ('ceramic-calculator.txt', '49abfc48fe02596ca6198cc697bd7d4e', ('var TYPES = [', 'var $ =')),
            'wire': ('wire-calculator.txt', '6fa41a02581895acef5125d2efa19d91', ('var TYPES = [', 'var $ =')),
            'paint': ('paint-calculator.txt', '5a33720980b4a1b77a9655b8c13e6e0f', ('var PRODUCTS = [', 'var BRANDS')),
            'plaster': ('plaster-calculator.txt', '659d4227fe8a85ee2d9c46f324fe8b1e', ('var STAGES = [', 'var $ =')),
        }
        # Lines of each original's calc() that must appear unchanged in its module.
        formulas = {
            'bricks': ['var half = 10000 / ((b[1] + j) * (b[3] + j)), full = 10000 / ((b[2] + j) * (b[3] + j));',
                       'var a = Math.max(0, L * H - O);',
                       'var rate = t === THICK[1] ? full : t === THICK[2] ? half + full : half;',
                       'var gross = net * (1 + waste), buy = up(gross);',
                       'var cost = price === null ? null : buy / 1000 * price;'],
            'tiles': ['var a = L === null || W === null ? 0 : Math.max(0, L * W * n - o);',
                      'var ctn = function(w){ return t.area + t.sk === 0 || !t.C ? 0 : up((t.area * (1 + w + wX) + t.sk * (1 + w + wX + skX)) / t.C); };',
                      't.after = t.area * (1 + wAvg + wX) + t.sk * (1 + wAvg + wX + skX);',
                      't.cost = t.avg && t.P !== null ? t.avg * t.C * t.P : null;',
                      't.perCtn = t.L && t.W && t.C ? Math.round(t.C / (t.L * t.W / 10000)) : null;',
                      't.pieces = t.L && t.W ? up(t.after / (((t.L + j / 10) * (t.W + j / 10)) / 10000)) : 0;',
                      'var all = tot.cost === null ? null : tot.cost + (glueCost || 0);'],
            'wire': ['var factor = (area === null || !ref) ? 1 : area / ref;',
                     'var L = bySize[s], D = L * (1 + wavg);',
                     'var mn = roll ? up(L * (1 - margin) * (1 + wmin) / roll) : 0;',
                     'var av = roll ? up(D / roll) : 0;',
                     'var mx = roll ? up(L * (1 + margin) * (1 + wmax) / roll) : 0;'],
            'paint': ['var O = openIn === null ? 0.125 * L * H : openIn;',
                      'var walls = Math.max(0, L * H - O);',
                      'var ceil = ceilIn === null ? 0.93 * flat : ceilIn;',
                      'var area = coats === 0 ? 0 : walls + (onCeil ? ceil : 0);',
                      'var qty = area * coats / p[2] * (1 + waste), packs = up(qty / p[3]);',
                      'var lab = labour === null ? 0 : total * labour, grand = mat + lab;',
                      'var anyPrice = mat > 0 || labour !== null;'],
            'plaster': ['var mortar = a * th / 1000, dry = mortar * f, parts = c + s;',
                        'var cemVol = parts ? dry * c / parts : 0, sand0 = parts ? dry * s / parts : 0;',
                        'var kg0 = cemVol * dens, kg = kg0 * (1 + w), bags = bag ? kg / bag : 0, sand = sand0 * (1 + w);',
                        'var a = g("a"), th = g("th"), c = g("c"), s = g("s"), w = g("w") / 100, f = g("f");',
                        'var buyBags = up(bags), buySand = step ? up(sand / step) * step : sand;'],
        }
        for slug, (name, md5, (first, last)) in originals.items():
            with open(os.path.join(tools_dir, name), 'rb') as f:
                raw = f.read()
            self.assertEqual(hashlib.md5(raw).hexdigest(), md5, f'{name} has changed')
            source = [line.strip() for line in raw.decode('utf-8').splitlines()]
            with open(os.path.join(js_dir, f'{slug}-calc.js'), encoding='utf-8') as f:
                module = [line.strip() for line in f.read().splitlines()]
            start = next(i for i, line in enumerate(source) if line.startswith(first))
            end = next(i for i in range(start + 1, len(source)) if source[i].startswith(last))
            data = [line for line in source[start:end] if line]
            at = module.index(data[0])
            self.assertEqual(module[at:at + len(data)], data, f'{slug}: data differs from {name}')
            for line in formulas[slug] + ['var up = function(x){ return Math.ceil(x - 1e-9); }; // ROUNDUP(x,0) for x >= 0']:
                self.assertIn(line, source, f'{slug}: not in {name}: {line}')
                self.assertIn(line, module, f'{slug}: not in the module: {line}')

    def test_calculator_regression_in_browser(self):
        # Opt-in (needs Chrome, takes a few minutes): every scenario on the originals vs the new pages.
        import os
        import subprocess
        import sys
        import unittest

        if os.environ.get('CALC_BROWSER_TESTS') != '1':
            raise unittest.SkipTest('set CALC_BROWSER_TESTS=1 to run tools/calc-tests/run.py in headless Chrome')
        from django.conf import settings

        runner = os.path.join(settings.BASE_DIR, 'tools', 'calc-tests', 'run.py')
        for mode in ('pure', 'check'):
            result = subprocess.run([sys.executable, runner, mode], capture_output=True, text=True, encoding='utf-8', errors='replace')
            self.assertEqual(result.returncode, 0, result.stdout[-3000:] + result.stderr[-2000:])

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
                self.assertIn(f'<a class="svc-cell__link" href="{prefix}/services/#{service["slug"]}">', section)
            self.assertIn(f'<a class="svc-panel__more" href="{prefix}/services/">', section)  # Explore services
            # Free Services: each tool opens its calculator.
            for slug in ('wire', 'tiles', 'bricks', 'paint', 'plaster'):
                self.assertIn(f'<a class="svc-cell__link" href="{prefix}/free-tools/{slug}/">', section)
            self.assertNotIn('svc-cell__status', section)
            self.assertEqual(section.count('class="svc-cell__icon"'), 5)
            self.assertIn(f'<a class="svc-panel__more" href="{prefix}/free-tools/">', section)  # Explore free tools
            header = html[html.index('<header class="site-header'):html.index('</header>')]
            footer = html[html.index('<footer'):html.index('</footer>')]
            self.assertIn(f'href="{prefix}/services/"', header)
            self.assertIn(f'href="{prefix}/services/"', footer)
            self.assertNotIn('href="#services"', header + footer)
            self.assertIn('href="#projects"', header)  # in-page sections still work on the homepage

    def test_homepage_services_copy(self):
        en = self.get('core:home')
        en = en[en.index('id="services"'):en.index('id="process"')]
        for text in ('>Our Services<', 'Considered design. Complete execution.', 'From the first plan to the finishing details.',
                     'Studio Services', 'Explore services', 'Layouts shaped around your needs.',
                     'See your space before execution.', 'Materials and finishes brought to life.',
                     'Prepare your space for everyday use.', 'Plan your project', '>Free Services<',
                     'Start with an initial material estimate.', 'Estimate electrical wire quantities.',
                     'Plan tiles for floors and walls.', 'Calculate initial brick quantities.',
                     'Estimate paint quantities and cost.', 'Explore free tools'):
            self.assertIn(text, en)
        # Order: 2D, 3D, Interior Finishing, Fit-Out; then Wire, Tile, Brick, Paint.
        self.assertEqual(re.findall(r'<a class="svc-cell__link" href="/services/#[^"]+">([^<]+)<', en),
                         ['2D Design', '3D Design', 'Interior Finishing', 'Fit-Out'])
        self.assertEqual(re.findall(r'<a class="svc-cell__link" href="/free-tools/[^"]+">([^<]+)<', en),
                         ['Wire Calculator', 'Tile Calculator', 'Brick Calculator', 'Paint Calculator', 'Plaster Calculator'])
        ar = self.get('core:home_ar')
        for text in ('خدماتنا', 'تصميم مدروس. تنفيذ متكامل.', 'خدمات الاستوديو', 'الخدمات المجانية',
                     'حاسبة الأسلاك', 'احسب كميات الطوب المبدئية.', 'حاسبة الدهانات', 'استكشف الأدوات المجانية'):
            self.assertIn(text, ar)

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
            self.assertIn('src="/static/images/brand/gindi-monogram-transparent.png', html)
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

    def test_process_has_the_six_step_workflow(self):
        en_titles = ['A Call &amp; a Free Site Visit', 'Agreement &amp; Initial Design',
                     'Design Meetings &amp; Revisions', 'Materials &amp; Price Approval',
                     'Purchasing &amp; Execution', 'Handover &amp; Follow-Up']
        ar_titles = ['اتصال وزيارة مجانية للموقع', 'الاتفاق والتصميم المبدئي', 'اجتماعات التصميم والتعديلات',
                     'اعتماد الخامات والأسعار', 'الشراء والتنفيذ', 'التسليم والمتابعة']
        for name, heading, titles in (('core:home', 'From Our First Call to After Handover', en_titles),
                                      ('core:home_ar', 'من أول اتصال حتى ما بعد التسليم', ar_titles)):
            html = self.get(name)
            section = html[html.index('id="process"'):html.index('id="about"')]
            self.assertIn(f'id="process-title" data-reveal>{heading}</h2>', section)  # confirmed copy: no badge
            self.assertEqual(section.count('<li class="step"'), 6)
            self.assertEqual(re.findall(r'step__index">(\d+)<', section), ['01', '02', '03', '04', '05', '06'])
            self.assertEqual(re.findall(r'<h3 class="step__title">([^<]+)</h3>', section), titles)
        en = self.get('core:home')
        self.assertIn('We work through every stage with you—from understanding your needs and refining the '
                      'design to approving materials and completing the work.', en)
        self.assertIn('Then we arrange a free site visit to see the space in person.', en)
        self.assertIn('we review them with you and follow through on the adjustments.', en)

    def test_only_confirmed_contact_links(self):
        # The business email is the only confirmed contact link; no phone links.
        for name in ('core:home', 'core:home_ar'):
            html = self.get(name)
            self.assertEqual(set(re.findall(r'mailto:[^"]*', html)), {'mailto:Gindistudio@outlook.com'})
            self.assertNotIn('tel:', html)

class PublicContentTests(SimpleTestCase):
    """What visitors see by default: no editorial notes, no dummy blocks, honest states."""

    PAGES = ['/', '/ar/', '/about/', '/ar/about/', '/services/', '/ar/services/', '/free-tools/', '/ar/free-tools/',
             *[f'{p}/free-tools/{s}/' for p in ('', '/ar') for s in ('wire', 'tiles', 'bricks', 'paint', 'plaster')]]
    # Editing notes and temporary-content annotations, English and Arabic.
    # (word boundary: "temporary" alone, not inside the style name "Contemporary".)
    EDITORIAL = re.compile(r'(?i)placeholder|ph-badge|to be (?:added|confirmed)|\btemporary|published here|'
                           r'replace later|sample image|demo content|lorem|'
                           r'محتوى مؤقت|قيد التأكيد|ستُضاف|سيُضاف|مؤقتة|ستُنشر|لاحقًا')

    def visible_text(self, html):
        html = re.sub(r'(?s)<(script|style)\b.*?</\1>|<!--.*?-->', ' ', html)
        return re.sub(r'<[^>]+>', ' ', html)

    # Projects is shown with placeholder entries at the studio's request, so
    # this scan covers the rest of the site (Projects switched off).
    @mock.patch.object(project_data, 'PUBLISHED', False)
    def test_no_editorial_notes_on_any_public_page(self):
        for path in self.PAGES + ['/no-such-page/', '/ar/no-such-page/']:
            html = self.client.get(path).content.decode()
            # Visible text plus alt/title/aria text (class names are styling hooks, never shown).
            found = self.EDITORIAL.findall(self.visible_text(html)) + self.EDITORIAL.findall(
                ' '.join(re.findall(r'(?:alt|title|aria-label|placeholder)="([^"]*)"', html)))
            self.assertEqual(found, [], path)

    def test_projects_shown_by_default(self):
        self.assertTrue(project_data.PUBLISHED)
        for home, prefix in (('/', ''), ('/ar/', '/ar')):
            html = self.client.get(home).content.decode()
            self.assertIn('id="projects"', html)
            self.assertIn(f'href="{prefix}/projects/"', html)
            # Services (02) shows no number in its own header (design); Process, About, Contact do.
            self.assertEqual(re.findall(r'<span class="num">(\d+)</span>\s*<span class="keystone"', html),
                             ['03', '04'])
            self.assertEqual(self.client.get(f'{prefix}/projects/project-1/').status_code, 200)

    @mock.patch.object(project_data, 'PUBLISHED', False)
    def test_projects_can_be_switched_off(self):
        for home, prefix in (('/', ''), ('/ar/', '/ar')):
            html = self.client.get(home).content.decode()
            self.assertNotIn('id="projects"', html)
            self.assertNotIn('/projects/', html)
            self.assertNotIn('projects-carousel.js', html)
            self.assertNotIn('hero__scroll', html)  # the hero has no scroll cue
            # Numbered sections start at 01 without Projects.
            self.assertEqual(re.findall(r'<span class="num">(\d+)</span>\s*<span class="keystone"', html),
                             ['02', '03'])  # Services (01) shows no number in its own header
            for path in (f'{prefix}/projects/', f'{prefix}/projects/project-1/'):
                self.assertEqual(self.client.get(path).status_code, 404, path)
            self.assertNotIn('/projects/', self.client.get(f'{prefix}/no-such-page/').content.decode())
            self.assertNotIn('/projects/', self.client.get(f'{prefix}/about/').content.decode())

    def test_contact_shows_only_confirmed_details(self):
        mail = 'href="mailto:Gindistudio@outlook.com" dir="ltr"'
        for path, title, label in (('/', 'Let’s discuss your project.', 'Email'), ('/ar/', 'خلّينا نتكلم عن مشروعك.', 'البريد الإلكتروني'),
                                   ('/services/', 'Let’s discuss your project.', 'Email'),
                                   ('/ar/about/', 'خلّينا نتكلم عن مشروعك.', 'البريد الإلكتروني')):
            html = self.client.get(path).content.decode()
            self.assertEqual(html.count('id="contact"'), 1, path)  # the shared call to action, on every page
            self.assertIn(f'id="footer-cta-title">{title}</h2>', html)
            # The one confirmed detail: the business email, linked, in the call to action and the footer.
            cta = html[html.index('id="contact"'):html.index('<footer')]
            self.assertEqual(cta.count('<div><dt'), 1)
            self.assertIn(f'<dt class="label">{label}</dt><dd><a class="footer-cta__link" {mail}>Gindistudio@outlook.com</a></dd>', cta)
            footer = html[html.index('<footer'):html.index('</footer>')]
            self.assertIn(f'<a class="site-footer__mail" {mail}>', footer)
            self.assertLess(html.index('id="contact"'), html.index('<footer'))
        # The Contact page has no call to action: the email is in its panel, and in the footer.
        for path, label in (('/contact/', 'Email'), ('/ar/contact/', 'البريد الإلكتروني')):
            html = self.client.get(path).content.decode()
            self.assertNotIn('footer-cta__details', html)
            self.assertIn(f'<span class="cp-panel__mail-label label">{label}</span>', html)
            self.assertIn(f'<a class="cp-panel__mail-link" {mail}>Gindistudio@outlook.com</a>', html)
            self.assertIn('class="site-footer__mail"', html)

    def test_unfinished_features_stay_honest(self):
        services = self.client.get('/services/').content.decode()
        self.assertIn('Online enquiries are not available yet, so this form cannot be sent.', services)
        self.assertRegex(services, r'class="btn btn--primary enquiry-form__send" type="submit" disabled')
        self.assertNotIn('data-whatsapp', services)
        self.assertIn('إرسال الاستفسارات عبر الموقع غير متاح بعد', self.client.get('/ar/services/').content.decode())
        # The calculators work, so none of them says "Coming soon" any more.
        for prefix in ('', '/ar'):
            for slug in ('wire', 'tiles', 'bricks', 'paint', 'plaster'):
                tool = self.client.get(f'{prefix}/free-tools/{slug}/').content.decode()
                self.assertNotIn('Coming soon', tool)
                self.assertNotIn('قريبًا', tool)

    def test_generated_images_keep_their_disclosure(self):
        html = self.client.get('/').content.decode()
        self.assertNotIn('not a studio project', html)  # the hero's note was removed at the studio's request
        about = html[html.index('id="about"'):html.index('id="contact"')]
        self.assertIn('<figcaption class="media__tag" aria-hidden="true">Illustrative image</figcaption>', about)
        self.assertIn('alt="Illustrative image:', about)
        self.assertIn('صورة توضيحية', self.client.get('/ar/').content.decode())


class DesignStudioTests(SimpleTestCase):
    """GINDI Design Studio: the catalogue (apps/core/studio.py), the guide's scoring and the page."""

    def test_catalogue_is_complete_and_valid(self):
        import itertools
        import os

        from django.conf import settings

        from . import studio
        self.assertEqual(studio.validate(), [])
        styles = studio.available_styles()
        self.assertEqual([s['id'] for s in styles], ['classic', 'modern', 'organic_modern'])
        self.assertEqual([s['name']['ar'] for s in styles], ['كلاسيك', 'مودرن', 'مودرن عضوي'])
        combinations = set()
        for s in styles:
            room = os.path.join(settings.BASE_DIR, 'static', 'studio', 'rooms', s['id'])
            for f in studio.ROOM_FILES:
                self.assertTrue(os.path.isfile(os.path.join(room, f)), (s['id'], f))
            default = next(p for p in s['presets'] if p['id'] == s['default_preset'])
            for slot in studio.SLOTS:
                options = s['materials'][slot]
                self.assertEqual(len(options), 4, (s['id'], slot))
                self.assertTrue(options[0].get('original'), (s['id'], slot))  # the default is the image as supplied
                self.assertEqual(default[slot], options[0]['id'])
                for m in options[1:]:
                    if slot == 'stone':
                        self.assertTrue(m.get('scan'), m['id'])  # a real scan, not a tint
            for u, st, w in itertools.product(*(s['materials'][slot] for slot in studio.SLOTS)):
                combinations.add((s['id'], u['id'], st['id'], w['id']))
            self.assertEqual(len([c for c in combinations if c[0] == s['id']]), studio.combinations(s))
            # Every control is named and in display order, once.
            self.assertEqual(sorted(c[0] for c in s['controls']), sorted(studio.SLOTS))
        self.assertEqual(len(combinations), sum(studio.combinations(s) for s in styles))
        self.assertEqual(len(combinations), 192)  # three controls with four options in each style
        by_id = {s['id']: s for s in styles}
        # Classic: sofa and armchairs keep their two-tone patterns (ground and motif colours per zone);
        # the third control is the gilded "Furniture finish", with metal finishes and one wood tone.
        classic = by_id['classic']
        self.assertEqual(len(classic['render']['upholstery']['zones']), 2)
        self.assertTrue(all(len(m['colors']) == 2 and all(len(c) == 2 for c in m['colors']) for m in classic['materials']['upholstery'][1:]))
        self.assertEqual(dict((c[0], c[1]['en']) for c in classic['controls'])['wood'], 'Furniture finish')
        self.assertEqual([m.get('finish') for m in classic['materials']['wood'][1:]], ['metal', 'metal', 'wood'])
        # Modern: sofa and cream armchair, then the olive armchair, each with its own colour; no option
        # claims leather (the seats are fabric).
        modern = by_id['modern']
        self.assertTrue(all(len(m['colors']) == 2 for m in modern['materials']['upholstery'][1:]))
        self.assertFalse(any('leather' in m['name']['en'].lower() for m in modern['materials']['upholstery']))
        # Organic Modern: no exposed wood, so its third control is the accent chairs' fabric.
        organic = by_id['organic_modern']
        self.assertEqual(dict((c[0], c[1]['en']) for c in organic['controls'])['wood'], 'Accent chairs')
        self.assertEqual(organic['render']['wood']['kind'], 'fabric')
        # Round tables: the stone is mapped per part (a planar top, then curved sides / base), not one warp.
        for s in styles:
            self.assertEqual(s['render']['stone']['parts'][0]['type'], 'plane')
        self.assertEqual([p['type'] for p in modern['render']['stone']['parts']], ['plane', 'curve', 'curve'])
        self.assertEqual([p['type'] for p in organic['render']['stone']['parts']], ['plane', 'curve'])

    def test_guide_scoring_is_deterministic_and_reaches_every_style(self):
        import itertools
        import os

        from django.conf import settings

        from . import studio
        self.assertEqual(len(studio.QUIZ), 5)
        style_ids = {s['id'] for s in studio.STYLES}
        for q in studio.QUIZ:
            self.assertEqual(len(q['answers']), 3, q['id'])
            for a in q['answers']:
                self.assertTrue(set(a['points']) <= style_ids, a['id'])
                f = studio.quiz_image(a['image'])
                self.assertTrue(os.path.isfile(os.path.join(settings.BASE_DIR, 'static', *f.split('/'))), f)
        # The documented examples.
        self.assertEqual(studio.recommend({'mood': 'formal', 'shapes': 'carved', 'materials': 'damask', 'detail': 'ornate', 'palette': 'blue_ivory'}),
                         ('classic', None))
        self.assertEqual(studio.recommend({'mood': 'grounded', 'shapes': 'tailored', 'materials': 'walnut', 'detail': 'balanced', 'palette': 'earthy'}),
                         ('modern', None))
        self.assertEqual(studio.recommend({'mood': 'serene', 'shapes': 'sculptural', 'materials': 'textured', 'detail': 'minimal', 'palette': 'soft_white'}),
                         ('organic_modern', None))
        self.assertEqual(studio.recommend({'mood': 'formal', 'shapes': 'sculptural', 'materials': 'textured', 'detail': 'minimal', 'palette': 'blue_ivory'}),
                         ('classic', 'organic_modern'))  # C 7, M 1, O 7: a tie keeps the catalogue order
        # All 243 answer sets: every style can be recommended; the rule never depends on chance.
        winners = set()
        for picks in itertools.product(*([a['id'] for a in q['answers']] for q in studio.QUIZ)):
            answers = dict(zip([q['id'] for q in studio.QUIZ], picks))
            first, second = studio.recommend(answers)
            self.assertEqual((first, second), studio.recommend(answers))
            totals = studio.score(answers)
            self.assertEqual(totals[first], max(totals.values()))
            winners.add(first)
        self.assertEqual(winners, style_ids)

    def test_page_in_both_languages(self):
        import json
        from collections import Counter
        for path, lang, dir_, title in (('/design-studio/', 'en', 'ltr', 'Your Space. Your Signature.'),
                                        ('/ar/design-studio/', 'ar', 'rtl', 'مساحتك. بصمتك.')):
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200, path)
            html = response.content.decode()
            self.assertIn(f'<html lang="{lang}" dir="{dir_}"', html)
            self.assertIn(title, html)
            self.assertEqual(html.count('data-ds-card="'), 3)
            self.assertEqual(html.count('data-ds-panel="'), 3)
            self.assertEqual(html.count('role="radio"'), 36)
            self.assertIn('data-ds-quiz', html)
            self.assertIn('data-ds-full-dialog', html)  # the image at full size
            duplicates = [k for k, n in Counter(re.findall(r'\sid="([^"]+)"', html)).items() if n > 1]
            self.assertEqual(duplicates, [], path)
            data = json.loads(re.search(r'<script id="studio-data" type="application/json">(.*?)</script>', html, re.S).group(1))
            self.assertEqual(len(data['styles']), 3)
            self.assertEqual(len(data['quiz']['questions']), 5)
            self.assertTrue(all(s['preview'] and s['room']['photo'] for s in data['styles']))
            self.assertEqual([s['name'] for s in data['styles']],
                             ['Classic', 'Modern', 'Organic Modern'] if lang == 'en' else ['كلاسيك', 'مودرن', 'مودرن عضوي'])
            self.assertIn('Furniture finish' if lang == 'en' else 'تشطيب الأثاث', html)
            self.assertIn('Accent chairs' if lang == 'en' else 'الكراسي المميزة', html)
            self.assertEqual(sum(s['combinations'] for s in data['styles']), 192)
            # Honest labelling: an AI-generated concept image, not a completed project.
            self.assertIn('AI-generated concept image, not a photograph of a completed GINDI project' if lang == 'en'
                          else 'صورة تصوّرية مولّدة بالذكاء الاصطناعي، وليست صورة لمشروع منفذ لجيندي', html)
            self.assertNotIn('100%', html)
            self.assertIn('not a personality assessment' if lang == 'en' else 'وليس تقييمًا للشخصية', data['labels']['quiz']['disclaimer'])

    def test_homepage_invites_to_the_studio(self):
        for home, prefix in (('/', ''), ('/ar/', '/ar')):
            html = self.client.get(home).content.decode()
            self.assertIn('id="design-studio"', html)
            self.assertIn(f'href="{prefix}/design-studio/#discover"', html)
            self.assertIn(f'href="{prefix}/design-studio/"', html)
            self.assertLess(html.index('id="design-studio"'), html.index('id="services"'))


class DeploymentTests(SimpleTestCase):
    """Preview/production plumbing: noindex, robots, errors."""

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
        self.assertIn('images/brand/favicon-g-32.png', response['Location'])

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

class StaticExportTests(SimpleTestCase):
    """manage.py export_static: the Cloudflare Pages preview build."""

    def test_export_writes_every_page_404s_redirects_and_headers(self):
        import shutil
        import tempfile
        from pathlib import Path

        from django.core.management import call_command

        tmp = Path(tempfile.mkdtemp())
        try:
            storages = {'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
                        'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'}}
            with self.settings(STATIC_ROOT=tmp / 'collected', STORAGES=storages):
                with mock.patch.object(project_data, 'PUBLISHED', False):
                    call_command('export_static', output=str(tmp / 'dist'), base_url='https://preview.example',
                                 verbosity=0)
                # With Projects on, their pages are exported too.
                with mock.patch.object(project_data, 'PUBLISHED', True):
                    call_command('export_static', output=str(tmp / 'published' / 'dist'),
                                 base_url='https://preview.example', verbosity=0)
            published = tmp / 'published' / 'dist'
            for page in ('projects/index.html', 'projects/project-1/index.html', 'ar/projects/project-4/index.html'):
                self.assertTrue((published / page).is_file(), page)
            self.assertEqual(len(list(published.rglob('index.html'))), 32)
            dist = tmp / 'dist'
            for page in ('index.html', 'ar/index.html', 'about/index.html', 'services/index.html',
                         'contact/index.html', 'ar/contact/index.html', 'free-tools/index.html', 'free-tools/wire/index.html', 'ar/free-tools/paint/index.html',
                         '404.html', 'ar/404.html', 'robots.txt'):
                self.assertTrue((dist / page).is_file(), page)
            # Projects switched off: no project pages at all.
            self.assertFalse((dist / 'projects').exists())
            self.assertFalse((dist / 'ar' / 'projects').exists())
            self.assertEqual(len(list(dist.rglob('index.html'))), 22)
            # The Design Studio: both pages, its modules by bare name (import map) and its assets.
            studio_page = (dist / 'design-studio' / 'index.html').read_text(encoding='utf-8')
            self.assertTrue((dist / 'ar' / 'design-studio' / 'index.html').is_file())
            self.assertRegex(studio_page, r'"gindi/compositor": "/static/studio/compositor\.[0-9a-f]{12}\.js"')
            static_dir = dist / 'static' / 'studio'
            for style in ('classic', 'modern', 'organic_modern'):
                for name in ('photo', 'mask', 'light', 'zone'):
                    self.assertTrue(list((static_dir / 'rooms' / style).glob(f'{name}.*.*')), (style, name))
            self.assertEqual(len(list((static_dir / 'materials').glob('*/color.*.webp'))), 9)  # the stone scans in use
            # Cloudflare serves files of at most 25 MiB.
            biggest = max(f.stat().st_size for f in (dist / 'static').rglob('*') if f.is_file())
            self.assertLess(biggest, 25 * 1024 * 1024)
            home = (dist / 'index.html').read_text(encoding='utf-8')
            self.assertIn('href="https://preview.example/ar/"', home)
            self.assertRegex(home, r'/static/css/base\.[0-9a-f]{12}\.css')
            self.assertIn('This page could not be found.', (dist / '404.html').read_text(encoding='utf-8'))
            self.assertIn('lang="ar"', (dist / 'ar/404.html').read_text(encoding='utf-8'))
            redirects = (dist / '_redirects').read_text()
            self.assertIn('/free-estimate/ /free-tools/ 301', redirects)
            self.assertIn('/ar/free-estimate/ /ar/free-tools/ 301', redirects)
            self.assertIn('/free-tools/cement/ /free-tools/ 302', redirects)
            self.assertIn('/ar/free-tools/cement/ /ar/free-tools/ 302', redirects)
            # The calculators' scripts are published; the reference originals (static/Tools/) are not.
            for name in ('calc-ui', 'bricks-calc', 'bricks', 'tiles-calc', 'tiles', 'wire-calc', 'wire', 'paint-calc', 'paint',
                         'plaster-calc', 'plaster'):
                self.assertTrue(list((dist / 'static' / 'js' / 'tools').glob(f'{name}.*.js')), name)
            self.assertFalse((dist / 'static' / 'Tools').exists())
            self.assertRegex(redirects, r'/favicon.ico /static/images/brand/favicon-g-32\.[0-9a-f]{12}\.png 302')
            headers = (dist / '_headers').read_text()
            self.assertIn('X-Robots-Tag: noindex, nofollow', headers)
            self.assertIn('X-Frame-Options: DENY', headers)
            self.assertIn('Cache-Control: public, max-age=31536000, immutable', headers)
            self.assertFalse((dist / 'static' / 'admin').exists())
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

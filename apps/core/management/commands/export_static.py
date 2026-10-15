"""
Export the whole site as static files, for a static host such as Cloudflare
Pages (see docs/deployment-cloudflare.md).

Every page is rendered by the normal views (nothing is re-implemented) and
saved as <path>/index.html, next to:
- static/      collected static files (content-hashed names with
               config.settings.static_export)
- 404.html, ar/404.html   the branded 404 pages (the host serves the nearest one)
- robots.txt
- _redirects   the site's redirects (/free-estimate/, /favicon.ico)
- _headers     security headers, noindex while SITE_NOINDEX is on, caching

Routes are read from apps/core/urls.py, so a new page is exported
automatically; a new <slug> route must be added to SLUGS below, or the export
stops with an error instead of silently skipping it.
"""

import json
import os
import shutil
from pathlib import Path
from urllib.parse import urlparse

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.templatetags.static import static
from django.test import Client
from django.test.utils import override_settings
from django.urls import reverse
from django.views.generic import RedirectView

from apps.core import projects, tools
from apps.core import urls as core_urls

# The values of each <slug> route, by URL name (without the _ar suffix).
SLUGS = {
    'project': lambda: [project['slug'] for project in projects.PROJECTS],
    'free_tool': lambda: [tool['slug'] for tool in tools.TOOLS],
}

SECURITY_HEADERS = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'Cross-Origin-Opener-Policy': 'same-origin',
}


class Command(BaseCommand):
    help = 'Export every page, static file, 404 page, redirect and header rule for a static host.'

    def add_arguments(self, parser):
        parser.add_argument('--output', default=str(settings.BASE_DIR / 'dist'),
                            help='Output folder; it must be named "dist" (or be empty), as it is emptied first.')
        parser.add_argument('--base-url',
                            default=os.environ.get('SITE_URL') or os.environ.get('CF_PAGES_URL')
                            or 'https://gindi-website.pages.dev',
                            help='Public https:// address of the site (absolute links between EN and AR pages).')

    def handle(self, *args, output, base_url, **options):
        out = Path(output).resolve()
        base = urlparse(base_url)
        if base.scheme != 'https' or not base.hostname:
            raise CommandError(f'--base-url must be an https:// address, got {base_url!r}.')
        if out.exists():
            if out.name != 'dist' and any(out.iterdir()):
                raise CommandError(f'Refusing to empty {out}: use an empty folder or one named "dist".')
            shutil.rmtree(out)
        out.mkdir(parents=True)

        call_command('collectstatic', interactive=False, verbosity=0)
        hashed, static_count = self._copy_static(out)

        pages, redirects = self._routes()
        client = Client(HTTP_HOST=base.netloc)
        with override_settings(ALLOWED_HOSTS=[base.hostname]):
            for path in pages:
                response = client.get(path, secure=True)
                if response.status_code != 200:
                    raise CommandError(f'{path} returned {response.status_code}, expected 200.')
                self._write(out, path.lstrip('/') + 'index.html', response.content)

            robots = client.get('/robots.txt', secure=True)
            self._write(out, 'robots.txt', robots.content)

            # Branded 404s: the host serves the nearest 404.html up the tree.
            for prefix in ('', 'ar/'):
                response = client.get(f'/{prefix}__export-not-found__/', secure=True)
                if response.status_code != 404:
                    raise CommandError(f'Expected a 404 page for /{prefix}, got {response.status_code}.')
                self._write(out, prefix + '404.html', response.content)

            redirects.append(('/favicon.ico', static('images/brand/favicon-32.png'), 302))

        lines = []
        for source, target, status in redirects:
            lines.append(f'{source} {target} {status}')
            if source.endswith('/') and source != '/':
                lines.append(f'{source.rstrip("/")} {target} {status}')
        self._write(out, '_redirects', '\n'.join(lines) + '\n')

        headers = dict(SECURITY_HEADERS)
        if settings.SITE_NOINDEX:
            headers['X-Robots-Tag'] = 'noindex, nofollow'
        rules = ['/*'] + [f'  {name}: {value}' for name, value in headers.items()]
        if hashed:
            # Names change whenever the content does, so a year is safe.
            rules += ['', '/static/*', '  Cache-Control: public, max-age=31536000, immutable']
        self._write(out, '_headers', '\n'.join(rules) + '\n')

        self.stdout.write(self.style.SUCCESS(
            f'Exported {len(pages)} pages, {static_count} static files, 2 404 pages and '
            f'{len(redirects)} redirects to {out} (site address {base.scheme}://{base.netloc}, '
            f'noindex {"on" if settings.SITE_NOINDEX else "off"}).'))

    def _routes(self):
        """Pages and redirects from apps/core/urls.py."""
        pages, redirects = [], []
        for pattern in core_urls.urlpatterns:
            view_class = getattr(pattern.callback, 'view_class', None)
            if view_class is not None and issubclass(view_class, RedirectView):
                init = pattern.callback.view_initkwargs
                status = 301 if init.get('permanent') else 302
                redirects.append(('/' + str(pattern.pattern), reverse(init['pattern_name']), status))
                continue
            url_name = f'{core_urls.app_name}:{pattern.name}'
            if pattern.pattern.converters:
                key = pattern.name.removesuffix('_ar')
                if key not in SLUGS:
                    raise CommandError(f'URL "{pattern.name}" takes parameters: add its values to SLUGS.')
                pages += [reverse(url_name, kwargs={'slug': slug}) for slug in SLUGS[key]()]
            else:
                pages.append(reverse(url_name))
        return pages, redirects

    def _copy_static(self, out):
        """Copy collected static files (hashed names only, when available).
        Django admin's files are left out: there is no admin on a static host."""
        root = Path(settings.STATIC_ROOT)
        manifest = root / 'staticfiles.json'
        hashed = manifest.exists()
        if hashed:
            names = json.loads(manifest.read_text(encoding='utf-8'))['paths'].values()
        else:
            names = [p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()]
        names = sorted(n for n in set(names) if not n.startswith('admin/') and n != 'staticfiles.json')
        prefix = urlparse(settings.STATIC_URL).path.strip('/')
        for name in names:
            target = out / prefix / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(root / name, target)
        return hashed, len(names)

    @staticmethod
    def _write(out, relative, content):
        target = out / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(content, str):
            content = content.encode('utf-8')
        target.write_bytes(content)

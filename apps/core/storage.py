import os

from django.contrib.staticfiles import finders
from django.contrib.staticfiles.storage import StaticFilesStorage


class DevCacheBustingStorage(StaticFilesStorage):
    """Development only (config.settings.development): static URLs carry the
    file's modification time, e.g. /static/css/home.css?v=1760704952.

    runserver serves static files with Last-Modified but no Cache-Control, so
    browsers may reuse an old copy for a while; after an edit they would show
    new markup with old CSS. A changed file now gets a new URL. Production
    uses content-hashed names instead (production.py, static_export.py).
    """

    def url(self, name):
        url = super().url(name)
        path = finders.find(name)
        if path and os.path.isfile(path):
            url += f'?v={int(os.path.getmtime(path))}'
        return url

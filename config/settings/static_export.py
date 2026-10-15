"""
Settings for exporting the site as static files (Cloudflare Pages preview).

Used only by `manage.py export_static` (see cloudflare-build.sh and
docs/deployment-cloudflare.md). Every page is rendered by the normal Django
views and saved as HTML.
"""

from .base import *  # noqa: F401,F403

DEBUG = False
ALLOWED_HOSTS = ['*']

# The pages make no database queries, so no database is configured: the
# dummy backend needs no driver (Cloudflare's build Python has no sqlite3)
# and raises an error if anything ever tries to query.
DATABASES = {'default': {'ENGINE': 'django.db.backends.dummy'}}

# Content-hashed file names, so the host can cache static files for a year.
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'},
}

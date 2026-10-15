"""
Production settings (also used for the Render staging preview).

All values come from environment variables; see .env.example and
docs/deployment-render.md.
"""

import os
from pathlib import Path

import dj_database_url
from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403
from .base import BASE_DIR, MIDDLEWARE, env_list, env_required

DEBUG = False

ALLOWED_HOSTS = env_list('DJANGO_ALLOWED_HOSTS')
CSRF_TRUSTED_ORIGINS = env_list('DJANGO_CSRF_TRUSTED_ORIGINS')

# Render sets RENDER_EXTERNAL_HOSTNAME (e.g. gindi-website.onrender.com) on
# every web service, so the preview URL works without listing it by hand.
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)
    CSRF_TRUSTED_ORIGINS.append(f'https://{RENDER_EXTERNAL_HOSTNAME}')

# Database. The site's pages make no database queries; only Django's admin,
# login sessions and permissions use one.
# - DATABASE_URL (preferred): e.g. postgresql://… or sqlite:///db.sqlite3
#   (a relative SQLite path is relative to the project root).
# - Otherwise POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD (+ HOST, PORT).
if os.environ.get('DATABASE_URL'):
    DATABASES = {'default': dj_database_url.parse(
        os.environ['DATABASE_URL'], conn_max_age=60, conn_health_checks=True)}
    if DATABASES['default']['ENGINE'] == 'django.db.backends.sqlite3':
        name = Path(DATABASES['default']['NAME'])
        DATABASES['default']['NAME'] = name if name.is_absolute() else BASE_DIR / name
elif os.environ.get('POSTGRES_DB'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': env_required('POSTGRES_DB'),
            'USER': env_required('POSTGRES_USER'),
            'PASSWORD': env_required('POSTGRES_PASSWORD'),
            'HOST': os.environ.get('POSTGRES_HOST', 'localhost'),
            'PORT': os.environ.get('POSTGRES_PORT', '5432'),
            'CONN_MAX_AGE': 60,
        }
    }
else:
    raise ImproperlyConfigured('Set DATABASE_URL (or POSTGRES_DB, POSTGRES_USER and POSTGRES_PASSWORD).')

# Static files: WhiteNoise serves the output of `collectstatic` from gunicorn,
# compressed (gzip + Brotli) and with content-hashed names that browsers may
# cache for a year.
MIDDLEWARE = list(MIDDLEWARE)
MIDDLEWARE.insert(MIDDLEWARE.index('django.middleware.security.SecurityMiddleware') + 1,
                  'whitenoise.middleware.WhiteNoiseMiddleware')
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
}

# HTTPS and cookie security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
# Render (like most hosts) ends HTTPS at its proxy and forwards plain HTTP
# with X-Forwarded-Proto. Without this, SECURE_SSL_REDIRECT loops forever.
# Only safe behind a proxy that always sets this header, as Render's does.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# HSTS makes browsers refuse plain HTTP for this domain for the given
# duration. Enable (e.g. 3600, then 31536000) only once HTTPS is confirmed
# working on the real domain; it is hard to undo.
SECURE_HSTS_SECONDS = int(os.environ.get('DJANGO_SECURE_HSTS_SECONDS', '0'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# Logging: everything goes to the console (stdout/stderr), which Render shows
# under the service's Logs. Unhandled errors (500s) are logged with their
# traceback by django.request; 404s as warnings.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'plain': {'format': '{asctime} {levelname} {name}: {message}', 'style': '{'},
    },
    'handlers': {
        'console': {'class': 'logging.StreamHandler', 'formatter': 'plain'},
    },
    'root': {'handlers': ['console'], 'level': 'WARNING'},
    'loggers': {
        'django': {'handlers': ['console'], 'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO'), 'propagate': False},
    },
}

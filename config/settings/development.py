"""
Local development settings. Never use these in production.

SQLite is used here deliberately for local development only;
production.py uses PostgreSQL.
"""

from .base import *  # noqa: F401,F403
from .base import BASE_DIR, env_list

DEBUG = True

# Extra hosts, e.g. this machine's LAN address to test from a phone on the same
# network: DJANGO_DEV_ALLOWED_HOSTS=192.168.100.2 (comma-separated, optional).
ALLOWED_HOSTS = ['localhost', '127.0.0.1', *env_list('DJANGO_DEV_ALLOWED_HOSTS')]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

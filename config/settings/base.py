"""
Shared Django settings for Gindi Innovations.

Environment-specific values live in development.py and production.py.
Sensitive values are read from environment variables (optionally loaded
from a local, git-ignored .env file).
"""

import os
import re
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

# config/settings/base.py -> project root is three levels up.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Real environment variables take precedence over values in .env.
load_dotenv(BASE_DIR / '.env', override=False)


def env_required(name):
    """Return an environment variable or fail loudly if it is missing."""
    value = os.environ.get(name)
    if not value:
        raise ImproperlyConfigured(f'Missing required environment variable: {name}')
    return value


def env_list(name, default=''):
    """Return a comma-separated environment variable as a list."""
    return [item.strip() for item in os.environ.get(name, default).split(',') if item.strip()]


def env_bool(name, default):
    """Return a true/false environment variable ('true', '1', 'yes', 'on')."""
    value = os.environ.get(name)
    if value is None or not value.strip():
        return default
    return value.strip().lower() in ('true', '1', 'yes', 'on')


SECRET_KEY = env_required('DJANGO_SECRET_KEY')

DEBUG = False

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'apps.core',
]

MIDDLEWARE = [
    # Outermost, so its header also reaches static files and redirects.
    'apps.core.middleware.NoIndexMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database: defined per environment (SQLite in development.py,
# PostgreSQL in production.py). Intentionally not set here.


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/
# Arabic support (LANGUAGES, LocaleMiddleware, RTL) is a future phase.

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Africa/Cairo'

USE_I18N = True

USE_TZ = True


# Static and media files
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Integration points, empty until connected (see docs/content-placeholders.md).
# Where the enquiry form posts (e.g. your form service's endpoint). Empty: the
# form is shown but cannot be sent, and says so; nothing pretends to send.
ENQUIRY_FORM_ACTION = os.environ.get('ENQUIRY_FORM_ACTION', '')
# The studio's WhatsApp number, international format, digits only (e.g. a
# number like 20XXXXXXXXXX for Egypt). Empty: no WhatsApp button is shown.
WHATSAPP_NUMBER = ''.join(ch for ch in os.environ.get('WHATSAPP_NUMBER', '') if ch.isdigit())
# The studio's email address for quotation requests ("Submit via Email" opens
# the visitor's email app addressed to it; there is no server-side email).
# Empty or not an email address: that button is disabled and says why.
QUOTATION_EMAIL = os.environ.get('QUOTATION_EMAIL', '').strip()
if not re.fullmatch(r'[^@\s]+@[^@\s]+\.[^@\s]+', QUOTATION_EMAIL):
    QUOTATION_EMAIL = ''
# The site's own form backend (worker/index.js on Cloudflare: Turnstile +
# Resend), e.g. /api/contact, and the public Turnstile site key. With both set,
# all three forms send there directly ("Send Request"). Either empty: the
# forms work as above (email app / WhatsApp; enquiry drawer per
# ENQUIRY_FORM_ACTION).
CONTACT_API_URL = os.environ.get('CONTACT_API_URL', '').strip()
if not re.match(r'(/[^/]|https://)', CONTACT_API_URL):
    CONTACT_API_URL = ''  # only a path on this site or an https:// address
TURNSTILE_SITE_KEY = os.environ.get('TURNSTILE_SITE_KEY', '').strip()
# Each free tool's agent script, loaded on its own page (/free-tools/<slug>/).
# Empty: that page shows an honest "Coming soon" state.
FREE_TOOL_SCRIPTS = {
    'wire': os.environ.get('FREE_TOOL_WIRE_SCRIPT_URL', ''),
    'tiles': os.environ.get('FREE_TOOL_TILES_SCRIPT_URL', ''),
    'bricks': os.environ.get('FREE_TOOL_BRICKS_SCRIPT_URL', ''),
    'cement': os.environ.get('FREE_TOOL_CEMENT_SCRIPT_URL', ''),
}

# Keep search engines out (X-Robots-Tag header, robots meta, robots.txt).
# On by default so previews are never indexed by accident; set
# SITE_NOINDEX=false only for the official launch.
SITE_NOINDEX = env_bool('SITE_NOINDEX', True)

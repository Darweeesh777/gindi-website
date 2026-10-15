#!/usr/bin/env bash
# Cloudflare Pages build command: bash cloudflare-build.sh   (output folder: dist)
# See docs/deployment-cloudflare.md.
set -o errexit
set -o nounset
set -o pipefail

python --version
pip install --quiet -r requirements.txt

# Django needs a secret key to start. The exported files use none of it
# (no logins, sessions or signed data), so a random one is made per build
# unless DJANGO_SECRET_KEY is set; it is never stored.
if [[ -z "${DJANGO_SECRET_KEY:-}" ]]; then
  DJANGO_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(50))')"
  export DJANGO_SECRET_KEY
fi

# Public address used in links between the English and Arabic pages.
export SITE_URL="${SITE_URL:-https://gindi-website.pages.dev}"

DJANGO_SETTINGS_MODULE=config.settings.static_export python manage.py export_static --output dist

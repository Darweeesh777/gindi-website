#!/usr/bin/env bash
# Render build command: bash build.sh  (see docs/deployment-render.md)
set -o errexit
set -o nounset
set -o pipefail

pip install --upgrade pip
pip install -r requirements.txt

# Hashed, compressed static files for WhiteNoise (fails the build if a
# referenced file is missing).
python manage.py collectstatic --noinput

# Database tables for Django's admin and sessions (the pages themselves use
# none). With the staging SQLite database this runs on a fresh file each build.
python manage.py migrate --noinput

# Optional admin account: only if DJANGO_SUPERUSER_USERNAME and
# DJANGO_SUPERUSER_PASSWORD (and optionally DJANGO_SUPERUSER_EMAIL) are set
# in Render's Environment settings. Never put these values in the repository.
if [[ -n "${DJANGO_SUPERUSER_USERNAME:-}" && -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]]; then
  python manage.py createsuperuser --noinput --email "${DJANGO_SUPERUSER_EMAIL:-}" \
    || echo "Admin account not created (it may already exist)."
fi

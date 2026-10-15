"""Gunicorn settings (start command: gunicorn -c gunicorn.conf.py config.wsgi:application)."""
import os

# Render passes the port to listen on in PORT (10000 by default).
bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"

# Render's free instance is small (512 MB): 2 worker processes x 2 threads.
# Each page renders in a few milliseconds with no database queries.
workers = int(os.environ.get('WEB_CONCURRENCY', '2'))
threads = int(os.environ.get('GUNICORN_THREADS', '2'))
timeout = 30
graceful_timeout = 20

# Access and error logs to stdout/stderr (Render > Logs).
accesslog = '-'
errorlog = '-'
loglevel = os.environ.get('GUNICORN_LOG_LEVEL', 'info')

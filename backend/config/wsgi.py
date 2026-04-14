"""
WSGI config for the Real-Time Chat System.
Used for traditional HTTP-only deployment (Gunicorn).
"""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()

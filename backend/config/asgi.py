"""
ASGI config for the Real-Time Chat System.
Routes HTTP requests to Django and WebSocket connections to Channels.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

from chat.routing import websocket_urlpatterns as chat_ws_patterns
from notifications.routing import websocket_urlpatterns as notification_ws_patterns
from middleware.websocket_auth import JWTAuthMiddleware

django_asgi_app = get_asgi_application()

# Combine all WebSocket URL patterns
all_websocket_patterns = chat_ws_patterns + notification_ws_patterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(
            URLRouter(all_websocket_patterns)
        )
    ),
})

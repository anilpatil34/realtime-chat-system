"""
JWT Authentication Middleware for Django Channels WebSocket connections.
Extracts and validates JWT token from the WebSocket query string.
"""
import logging
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

logger = logging.getLogger('chat')
User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_string):
    """Validate JWT token and return the associated user."""
    try:
        token = AccessToken(token_string)
        user_id = token['user_id']
        user = User.objects.get(id=user_id)
        return user
    except Exception as e:
        logger.warning(f"WebSocket JWT auth failed: {e}")
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware for Django Channels that authenticates
    WebSocket connections using JWT tokens passed as query parameters.

    Usage: ws://host/ws/chat/1/?token=<jwt_access_token>
    """

    async def __call__(self, scope, receive, send):
        # Parse query string for token
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token_list = query_params.get('token', [])

        if token_list:
            token = token_list[0]
            scope['user'] = await get_user_from_token(token)
            logger.info(f"WebSocket auth: user={scope['user']}")
        else:
            scope['user'] = AnonymousUser()
            logger.warning("WebSocket connection without token")

        return await super().__call__(scope, receive, send)

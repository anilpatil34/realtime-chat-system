"""
WebSocket consumer for real-time notifications.
Each user gets a personal notification channel.
"""
import json
import logging

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger('notifications')


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for per-user real-time notifications.
    Connects to a personal channel: notifications_{user_id}
    """

    async def connect(self):
        """Handle WebSocket connection."""
        self.user = self.scope.get('user', AnonymousUser())

        if isinstance(self.user, AnonymousUser) or not self.user.is_authenticated:
            logger.warning("Rejected unauthenticated notification WebSocket connection")
            await self.close()
            return

        self.notification_group_name = f'notifications_{self.user.id}'

        # Join personal notification group
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )

        await self.accept()
        logger.info(f"User {self.user.username} connected to notifications")

        # Send unread count on connect
        unread_count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': unread_count
        }))

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, 'notification_group_name'):
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """Handle incoming messages (mark as read, etc.)."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', '')

            if message_type == 'mark_read':
                notification_id = data.get('notification_id')
                if notification_id:
                    await self.mark_notification_read(notification_id)
                    unread_count = await self.get_unread_count()
                    await self.send(text_data=json.dumps({
                        'type': 'unread_count',
                        'count': unread_count
                    }))

            elif message_type == 'mark_all_read':
                await self.mark_all_read()
                await self.send(text_data=json.dumps({
                    'type': 'unread_count',
                    'count': 0
                }))

        except json.JSONDecodeError:
            logger.error("Invalid JSON in notification WebSocket")

    # Group message handlers
    async def new_notification(self, event):
        """Push a new notification to the client."""
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'notification': event['notification']
        }))

    async def unread_count_update(self, event):
        """Update unread count for the client."""
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': event['count']
        }))

    # Database operations
    @database_sync_to_async
    def get_unread_count(self):
        from .models import Notification
        return Notification.objects.filter(
            user=self.user, is_read=False
        ).count()

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        from .models import Notification
        try:
            notification = Notification.objects.get(
                id=notification_id, user=self.user
            )
            notification.mark_as_read()
        except Notification.DoesNotExist:
            pass

    @database_sync_to_async
    def mark_all_read(self):
        from .models import Notification
        Notification.objects.filter(
            user=self.user, is_read=False
        ).update(is_read=True)

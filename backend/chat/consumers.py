"""
WebSocket consumer for real-time chat messaging.
Handles chat messages, typing indicators, and read receipts via WebSocket.
"""
import json
import logging
from datetime import datetime

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

from .models import ChatRoom, Message, MessageReadReceipt

logger = logging.getLogger('chat')
User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat in a specific room.

    Supported message types:
    - chat_message: Send/receive chat messages
    - typing: Typing indicator events
    - read_receipt: Mark messages as read
    - user_online: User presence updates
    """

    async def connect(self):
        """Handle WebSocket connection."""
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope.get('user', AnonymousUser())

        # Reject anonymous connections
        if isinstance(self.user, AnonymousUser) or not self.user.is_authenticated:
            logger.warning(f"Rejected unauthenticated WebSocket connection to room {self.room_id}")
            await self.close()
            return

        # Verify user is a member of this room
        is_member = await self.check_room_membership()
        if not is_member:
            logger.warning(
                f"User {self.user.username} is not a member of room {self.room_id}"
            )
            await self.close()
            return

        # Join the room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Also join personal notification channel
        self.user_group_name = f'user_{self.user.id}'
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        await self.accept()

        # Mark user as online
        await self.set_user_online(True)

        # Notify room members about online status
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_online',
                'user_id': self.user.id,
                'username': self.user.username,
                'is_online': True,
            }
        )

        logger.info(f"User {self.user.username} connected to room {self.room_id}")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, 'room_group_name'):
            # Notify room members about offline status
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_online',
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'is_online': False,
                }
            )

            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

        # Mark user as offline
        if hasattr(self, 'user') and self.user.is_authenticated:
            await self.set_user_online(False)
            logger.info(f"User {self.user.username} disconnected from room {self.room_id}")

    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'chat_message')

            if message_type == 'chat_message':
                await self.handle_chat_message(data)
            elif message_type == 'typing':
                await self.handle_typing(data)
            elif message_type == 'read_receipt':
                await self.handle_read_receipt(data)
            else:
                logger.warning(f"Unknown message type: {message_type}")

        except json.JSONDecodeError:
            logger.error("Invalid JSON received via WebSocket")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'An error occurred processing your message'
            }))

    async def handle_chat_message(self, data):
        """Process and broadcast a new chat message."""
        content = data.get('message', '').strip()
        if not content:
            return

        # Save message to database
        message = await self.save_message(content)

        # Broadcast to room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message_id': message.id,
                'message': content,
                'sender_id': self.user.id,
                'sender_username': self.user.username,
                'sender_avatar': self.user.avatar.url if self.user.avatar else None,
                'timestamp': message.timestamp.isoformat(),
                'room_id': self.room_id,
            }
        )

        # Send notification to offline room members
        await self.send_message_notification(content, message.id)

        # Trigger auto-reply for demonstration
        try:
            await self.trigger_auto_reply(content)
        except Exception as e:
            logger.error(f"Error in trigger_auto_reply: {e}")

    async def trigger_auto_reply(self, content):
        bot_user = await self.get_other_member()
        if not bot_user:
            return
            
        import asyncio
        if not hasattr(self, '_bg_tasks'):
            self._bg_tasks = set()
            
        task = asyncio.create_task(self.simulate_bot_reply(bot_user, content))
        self._bg_tasks.add(task)
        task.add_done_callback(self._bg_tasks.discard)

    async def simulate_bot_reply(self, bot_user, previous_content):
        import asyncio
        await asyncio.sleep(0.5)
        
        # Broadcast typing
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user_id': bot_user.id,
                'username': bot_user.username,
                'is_typing': True,
                'room_id': self.room_id,
            }
        )
        
        await asyncio.sleep(2)
        
        reply_content = f"Auto-reply from {bot_user.username}: I received '{previous_content}'. Websockets working perfectly!"
        message = await self.save_bot_message(bot_user, reply_content)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message_id': message.id,
                'message': reply_content,
                'sender_id': bot_user.id,
                'sender_username': bot_user.username,
                'sender_avatar': bot_user.avatar.url if bot_user.avatar else None,
                'timestamp': message.timestamp.isoformat(),
                'room_id': self.room_id,
            }
        )
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user_id': bot_user.id,
                'username': bot_user.username,
                'is_typing': False,
                'room_id': self.room_id,
            }
        )

    async def handle_typing(self, data):
        """Broadcast typing indicator to room members."""
        is_typing = data.get('is_typing', False)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'username': self.user.username,
                'is_typing': is_typing,
                'room_id': self.room_id,
            }
        )

    async def handle_read_receipt(self, data):
        """Mark messages as read and broadcast read receipts."""
        message_ids = data.get('message_ids', [])
        if not message_ids:
            return

        await self.mark_messages_read(message_ids)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'read_receipt_update',
                'user_id': self.user.id,
                'username': self.user.username,
                'message_ids': message_ids,
                'read_at': datetime.now().isoformat(),
                'room_id': self.room_id,
            }
        )

    # =========================================================================
    # Group message handlers (called by channel_layer.group_send)
    # =========================================================================

    async def chat_message(self, event):
        """Send chat message to WebSocket client."""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message_id': event['message_id'],
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_username': event['sender_username'],
            'sender_avatar': event.get('sender_avatar'),
            'timestamp': event['timestamp'],
            'room_id': event['room_id'],
            'attachment': event.get('attachment'),
        }))

    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket client."""
        # Don't send typing indicator back to the sender
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'username': event['username'],
                'is_typing': event['is_typing'],
                'room_id': event['room_id'],
            }))

    async def read_receipt_update(self, event):
        """Send read receipt update to WebSocket client."""
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'user_id': event['user_id'],
            'username': event['username'],
            'message_ids': event['message_ids'],
            'read_at': event['read_at'],
            'room_id': event['room_id'],
        }))

    async def user_online(self, event):
        """Send user online/offline status to WebSocket client."""
        await self.send(text_data=json.dumps({
            'type': 'user_online',
            'user_id': event['user_id'],
            'username': event['username'],
            'is_online': event['is_online'],
        }))

    # =========================================================================
    # Database operations (sync_to_async wrappers)
    # =========================================================================

    @database_sync_to_async
    def check_room_membership(self):
        """Check if the user is a member of the current room."""
        return ChatRoom.objects.filter(
            id=self.room_id, members=self.user
        ).exists()

    @database_sync_to_async
    def save_message(self, content):
        """Save a new message to the database."""
        message = Message.objects.create(
            room_id=self.room_id,
            sender=self.user,
            content=content
        )
        # Update room's updated_at timestamp
        ChatRoom.objects.filter(id=self.room_id).update(
            updated_at=message.timestamp
        )
        return message

    @database_sync_to_async
    def get_other_member(self):
        """Get the other member in a direct chat."""
        room = ChatRoom.objects.get(id=self.room_id)
        if room.room_type == 'direct':
            return room.members.exclude(id=self.user.id).first()
        return None

    @database_sync_to_async
    def save_bot_message(self, bot_user, content):
        """Save a message from the bot."""
        message = Message.objects.create(
            room_id=self.room_id,
            sender=bot_user,
            content=content
        )
        ChatRoom.objects.filter(id=self.room_id).update(
            updated_at=message.timestamp
        )
        return message

    @database_sync_to_async
    def mark_messages_read(self, message_ids):
        """Mark messages as read and create read receipts."""
        messages = Message.objects.filter(
            id__in=message_ids,
            room_id=self.room_id
        ).exclude(sender=self.user)

        for message in messages:
            MessageReadReceipt.objects.get_or_create(
                message=message,
                user=self.user
            )
            if not message.is_read:
                message.is_read = True
                message.save(update_fields=['is_read'])

    @database_sync_to_async
    def set_user_online(self, is_online):
        """Update user's online status."""
        if is_online:
            self.user.set_online()
        else:
            self.user.set_offline()

    @database_sync_to_async
    def send_message_notification(self, content, message_id):
        """Create notifications for room members who are offline."""
        from notifications.models import Notification

        room = ChatRoom.objects.get(id=self.room_id)
        offline_members = room.members.exclude(
            id=self.user.id
        )

        notifications = []
        for member in offline_members:
            notifications.append(Notification(
                user=member,
                notification_type='message',
                title=f'New message from {self.user.username}',
                message=content[:100],
                related_room=room
            ))

        Notification.objects.bulk_create(notifications)

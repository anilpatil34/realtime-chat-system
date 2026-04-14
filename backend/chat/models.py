"""
Models for the chat system.
Includes ChatRoom, Message, and MessageReadReceipt.
"""
import logging
from django.conf import settings
from django.db import models

logger = logging.getLogger('chat')


class ChatRoom(models.Model):
    """
    Represents a chat room — either a direct (1-to-1) conversation
    or a group chat with multiple members.
    """
    ROOM_TYPE_CHOICES = [
        ('direct', 'Direct Message'),
        ('group', 'Group Chat'),
    ]

    name = models.CharField(max_length=255, blank=True, default='')
    room_type = models.CharField(
        max_length=10,
        choices=ROOM_TYPE_CHOICES,
        default='direct',
        db_index=True
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='chat_rooms',
        blank=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_rooms'
    )
    avatar = models.ImageField(
        upload_to='room_avatars/',
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Chat Room'
        verbose_name_plural = 'Chat Rooms'

    def __str__(self):
        if self.room_type == 'direct':
            members = self.members.all()[:2]
            names = ' & '.join([m.username for m in members])
            return f"DM: {names}"
        return f"Group: {self.name}"

    @property
    def last_message(self):
        """Get the most recent message in this room."""
        return self.messages.order_by('-timestamp').first()

    def get_unread_count(self, user):
        """Get count of unread messages for a specific user."""
        return self.messages.exclude(sender=user).filter(
            is_read=False
        ).count()


class Message(models.Model):
    """
    A single message within a chat room.
    """
    room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField(blank=True) # allow blank if there's only an attachment
    attachment = models.FileField(upload_to='message_attachments/', blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    is_read = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ['timestamp']
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"

    def mark_as_read(self):
        """Mark this message as read."""
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=['is_read'])


class MessageReadReceipt(models.Model):
    """
    Tracks when a specific user read a specific message.
    Enables ✓✓ (double-tick) read receipt functionality.
    """
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='read_receipts'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='message_receipts'
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['message', 'user']
        verbose_name = 'Read Receipt'
        verbose_name_plural = 'Read Receipts'

    def __str__(self):
        return f"{self.user.username} read message {self.message.id} at {self.read_at}"

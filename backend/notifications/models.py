"""
Models for the notification system.
"""
import logging
from django.conf import settings
from django.db import models

logger = logging.getLogger('notifications')


class Notification(models.Model):
    """
    Notification for user events (new messages, room invites, etc.)
    """
    NOTIFICATION_TYPES = [
        ('message', 'New Message'),
        ('room_invite', 'Room Invite'),
        ('mention', 'Mention'),
        ('system', 'System'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        db_index=True
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPES,
        default='message'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    related_room = models.ForeignKey(
        'chat.ChatRoom',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.user.username}"

    def mark_as_read(self):
        """Mark this notification as read."""
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=['is_read'])

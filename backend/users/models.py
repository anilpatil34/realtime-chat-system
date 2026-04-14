"""
Custom User model for the Real-Time Chat System.
Extends AbstractUser with profile fields for presence tracking.
"""
import logging
from django.contrib.auth.models import AbstractUser
from django.db import models

logger = logging.getLogger('users')


class User(AbstractUser):
    """
    Custom User model with additional fields for chat functionality.
    Uses email as the primary authentication field.
    """
    email = models.EmailField(unique=True, db_index=True)
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        help_text='User profile picture'
    )
    bio = models.CharField(
        max_length=500,
        blank=True,
        default='Hey there! I am using ChatApp.'
    )
    mobile_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text='User mobile number'
    )
    is_online = models.BooleanField(default=False, db_index=True)
    last_seen = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        ordering = ['-date_joined']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.username} ({self.email})"

    def set_online(self):
        """Mark user as online."""
        if not self.is_online:
            self.is_online = True
            self.save(update_fields=['is_online'])
            logger.info(f"User {self.username} is now online")

    def set_offline(self):
        """Mark user as offline and update last_seen."""
        if self.is_online:
            self.is_online = False
            self.save(update_fields=['is_online', 'last_seen'])
            logger.info(f"User {self.username} is now offline")

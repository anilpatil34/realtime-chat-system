"""
Signals for the users app.
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

logger = logging.getLogger('users')
User = get_user_model()


@receiver(post_save, sender=User)
def user_created(sender, instance, created, **kwargs):
    """Log when a new user is created."""
    if created:
        logger.info(f"New user created: {instance.username} (ID: {instance.id})")

"""
Serializers for the notification system.
"""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications."""
    room_id = serializers.IntegerField(source='related_room_id', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'is_read', 'room_id', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

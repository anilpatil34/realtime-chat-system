"""
Views for the notification system.
"""
import logging
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer

logger = logging.getLogger('notifications')


class NotificationListView(generics.ListAPIView):
    """List notifications for the authenticated user."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        ).order_by('-created_at')


class UnreadCountView(APIView):
    """Get the count of unread notifications."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()
        return Response({'unread_count': count})


class MarkNotificationReadView(APIView):
    """Mark a specific notification as read."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id, user=request.user
            )
            notification.mark_as_read()
            return Response({'message': 'Notification marked as read'})
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Notification not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class MarkAllReadView(APIView):
    """Mark all notifications as read for the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True)
        return Response({'message': f'{count} notifications marked as read'})

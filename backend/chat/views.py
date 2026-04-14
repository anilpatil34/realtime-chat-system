"""
REST API views for the chat system.
"""
import logging
from django.contrib.auth import get_user_model
from django.db.models import Q, Max
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import ChatRoom, Message, MessageReadReceipt
from .serializers import (
    ChatRoomSerializer,
    MessageSerializer,
    CreateGroupRoomSerializer,
    CreateDirectRoomSerializer,
)

logger = logging.getLogger('chat')
User = get_user_model()


class ChatRoomListView(generics.ListAPIView):
    """List all chat rooms the authenticated user belongs to."""
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatRoom.objects.filter(
            members=self.request.user
        ).annotate(
            latest_message_time=Max('messages__timestamp')
        ).order_by('-latest_message_time', '-updated_at')


class ChatRoomDetailView(generics.RetrieveAPIView):
    """Get details of a specific chat room."""
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatRoom.objects.filter(members=self.request.user)


class CreateDirectRoomView(APIView):
    """Create or retrieve a direct (1-to-1) chat room."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateDirectRoomSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        other_user_id = serializer.validated_data['user_id']
        current_user = request.user

        if other_user_id == current_user.id:
            return Response(
                {'error': 'Cannot create a chat room with yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )

        other_user = User.objects.get(id=other_user_id)

        # Check if a direct room already exists between these two users
        existing_room = ChatRoom.objects.filter(
            room_type='direct',
            members=current_user
        ).filter(
            members=other_user
        ).first()

        if existing_room:
            room_serializer = ChatRoomSerializer(
                existing_room, context={'request': request}
            )
            return Response(room_serializer.data, status=status.HTTP_200_OK)

        # Create new direct room
        room = ChatRoom.objects.create(
            room_type='direct',
            created_by=current_user
        )
        room.members.add(current_user, other_user)

        logger.info(
            f"Direct room created between {current_user.username} and {other_user.username}"
        )

        room_serializer = ChatRoomSerializer(room, context={'request': request})
        return Response(room_serializer.data, status=status.HTTP_201_CREATED)


class CreateGroupRoomView(APIView):
    """Create a new group chat room."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateGroupRoomSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        room = ChatRoom.objects.create(
            name=serializer.validated_data['name'],
            room_type='group',
            created_by=request.user
        )

        # Add creator and specified members
        member_ids = serializer.validated_data['member_ids']
        members = User.objects.filter(id__in=member_ids)
        room.members.add(request.user, *members)

        logger.info(
            f"Group room '{room.name}' created by {request.user.username} "
            f"with {members.count()} members"
        )

        room_serializer = ChatRoomSerializer(room, context={'request': request})
        return Response(room_serializer.data, status=status.HTTP_201_CREATED)


class MessageListView(generics.ListCreateAPIView):
    """List messages in a specific chat room (paginated) or Create a new message with optional attachment."""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        # Verify user is a member of the room
        room = ChatRoom.objects.filter(
            id=room_id, members=self.request.user
        ).first()
        if not room:
            return Message.objects.none()
        return Message.objects.filter(room=room).select_related(
            'sender'
        ).prefetch_related('read_receipts__user').order_by('-timestamp')

    def perform_create(self, serializer):
        room_id = self.kwargs['room_id']
        room = ChatRoom.objects.get(id=room_id, members=self.request.user)
        message = serializer.save(sender=self.request.user, room=room)
        
        room.updated_at = message.timestamp
        room.save(update_fields=['updated_at'])
        
        channel_layer = get_channel_layer()
        room_group_name = f'chat_{room_id}'
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                'type': 'chat_message',
                'message_id': message.id,
                'message': message.content,
                'sender_id': message.sender.id,
                'sender_username': message.sender.username,
                'sender_avatar': self.request.build_absolute_uri(message.sender.avatar.url) if (message.sender.avatar and hasattr(message.sender.avatar, 'url')) else None,
                'timestamp': message.timestamp.isoformat(),
                'room_id': room_id,
                'attachment': self.request.build_absolute_uri(message.attachment.url) if message.attachment else None,
            }
        )


class MarkMessagesReadView(APIView):
    """Mark all messages in a room as read for the current user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_id):
        room = ChatRoom.objects.filter(
            id=room_id, members=request.user
        ).first()

        if not room:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get unread messages not sent by the current user
        unread_messages = Message.objects.filter(
            room=room, is_read=False
        ).exclude(sender=request.user)

        # Create read receipts and mark as read
        for message in unread_messages:
            MessageReadReceipt.objects.get_or_create(
                message=message,
                user=request.user
            )
            message.is_read = True

        Message.objects.filter(
            id__in=[m.id for m in unread_messages]
        ).update(is_read=True)

        return Response(
            {'message': f'{unread_messages.count()} messages marked as read'},
            status=status.HTTP_200_OK
        )



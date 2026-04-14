"""
Serializers for the chat system.
"""
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import ChatRoom, Message, MessageReadReceipt

User = get_user_model()


class MessageReadReceiptSerializer(serializers.ModelSerializer):
    """Serializer for read receipts."""
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = MessageReadReceipt
        fields = ['id', 'user', 'username', 'read_at']
        read_only_fields = ['id', 'read_at']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages."""
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = serializers.ImageField(source='sender.avatar', read_only=True)
    read_receipts = MessageReadReceiptSerializer(many=True, read_only=True)
    is_own_message = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'room', 'sender', 'sender_username', 'sender_avatar',
            'content', 'attachment', 'timestamp', 'is_read', 'read_receipts', 'is_own_message'
        ]
        read_only_fields = ['id', 'room', 'sender', 'timestamp', 'is_read']

    def get_is_own_message(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.sender_id == request.user.id
        return False


class ChatRoomMemberSerializer(serializers.ModelSerializer):
    """Lightweight serializer for room members."""

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'is_online', 'last_seen', 'mobile_number']


class ChatRoomSerializer(serializers.ModelSerializer):
    """Serializer for chat rooms."""
    members = ChatRoomMemberSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    display_avatar = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            'id', 'name', 'room_type', 'members', 'avatar',
            'created_at', 'updated_at', 'last_message', 'unread_count',
            'display_name', 'display_avatar'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        msg = obj.last_message
        if msg:
            return {
                'id': msg.id,
                'content': msg.content,
                'sender_username': msg.sender.username,
                'timestamp': msg.timestamp.isoformat(),
                'is_read': msg.is_read,
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.get_unread_count(request.user)
        return 0

    def get_display_name(self, obj):
        """For direct chats, show the other person's name."""
        if obj.room_type == 'direct':
            request = self.context.get('request')
            if request and request.user:
                other_member = obj.members.exclude(id=request.user.id).first()
                if other_member:
                    return other_member.username
        return obj.name or 'Unnamed Room'

    def get_display_avatar(self, obj):
        """For direct chats, show the other person's avatar."""
        if obj.room_type == 'direct':
            request = self.context.get('request')
            if request and request.user:
                other_member = obj.members.exclude(id=request.user.id).first()
                if other_member and other_member.avatar:
                    return request.build_absolute_uri(other_member.avatar.url)
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
        return None


class CreateGroupRoomSerializer(serializers.Serializer):
    """Serializer for creating a group chat room."""
    name = serializers.CharField(max_length=255)
    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )

    def validate_member_ids(self, value):
        users = User.objects.filter(id__in=value)
        if users.count() != len(value):
            raise serializers.ValidationError("Some user IDs are invalid.")
        return value


class CreateDirectRoomSerializer(serializers.Serializer):
    """Serializer for creating or getting a direct chat room."""
    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User does not exist.")
        return value

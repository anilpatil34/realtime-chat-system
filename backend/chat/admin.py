"""
Admin configuration for the chat app.
"""
from django.contrib import admin
from .models import ChatRoom, Message, MessageReadReceipt


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ['sender', 'content', 'timestamp', 'is_read']
    ordering = ['-timestamp']


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'room_type', 'member_count', 'created_at', 'updated_at']
    list_filter = ['room_type', 'created_at']
    search_fields = ['name']
    filter_horizontal = ['members']
    inlines = [MessageInline]

    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = 'Members'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender', 'room', 'content_preview', 'timestamp', 'is_read']
    list_filter = ['is_read', 'timestamp']
    search_fields = ['content', 'sender__username']
    readonly_fields = ['timestamp']

    def content_preview(self, obj):
        return obj.content[:80] + '...' if len(obj.content) > 80 else obj.content
    content_preview.short_description = 'Content'


@admin.register(MessageReadReceipt)
class MessageReadReceiptAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'user', 'read_at']
    list_filter = ['read_at']

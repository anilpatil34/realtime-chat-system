"""
URL configuration for the chat app.
"""
from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    # Chat rooms
    path('rooms/', views.ChatRoomListView.as_view(), name='room_list'),
    path('rooms/<int:pk>/', views.ChatRoomDetailView.as_view(), name='room_detail'),
    path('rooms/direct/', views.CreateDirectRoomView.as_view(), name='create_direct'),
    path('rooms/group/', views.CreateGroupRoomView.as_view(), name='create_group'),

    # Messages
    path('rooms/<int:room_id>/messages/', views.MessageListView.as_view(), name='message_list'),
    path('rooms/<int:room_id>/read/', views.MarkMessagesReadView.as_view(), name='mark_read'),
]

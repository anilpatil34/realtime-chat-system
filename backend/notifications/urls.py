"""
URL configuration for the notifications app.
"""
from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notification_list'),
    path('unread-count/', views.UnreadCountView.as_view(), name='unread_count'),
    path('<int:notification_id>/read/', views.MarkNotificationReadView.as_view(), name='mark_read'),
    path('read-all/', views.MarkAllReadView.as_view(), name='mark_all_read'),
]

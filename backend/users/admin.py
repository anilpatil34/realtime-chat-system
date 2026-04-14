"""
Admin configuration for the users app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'is_online', 'last_seen', 'is_staff', 'date_joined']
    list_filter = ['is_online', 'is_staff', 'is_superuser', 'is_active']
    search_fields = ['username', 'email']
    ordering = ['-date_joined']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Chat Profile', {
            'fields': ('avatar', 'bio', 'is_online', 'last_seen'),
        }),
    )

    readonly_fields = ['last_seen']

"""
URL configuration for the users app.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = 'users'

urlpatterns = [
    # Authentication
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Profile
    path('profile/', views.UserProfileView.as_view(), name='profile'),

    # User listings
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/online/', views.OnlineUsersView.as_view(), name='online_users'),
    path('users/search/', views.UserSearchView.as_view(), name='user_search'),
    path('users/create/', views.CreateUserView.as_view(), name='create_user'),
]

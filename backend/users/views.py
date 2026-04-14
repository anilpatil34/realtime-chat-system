"""
Views for user authentication and profile management.
"""
import logging
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
)

logger = logging.getLogger('users')
User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Register a new user account."""
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for the newly registered user
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data

        logger.info(f"New user registered: {user.username} ({user.email})")

        return Response({
            'message': 'Registration successful',
            'user': user_data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """Login with email and password, returns JWT tokens + user data."""
    permission_classes = [permissions.AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """Logout by blacklisting the refresh token."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info(f"User {request.user.username} logged out")
            return Response(
                {'message': 'Logout successful'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Logout error: {e}")
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the authenticated user's profile."""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    """List all users (for starting new chats)."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Exclude the current user from the list
        return User.objects.exclude(id=self.request.user.id).order_by('username')


class OnlineUsersView(generics.ListAPIView):
    """List currently online users."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(is_online=True).exclude(
            id=self.request.user.id
        ).order_by('username')


class UserSearchView(generics.ListAPIView):
    """Search users by username or email."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if not query:
            return User.objects.none()
        return User.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query)
        ).exclude(id=self.request.user.id)[:20]


class CreateUserView(generics.CreateAPIView):
    """Create a new user from the UI while authenticated."""
    queryset = User.objects.all()
    # Allowing authenticated users to create new ones (for testing/demo functionality)
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        user_data = UserSerializer(user).data
        logger.info(f"New user created by {request.user.username}: {user.username} ({user.email})")

        return Response({
            'message': 'User created successfully',
            'user': user_data,
        }, status=status.HTTP_201_CREATED)



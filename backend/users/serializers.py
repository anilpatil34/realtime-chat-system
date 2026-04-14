"""
Serializers for user authentication and profile management.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for public user data."""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'avatar', 'bio', 'mobile_number',
            'is_online', 'last_seen', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined', 'is_online', 'last_seen']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'mobile_number']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': "Passwords do not match."
            })
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer that includes user data in the response."""

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add user info to the token response
        user_serializer = UserSerializer(self.user)
        data['user'] = user_serializer.data
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims to the token
        token['username'] = user.username
        token['email'] = user.email
        return token


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar', 'bio', 'mobile_number', 'is_online', 'last_seen']
        read_only_fields = ['id', 'email', 'is_online', 'last_seen']

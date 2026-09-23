from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from pictures.imaging import clean_image

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class PublicUserSerializer(serializers.ModelSerializer):
    picture_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "bio", "avatar", "date_joined", "picture_count"]


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "bio", "avatar", "date_joined"]
        read_only_fields = ["id", "username", "date_joined"]

    def validate_avatar(self, value):
        if value:
            cleaned, _, _ = clean_image(value, max_side=512)
            return cleaned
        return value

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from rest_framework import filters, generics, permissions

from .serializers import MeSerializer, PublicUserSerializer, RegisterSerializer

User = get_user_model()


def users_with_counts():
    return User.objects.filter(is_active=True).annotate(
        picture_count=Count("pictures", filter=Q(pictures__is_public=True))
    )


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserSearchView(generics.ListAPIView):
    serializer_class = PublicUserSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["username"]

    def get_queryset(self):
        return users_with_counts().order_by("username")


class UserDetailView(generics.RetrieveAPIView):
    serializer_class = PublicUserSerializer
    lookup_field = "username"

    def get_queryset(self):
        return users_with_counts()

import os

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from rest_framework import generics, permissions
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from .models import Picture
from .permissions import IsOwnerOrReadOnly
from .serializers import PictureSerializer


def visible_pictures(user):
    """Public pictures, plus the requesting user's own private ones."""
    qs = Picture.objects.select_related("owner")
    if user.is_authenticated:
        return qs.filter(Q(is_public=True) | Q(owner=user))
    return qs.filter(is_public=True)


class PictureCreateView(generics.CreateAPIView):
    serializer_class = PictureSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class PictureDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PictureSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return visible_pictures(self.request.user)


class UserPictureListView(generics.ListAPIView):
    serializer_class = PictureSerializer

    def get_queryset(self):
        owner = get_object_or_404(get_user_model(), username=self.kwargs["username"], is_active=True)
        return visible_pictures(self.request.user).filter(owner=owner)


class PictureDownloadView(generics.GenericAPIView):
    def get_queryset(self):
        return visible_pictures(self.request.user)

    def get(self, request, pk):
        picture = self.get_object()
        ext = os.path.splitext(picture.image.name)[1]
        filename = f"{slugify(picture.title) or 'picture'}-{picture.pk}{ext}"
        return FileResponse(picture.image.open("rb"), as_attachment=True, filename=filename)

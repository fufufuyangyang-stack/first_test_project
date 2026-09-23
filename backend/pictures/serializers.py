from rest_framework import serializers

from .imaging import clean_image, make_thumbnail
from .models import Picture


class PictureSerializer(serializers.ModelSerializer):
    owner = serializers.CharField(source="owner.username", read_only=True)
    # Explicit default: DRF treats an omitted boolean in multipart data as False.
    is_public = serializers.BooleanField(default=True)

    class Meta:
        model = Picture
        fields = [
            "id", "owner", "image", "thumbnail", "title", "description",
            "is_public", "width", "height", "created_at",
        ]
        read_only_fields = ["id", "owner", "thumbnail", "width", "height", "created_at"]

    def get_fields(self):
        fields = super().get_fields()
        if self.instance is not None:
            # The image itself can't be replaced after upload.
            fields["image"].read_only = True
        return fields

    def validate_image(self, value):
        cleaned, width, height = clean_image(value)
        self._dimensions = (width, height)
        return cleaned

    def create(self, validated_data):
        validated_data["width"], validated_data["height"] = self._dimensions
        picture = Picture.objects.create(**validated_data)
        picture.thumbnail.save("thumb.webp", make_thumbnail(picture.image), save=True)
        return picture

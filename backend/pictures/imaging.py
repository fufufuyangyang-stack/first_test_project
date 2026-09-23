"""Server-side image validation, EXIF stripping, and thumbnail generation."""
import uuid
from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from PIL import Image, ImageOps, UnidentifiedImageError
from rest_framework.exceptions import ValidationError

ALLOWED_FORMATS = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp", "GIF": "gif"}
THUMBNAIL_SIDE = 400


def _open_verified(upload):
    if upload.size > settings.MAX_UPLOAD_SIZE:
        raise ValidationError(f"File too large (max {settings.MAX_UPLOAD_SIZE // (1024 * 1024)} MB).")
    try:
        upload.seek(0)
        Image.open(upload).verify()
        upload.seek(0)
        img = Image.open(upload)
        img.load()
    except (UnidentifiedImageError, OSError, SyntaxError, Image.DecompressionBombError):
        raise ValidationError("Upload a valid image file.")
    if img.format not in ALLOWED_FORMATS:
        raise ValidationError("Only JPEG, PNG, WebP and GIF images are allowed.")
    return img


def clean_image(upload, max_side=None):
    """Validate an uploaded image and re-encode it without metadata.

    Returns (ContentFile, width, height). The file gets a random name so
    original filenames never leak into URLs.
    """
    img = _open_verified(upload)
    fmt = img.format
    name = f"{uuid.uuid4().hex}.{ALLOWED_FORMATS[fmt]}"

    if fmt == "GIF":
        # Keep animation intact; GIFs don't carry EXIF/GPS data.
        upload.seek(0)
        return ContentFile(upload.read(), name=name), img.width, img.height

    img = ImageOps.exif_transpose(img)  # bake in rotation before dropping EXIF
    if max_side:
        img.thumbnail((max_side, max_side))
    if fmt == "JPEG" and img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    buf = BytesIO()
    save_kwargs = {"quality": 90} if fmt in ("JPEG", "WEBP") else {}
    img.save(buf, format=fmt, **save_kwargs)  # no exif= kwarg -> metadata stripped
    return ContentFile(buf.getvalue(), name=name), img.width, img.height


def make_thumbnail(image_field):
    image_field.open("rb")
    try:
        img = Image.open(image_field)
        img.seek(0)
        img = img.convert("RGBA")
        img.thumbnail((THUMBNAIL_SIDE, THUMBNAIL_SIDE))
        buf = BytesIO()
        img.save(buf, format="WEBP", quality=80)
    finally:
        image_field.close()
    return ContentFile(buf.getvalue(), name=f"{uuid.uuid4().hex}.webp")

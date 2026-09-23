from django.conf import settings
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver


class Picture(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pictures"
    )
    image = models.ImageField(upload_to="pictures/%Y/%m/")
    thumbnail = models.ImageField(upload_to="thumbs/", blank=True)
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    width = models.PositiveIntegerField(null=True)
    height = models.PositiveIntegerField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title or f"Picture {self.pk}"


@receiver(post_delete, sender=Picture)
def delete_picture_files(sender, instance, **kwargs):
    for field in (instance.image, instance.thumbnail):
        if field:
            field.delete(save=False)

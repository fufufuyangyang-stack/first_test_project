from django.contrib import admin

from .models import Picture


@admin.register(Picture)
class PictureAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "owner", "is_public", "created_at"]
    list_filter = ["is_public"]
    search_fields = ["title", "owner__username"]

from django.urls import path

from . import views

urlpatterns = [
    path("pictures/", views.PictureCreateView.as_view()),
    path("pictures/<int:pk>/", views.PictureDetailView.as_view()),
    path("pictures/<int:pk>/download/", views.PictureDownloadView.as_view()),
]

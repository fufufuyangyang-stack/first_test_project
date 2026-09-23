from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from pictures.views import UserPictureListView

from . import views

urlpatterns = [
    path("auth/register/", views.RegisterView.as_view()),
    path("auth/login/", TokenObtainPairView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("me/", views.MeView.as_view()),
    path("users/", views.UserSearchView.as_view()),
    path("users/<str:username>/", views.UserDetailView.as_view()),
    path("users/<str:username>/pictures/", UserPictureListView.as_view()),
]

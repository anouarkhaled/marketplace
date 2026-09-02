from django.urls import path
from .views import RegisterView, ProfileView, StatsView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("stats/", StatsView.as_view(), name="stats"),   # ← ajouté
]
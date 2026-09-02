from django.urls import path
from .views import FavoriteListView, FavoriteToggleView

urlpatterns = [
    path("favorites/", FavoriteListView.as_view(), name="favorite-list"),
    path("favorites/toggle/<int:listing_id>/", FavoriteToggleView.as_view(), name="favorite-toggle"),
]
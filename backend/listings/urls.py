from django.urls import path
from .views import CategoryListView, ListingListCreateView, ListingImageUploadView

urlpatterns = [
    path("listings/", ListingListCreateView.as_view(), name="listing-list-create"),
    path("listings/<int:listing_id>/images/", ListingImageUploadView.as_view(), name="listing-image-upload"),
]
from django.urls import path
from .views import (
    ListingListCreateView,
    ListingImageUploadView,
    ListingDetailView,
)

urlpatterns = [
    path("listings/", ListingListCreateView.as_view(), name="listing-list-create"),
    path("listings/<int:pk>/", ListingDetailView.as_view(), name="listing-detail"),
    path("listings/<int:listing_id>/images/", ListingImageUploadView.as_view(), name="listing-image-upload"),
    path("categories/", CategoryListView.as_view(), name="category-list"),
]
from django.urls import path
from .views import (
    CategoryListView,
    ListingDetailView,
    ListingImageDeleteView,
    ListingImageUploadView,
    ListingListCreateView,
    MyListingsView,
)

urlpatterns = [
    path("listings/", ListingListCreateView.as_view(), name="listing-list-create"),
    path("listings/<int:pk>/", ListingDetailView.as_view(), name="listing-detail"),
    path("listings/<int:listing_id>/images/", ListingImageUploadView.as_view(), name="listing-image-upload"),
    path("listings/images/<int:pk>/", ListingImageDeleteView.as_view(), name="listing-image-delete"),
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("my-listings/", MyListingsView.as_view(), name="my-listings"),
]

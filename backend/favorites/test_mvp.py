from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from listings.models import Listing
from .models import Favorite

User = get_user_model()


class FavoriteMVPTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.user = User.objects.create_user(username="user")
        self.other = User.objects.create_user(username="other")
        self.listing = Listing.objects.create(seller=self.other, title="Test", description="Test", price=10, location="Tunis")
        self.client.force_authenticate(self.user)

    def test_missing_listing_returns_404(self):
        self.assertEqual(self.client.post("/api/favorites/toggle/999999/").status_code, 404)

    def test_toggle_adds_and_removes_favorite(self):
        url = f"/api/favorites/toggle/{self.listing.pk}/"
        self.assertEqual(self.client.post(url).data, {"favorited": True})
        self.assertEqual(self.client.get("/api/favorites/").data["count"], 1)
        self.assertEqual(self.client.post(url).data, {"favorited": False})
        self.assertFalse(Favorite.objects.exists())

    def test_hidden_listing_is_not_exposed_by_favorites(self):
        Favorite.objects.create(user=self.user, listing=self.listing)
        self.listing.is_active = False
        self.listing.save()
        self.assertEqual(self.client.get("/api/favorites/").data["count"], 0)
        self.assertEqual(self.client.post(f"/api/favorites/toggle/{self.listing.pk}/").status_code, 404)

    def test_favorites_are_private(self):
        Favorite.objects.create(user=self.other, listing=self.listing)
        self.assertEqual(self.client.get("/api/favorites/").data["count"], 0)

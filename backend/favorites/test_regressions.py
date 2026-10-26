from django.contrib.auth import get_user_model

from config.test_helpers import IsolatedAPITestCase
from listings.models import Listing
from .models import Favorite

User = get_user_model()


class FavoriteRegressionTests(IsolatedAPITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user(username="favorite-owner")
        cls.other = User.objects.create_user(username="favorite-other")
        cls.listing = Listing.objects.create(seller=cls.owner, title="Offre", description="Description", price="10", location="Tunis")

    def test_authentication_is_required_to_list_or_toggle(self):
        self.assertEqual(self.client.get("/api/favorites/").status_code, 401)
        self.assertEqual(self.client.post(f"/api/favorites/toggle/{self.listing.pk}/").status_code, 401)
        self.assertFalse(Favorite.objects.exists())

    def test_toggling_never_changes_another_users_favorite(self):
        foreign = Favorite.objects.create(user=self.other, listing=self.listing)
        self.client.force_authenticate(self.owner)
        url = f"/api/favorites/toggle/{self.listing.pk}/"
        for expected_status, favorited in ((201, True), (200, False), (201, True)):
            response = self.client.post(url)
            self.assertEqual(response.status_code, expected_status)
            self.assertEqual(response.data["favorited"], favorited)
            self.assertTrue(Favorite.objects.filter(pk=foreign.pk).exists())
            self.assertLessEqual(Favorite.objects.filter(user=self.owner, listing=self.listing).count(), 1)
        response = self.client.get("/api/favorites/")
        self.assertEqual(response.data["count"], 1)
        self.assertTrue(response.data["results"][0]["listing"]["is_favorited"])

    def test_favorites_pagination_returns_all_own_records(self):
        self.client.force_authenticate(self.owner)
        own_ids = set()
        for index in range(12):
            listing = Listing.objects.create(seller=self.other, title=f"Offre {index}", description="Description", price="10", location="Tunis")
            own_ids.add(Favorite.objects.create(user=self.owner, listing=listing).pk)
        Favorite.objects.create(user=self.other, listing=self.listing)
        first = self.client.get("/api/favorites/")
        second = self.client.get("/api/favorites/", {"page": 2})
        ids = [item["id"] for item in first.data["results"] + second.data["results"]]
        self.assertEqual(first.data["count"], 12)
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(set(ids), own_ids)

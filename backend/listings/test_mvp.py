from io import BytesIO
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient

from .models import Category, Listing, ListingImage
from .admin import ListingAdmin
from django.contrib.admin.sites import AdminSite

User = get_user_model()


class ListingMVPTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user(username="owner")
        cls.other = User.objects.create_user(username="other")
        cls.admin = User.objects.create_user(username="admin", is_staff=True)
        cls.category = Category.objects.create(name="Test", slug="test")

    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.listing = Listing.objects.create(seller=self.owner, category=self.category, title="Test", description="Test", price=10, location="Tunis")
        self.url = f"/api/listings/{self.listing.pk}/"
        self.upload_url = f"{self.url}images/"

    def image(self):
        data = BytesIO()
        Image.new("RGB", (1, 1)).save(data, format="PNG")
        return SimpleUploadedFile("image.png", data.getvalue(), content_type="image/png")

    def hide(self):
        self.listing.is_active = False
        self.listing.moderated_at = timezone.now()
        self.listing.save()

    def test_hidden_listing_is_unavailable_to_public_and_other_users(self):
        self.hide()
        self.assertEqual(self.client.get(self.url).status_code, 404)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get(self.url).status_code, 404)
        self.assertEqual(self.client.get("/api/listings/").data["count"], 0)

    def test_hidden_listing_remains_visible_to_owner_and_admin(self):
        self.hide()
        for user in (self.owner, self.admin):
            self.client.force_authenticate(user)
            self.assertEqual(self.client.get(self.url).status_code, 200)
            self.assertTrue(self.client.get(self.url).data["is_moderated"])

    def test_owner_cannot_reactivate_moderated_listing(self):
        self.hide()
        self.client.force_authenticate(self.owner)
        for method in (self.client.patch, self.client.put):
            response = method(self.url, {"is_active": True, "title": "Updated", "description": "Test", "price": "10", "location": "Tunis", "category": self.category.pk}, format="json")
            self.assertEqual(response.status_code, 400)
            self.assertIn("is_active", response.data)
        self.listing.refresh_from_db()
        self.assertFalse(self.listing.is_active)

    def test_owner_can_reactivate_listing_they_disabled(self):
        self.listing.is_active = False
        self.listing.save()
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.patch(self.url, {"is_active": True}, format="json").status_code, 200)

    def test_admin_can_restore_moderated_listing(self):
        self.hide()
        self.listing.is_active = True
        ListingAdmin(Listing, AdminSite()).save_model(None, self.listing, None, change=True)
        self.listing.refresh_from_db()
        self.assertIsNone(self.listing.moderated_at)
        self.assertEqual(self.client.get(self.url).status_code, 200)

    def test_admin_hiding_listing_also_blocks_seller_reactivation(self):
        self.listing.is_active = False
        ListingAdmin(Listing, AdminSite()).save_model(None, self.listing, None, change=True)
        self.listing.refresh_from_db()
        self.assertIsNotNone(self.listing.moderated_at)
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.patch(self.url, {"is_active": True}, format="json").status_code, 400)

    def test_other_user_cannot_update_listing(self):
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.patch(self.url, {"title": "Changed"}).status_code, 403)

    def test_missing_listing_image_upload_returns_404(self):
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.post("/api/listings/999999/images/", {"image": self.image()}, format="multipart").status_code, 404)

    def test_other_user_cannot_upload_image(self):
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.post(self.upload_url, {"image": self.image()}, format="multipart").status_code, 403)

    @override_settings(MAX_UPLOAD_IMAGE_SIZE=1)
    def test_image_size_is_enforced(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post(self.upload_url, {"image": self.image()}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("image", response.data)
        self.assertFalse(ListingImage.objects.exists())

    def test_invalid_image_is_rejected(self):
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.post(self.upload_url, {"image": SimpleUploadedFile("invalid.png", b"bad")}, format="multipart").status_code, 400)

    def test_owner_can_upload_and_other_user_cannot_delete_image(self):
        with TemporaryDirectory() as directory, override_settings(MEDIA_ROOT=directory):
            self.client.force_authenticate(self.owner)
            response = self.client.post(self.upload_url, {"image": self.image()}, format="multipart")
            self.assertEqual(response.status_code, 201)
            url = f"/api/listings/images/{response.data['id']}/"
            self.client.force_authenticate(self.other)
            self.assertEqual(self.client.delete(url).status_code, 403)
            self.client.force_authenticate(self.owner)
            self.assertEqual(self.client.delete(url).status_code, 204)

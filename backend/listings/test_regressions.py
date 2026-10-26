from io import StringIO

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management import call_command

from config.test_helpers import IsolatedAPITestCase, image_upload
from favorites.models import Favorite
from messaging.models import Conversation, Message
from .models import Category, Listing, ListingImage

User = get_user_model()


class ListingRegressionTests(IsolatedAPITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user(username="listing-owner", email="seller@example.test", phone="+21620000000")
        cls.other = User.objects.create_user(username="listing-other")
        cls.category = Category.objects.create(name="Équipement", slug="equipement")
        cls.listing = Listing.objects.create(seller=cls.owner, category=cls.category, title="Compresseur", description="Bon état", price="100.00", location="Tunis")

    def setUp(self):
        super().setUp()
        self.url = f"/api/listings/{self.listing.pk}/"

    def test_owner_can_update_and_delete_with_related_records(self):
        self.client.force_authenticate(self.owner)
        response = self.client.patch(self.url, {"title": "Compresseur révisé", "price": "150.25", "seller": {"id": self.other.pk}}, format="json")
        self.assertEqual(response.status_code, 200)
        self.listing.refresh_from_db()
        self.assertEqual(self.listing.title, "Compresseur révisé")
        self.assertEqual(str(self.listing.price), "150.25")
        self.assertEqual(self.listing.seller_id, self.owner.pk)
        Favorite.objects.create(user=self.other, listing=self.listing)
        conversation = Conversation.objects.create(listing=self.listing, buyer=self.other, seller=self.owner)
        Message.objects.create(conversation=conversation, sender=self.other, body="Bonjour")
        self.assertEqual(self.client.delete(self.url).status_code, 204)
        self.assertFalse(Listing.objects.filter(pk=self.listing.pk).exists())
        self.assertFalse(Favorite.objects.exists())
        self.assertFalse(Conversation.objects.exists())
        self.assertFalse(Message.objects.exists())

    def test_anonymous_cannot_modify_or_delete(self):
        self.assertEqual(self.client.patch(self.url, {"title": "Interdit"}).status_code, 401)
        self.assertEqual(self.client.delete(self.url).status_code, 401)
        self.listing.refresh_from_db()
        self.assertEqual(self.listing.title, "Compresseur")

    def test_creation_cannot_assign_another_seller(self):
        self.client.force_authenticate(self.other)
        response = self.client.post("/api/listings/", {
            "title": "Nouvelle offre", "description": "Description", "price": "10", "location": "Sfax",
            "category": self.category.pk, "seller": {"id": self.owner.pk},
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Listing.objects.get(pk=response.data["id"]).seller_id, self.other.pk)

    def test_my_listings_are_private_and_include_own_inactive_listings(self):
        self.listing.is_active = False
        self.listing.save()
        foreign = Listing.objects.create(seller=self.other, category=self.category, title="Autre", description="Description", price="10", location="Sfax")
        self.client.force_authenticate(self.owner)
        response = self.client.get("/api/my-listings/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data["results"]], [self.listing.pk])
        self.assertNotEqual(response.data["results"][0]["id"], foreign.pk)

    def test_catalogue_pagination_has_no_duplicates_and_excludes_inactive_listings(self):
        listings = [self.listing]
        for index in range(11):
            listings.append(Listing.objects.create(seller=self.owner, category=self.category, title=f"Offre {index}", description="Description", price="10", location="Tunis"))
        Listing.objects.create(seller=self.owner, title="Masquée", description="Description", price="10", location="Tunis", is_active=False)
        first = self.client.get("/api/listings/")
        second = self.client.get("/api/listings/", {"page": 2})
        self.assertEqual(first.data["count"], 12)
        self.assertEqual(len(first.data["results"]), 9)
        ids = [item["id"] for item in first.data["results"] + second.data["results"]]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(set(ids), {listing.pk for listing in listings})

    def test_search_and_price_location_category_filters_combine(self):
        Listing.objects.create(seller=self.other, category=self.category, title="Compresseur", description="Autre", price="300", location="Sfax")
        response = self.client.get("/api/listings/", {"search": "compresseur", "category": self.category.pk, "location": "tunis", "min_price": "100", "max_price": "100"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data["results"]], [self.listing.pk])

    def test_public_response_hides_contact_details(self):
        public = self.client.get(self.url)
        self.assertNotIn("email", public.data["seller"])
        self.assertNotIn("phone", public.data["seller"])
        self.client.force_authenticate(self.other)
        authenticated = self.client.get(self.url)
        self.assertEqual(authenticated.data["seller"]["email"], self.owner.email)


class PhotoBoundaryTests(IsolatedAPITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user(username="photo-owner")
        cls.listing = Listing.objects.create(seller=cls.owner, title="Photo", description="Description", price="10", location="Tunis")

    def setUp(self):
        super().setUp()
        self.url = f"/api/listings/{self.listing.pk}/images/"

    def test_exact_maximum_size_is_accepted(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post(self.url, {"image": image_upload(size=settings.MAX_UPLOAD_IMAGE_SIZE)}, format="multipart")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ListingImage.objects.get().image.size, settings.MAX_UPLOAD_IMAGE_SIZE)

    def test_one_byte_above_maximum_is_rejected(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post(self.url, {"image": image_upload(size=settings.MAX_UPLOAD_IMAGE_SIZE + 1)}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(ListingImage.objects.exists())

    def test_anonymous_cannot_upload_or_delete_photos(self):
        self.client.force_authenticate(self.owner)
        uploaded = self.client.post(self.url, {"image": image_upload()}, format="multipart")
        self.assertEqual(uploaded.status_code, 201)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post(self.url, {"image": image_upload()}, format="multipart").status_code, 401)
        self.assertEqual(self.client.delete(f"/api/listings/images/{uploaded.data['id']}/").status_code, 401)
        self.assertEqual(ListingImage.objects.count(), 1)


class CategoryMaintenanceTests(IsolatedAPITestCase):
    def test_seed_is_idempotent_and_keeps_existing_categories(self):
        existing = Category.objects.create(slug="services", name="Services personnalisés")
        call_command("seed_categories", stdout=StringIO())
        count = Category.objects.count()
        call_command("seed_categories", stdout=StringIO())
        existing.refresh_from_db()
        self.assertEqual(count, 7)
        self.assertEqual(Category.objects.count(), count)
        self.assertEqual(existing.name, "Services personnalisés")

    def test_categories_are_stably_paginated(self):
        for index in range(12):
            Category.objects.create(name=f"Catégorie {index:02}", slug=f"categorie-{index}")
        first = self.client.get("/api/categories/")
        second = self.client.get("/api/categories/", {"page": 2})
        names = [item["name"] for item in first.data["results"] + second.data["results"]]
        self.assertEqual(len(names), 12)
        self.assertEqual(len(set(names)), 12)
        self.assertEqual(names, sorted(names))

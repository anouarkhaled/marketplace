from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from config.test_helpers import IsolatedAPITestCase, image_upload
from favorites.models import Favorite
from listings.models import Category, Listing, ListingImage
from messaging.models import Conversation, Message

User = get_user_model()


class MarketplaceJourneyTests(IsolatedAPITestCase):
    """Cross-app journey through public endpoints using real JWT authentication."""

    def register_and_login(self, username):
        client = APIClient()
        credentials = {"username": username, "password": "JourneyStrong123!"}
        registered = client.post("/api/register/", {
            **credentials, "password2": credentials["password"], "email": f"{username}@example.test",
        }, format="json")
        self.assertEqual(registered.status_code, 201, registered.data)
        login = client.post("/api/token/", credentials, format="json")
        self.assertEqual(login.status_code, 200, login.data)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        profile = client.get("/api/profile/")
        self.assertEqual(profile.status_code, 200)
        return client, profile.data

    def test_registration_publication_photos_favorite_contact_and_seller_reply(self):
        category = Category.objects.create(name="Équipements", slug="equipements")
        seller, seller_profile = self.register_and_login("journey-seller")
        published = seller.post("/api/listings/", {
            "title": "Compresseur à vendre", "description": "Bon état, photos disponibles.",
            "price": "250.00", "location": "Tunis", "category": category.pk,
        }, format="json")
        self.assertEqual(published.status_code, 201, published.data)
        listing_id = published.data["id"]
        listing_url = f"/api/listings/{listing_id}/"
        self.assertEqual(published.data["seller"]["id"], seller_profile["id"])
        for name in ("front.png", "back.png"):
            response = seller.post(f"{listing_url}images/", {"image": image_upload(name)}, format="multipart")
            self.assertEqual(response.status_code, 201, response.data)
        public = self.client.get("/api/listings/", {"search": "Compresseur"})
        self.assertEqual(public.status_code, 200)
        self.assertEqual(public.data["count"], 1)
        self.assertEqual(len(public.data["results"][0]["images"]), 2)
        self.assertNotIn("email", public.data["results"][0]["seller"])

        buyer, buyer_profile = self.register_and_login("journey-buyer")
        self.assertEqual(buyer.post(f"/api/favorites/toggle/{listing_id}/").status_code, 201)
        self.assertEqual(buyer.get("/api/favorites/").data["count"], 1)
        contacted = buyer.post("/api/conversations/", {"listing": listing_id, "body": "Bonjour, est-il disponible ?"}, format="json")
        self.assertEqual(contacted.status_code, 201, contacted.data)
        self.assertEqual(contacted.data["buyer"]["id"], buyer_profile["id"])
        self.assertEqual(contacted.data["seller"]["id"], seller_profile["id"])
        conversation_id = contacted.data["id"]
        messages_url = f"/api/conversations/{conversation_id}/messages/"
        inbox = seller.get("/api/conversations/")
        self.assertEqual(inbox.data["results"][0]["unread_count"], 1)
        self.assertEqual(seller.get(messages_url).status_code, 200)
        reply = seller.post(messages_url, {"body": "Oui, il est disponible."}, format="json")
        self.assertEqual(reply.status_code, 201)
        received = buyer.get(messages_url)
        self.assertEqual(received.status_code, 200)
        self.assertEqual(received.data["results"][0]["sender"]["id"], seller_profile["id"])
        self.assertEqual(received.data["count"], 2)
        self.assertFalse(Message.objects.filter(read_at__isnull=True).exists())

        self.assertEqual(seller.patch(listing_url, {"is_active": False}, format="json").status_code, 200)
        self.assertEqual(self.client.get(listing_url).status_code, 404)
        self.assertEqual(buyer.get("/api/favorites/").data["count"], 0)
        self.assertEqual(seller.get("/api/my-listings/").data["count"], 1)
        self.assertEqual(User.objects.count(), 2)
        self.assertEqual(Listing.objects.count(), 1)
        self.assertEqual(ListingImage.objects.count(), 2)
        self.assertEqual(Favorite.objects.count(), 1)
        self.assertEqual(Conversation.objects.count(), 1)

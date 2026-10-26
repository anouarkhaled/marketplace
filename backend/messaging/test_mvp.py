from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from listings.models import Listing
from .models import Conversation, Message

User = get_user_model()


class MessagingMVPTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.buyer = User.objects.create_user(username="buyer")
        self.seller = User.objects.create_user(username="seller")
        self.other = User.objects.create_user(username="other")
        self.listing = Listing.objects.create(seller=self.seller, title="Test", description="Test", price=10, location="Tunis")
        self.conversation = Conversation.objects.create(listing=self.listing, buyer=self.buyer, seller=self.seller)
        self.url = f"/api/conversations/{self.conversation.pk}/messages/"
        self.client.force_authenticate(self.buyer)

    def test_latest_messages_appear_first_and_all_pages_are_accessible(self):
        messages = [Message.objects.create(conversation=self.conversation, sender=self.seller, body=f"Message {index}") for index in range(12)]
        first = self.client.get(self.url)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.data["count"], 12)
        self.assertEqual(first.data["results"][0]["id"], messages[-1].pk)
        self.assertEqual(len(first.data["results"]), 9)
        self.assertEqual(Message.objects.filter(read_at__isnull=True).count(), 3)
        second = self.client.get(self.url, {"page": 2})
        ids = [item["id"] for item in first.data["results"] + second.data["results"]]
        self.assertEqual(set(ids), {message.pk for message in messages})
        self.assertEqual(len(ids), 12)
        self.assertFalse(Message.objects.filter(read_at__isnull=True).exists())

    def test_new_message_is_visible_on_first_page(self):
        Message.objects.bulk_create([Message(conversation=self.conversation, sender=self.seller, body="Older") for _ in range(12)])
        sent = self.client.post(self.url, {"body": "Latest"})
        self.assertEqual(sent.status_code, 201)
        self.assertEqual(self.client.get(self.url).data["results"][0]["id"], sent.data["id"])

    def test_all_conversations_are_accessible_and_private(self):
        for index in range(11):
            listing = Listing.objects.create(seller=self.seller, title=str(index), description="Test", price=10, location="Tunis")
            Conversation.objects.create(listing=listing, buyer=self.buyer, seller=self.seller)
        first = self.client.get("/api/conversations/")
        second = self.client.get("/api/conversations/", {"page": 2})
        self.assertEqual(first.data["count"], 12)
        self.assertEqual(len(first.data["results"]) + len(second.data["results"]), 12)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get("/api/conversations/").data["count"], 0)

    def test_non_participant_cannot_send_or_mark_messages_as_read(self):
        message = Message.objects.create(conversation=self.conversation, sender=self.seller, body="Private")
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get(self.url).status_code, 403)
        self.assertEqual(self.client.post(self.url, {"body": "Intrusion"}).status_code, 403)
        message.refresh_from_db()
        self.assertIsNone(message.read_at)
        self.assertEqual(Message.objects.count(), 1)

    def test_invalid_page_does_not_mark_messages_as_read(self):
        message = Message.objects.create(conversation=self.conversation, sender=self.seller, body="Private")
        self.assertEqual(self.client.get(self.url, {"page": 99}).status_code, 404)
        message.refresh_from_db()
        self.assertIsNone(message.read_at)

    def test_hidden_listing_cannot_start_conversation(self):
        self.listing.is_active = False
        self.listing.save()
        response = self.client.post("/api/conversations/", {"listing": self.listing.pk, "body": "Hello"})
        self.assertEqual(response.status_code, 400)

    def test_message_body_length_is_validated(self):
        for body in (" ", "x" * 2001):
            self.assertEqual(self.client.post(self.url, {"body": body}).status_code, 400)
        self.assertFalse(Message.objects.exists())

    def test_conversation_can_be_opened_directly_by_a_participant(self):
        url = f"/api/conversations/{self.conversation.pk}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["seller"]["id"], self.seller.pk)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get(url).status_code, 404)

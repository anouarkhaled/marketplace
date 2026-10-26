from django.contrib.auth import get_user_model
from django.utils import timezone

from config.test_helpers import IsolatedAPITestCase
from listings.models import Listing
from .models import Conversation, Message

User = get_user_model()


class MessagingRegressionTests(IsolatedAPITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.buyer = User.objects.create_user(username="thread-buyer")
        cls.seller = User.objects.create_user(username="thread-seller")
        cls.other = User.objects.create_user(username="thread-other")
        cls.listing = Listing.objects.create(seller=cls.seller, title="Offre", description="Description", price="10", location="Tunis")
        cls.conversation = Conversation.objects.create(listing=cls.listing, buyer=cls.buyer, seller=cls.seller)

    def setUp(self):
        super().setUp()
        self.url = f"/api/conversations/{self.conversation.pk}/messages/"

    def test_anonymous_cannot_access_conversations_or_messages(self):
        self.assertEqual(self.client.get("/api/conversations/").status_code, 401)
        self.assertEqual(self.client.post("/api/conversations/", {"listing": self.listing.pk, "body": "Bonjour"}).status_code, 401)
        self.assertEqual(self.client.get(self.url).status_code, 401)
        self.assertEqual(self.client.post(self.url, {"body": "Bonjour"}).status_code, 401)

    def test_contact_reuses_conversation_without_losing_messages(self):
        self.client.force_authenticate(self.buyer)
        for body in ("Bonjour", "Toujours disponible ?"):
            response = self.client.post("/api/conversations/", {"listing": self.listing.pk, "body": body})
            self.assertEqual(response.status_code, 201)
            self.assertEqual(response.data["id"], self.conversation.pk)
        self.assertEqual(Conversation.objects.count(), 1)
        self.assertEqual(list(self.conversation.messages.values_list("body", flat=True)), ["Bonjour", "Toujours disponible ?"])

    def test_sender_conversation_and_read_status_cannot_be_forged(self):
        foreign = Conversation.objects.create(listing=self.listing, buyer=self.other, seller=self.seller)
        self.client.force_authenticate(self.buyer)
        response = self.client.post(self.url, {
            "body": "Bonjour", "sender": {"id": self.other.pk}, "conversation": foreign.pk,
            "read_at": "2026-01-01T00:00:00Z",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        message = Message.objects.get(pk=response.data["id"])
        self.assertEqual(message.sender_id, self.buyer.pk)
        self.assertEqual(message.conversation_id, self.conversation.pk)
        self.assertIsNone(message.read_at)
        self.assertFalse(foreign.messages.exists())

    def test_read_status_only_changes_received_messages_in_current_conversation(self):
        incoming = Message.objects.create(conversation=self.conversation, sender=self.seller, body="Entrant")
        outgoing = Message.objects.create(conversation=self.conversation, sender=self.buyer, body="Sortant")
        foreign = Conversation.objects.create(listing=self.listing, buyer=self.other, seller=self.seller)
        unrelated = Message.objects.create(conversation=foreign, sender=self.seller, body="Autre discussion")
        self.client.force_authenticate(self.buyer)
        self.assertEqual(self.client.get(self.url).status_code, 200)
        incoming.refresh_from_db()
        outgoing.refresh_from_db()
        unrelated.refresh_from_db()
        self.assertIsNotNone(incoming.read_at)
        self.assertIsNone(outgoing.read_at)
        self.assertIsNone(unrelated.read_at)
        read_at = incoming.read_at
        self.client.get(self.url)
        incoming.refresh_from_db()
        self.assertEqual(incoming.read_at, read_at)

    def test_equal_timestamps_have_deterministic_pagination(self):
        messages = [Message.objects.create(conversation=self.conversation, sender=self.seller, body=str(index)) for index in range(12)]
        Message.objects.filter(conversation=self.conversation).update(created_at=timezone.now())
        self.client.force_authenticate(self.buyer)
        first = self.client.get(self.url)
        second = self.client.get(self.url, {"page": 2})
        ids = [item["id"] for item in first.data["results"] + second.data["results"]]
        self.assertEqual(ids, sorted((message.pk for message in messages), reverse=True))

    def test_missing_conversation_returns_404_for_read_and_send(self):
        self.client.force_authenticate(self.buyer)
        missing = "/api/conversations/999999/messages/"
        self.assertEqual(self.client.get(missing).status_code, 404)
        self.assertEqual(self.client.post(missing, {"body": "Bonjour"}).status_code, 404)

    def test_maximum_message_length_is_accepted_for_initial_and_followup_message(self):
        self.client.force_authenticate(self.buyer)
        body = "x" * 2000
        first = self.client.post("/api/conversations/", {"listing": self.listing.pk, "body": body})
        followup = self.client.post(self.url, {"body": body})
        self.assertEqual(first.status_code, 201)
        self.assertEqual(followup.status_code, 201)
        self.assertEqual(Message.objects.count(), 2)

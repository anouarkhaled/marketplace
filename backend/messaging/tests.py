from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from listings.models import Category, Listing

from .models import Conversation

User = get_user_model()


class MessagingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.buyer = User.objects.create_user(username="acheteur", password="Test1234!")
        self.seller = User.objects.create_user(username="vendeur", password="Test1234!")
        category = Category.objects.create(name="Appartement", slug="appartement")
        self.listing = Listing.objects.create(
            seller=self.seller, title="Appart", description="joli",
            price="1000", location="Tunis", category=category,
        )

    def auth(self, user):
        res = self.client.post("/api/token/", {"username": user.username, "password": "Test1234!"})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    def test_contacter_vendeur_cree_une_conversation(self):
        self.auth(self.buyer)
        res = self.client.post("/api/conversations/", {"listing": self.listing.id, "body": "Bonjour, encore dispo ?"})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Conversation.objects.count(), 1)
        conversation = Conversation.objects.first()
        self.assertEqual(conversation.buyer, self.buyer)
        self.assertEqual(conversation.seller, self.seller)
        self.assertEqual(conversation.messages.count(), 1)

    def test_vendeur_ne_peut_pas_se_contacter_lui_meme(self):
        self.auth(self.seller)
        res = self.client.post("/api/conversations/", {"listing": self.listing.id, "body": "Salut"})
        self.assertEqual(res.status_code, 400)

    def test_seul_un_participant_peut_lire_les_messages(self):
        self.auth(self.buyer)
        self.client.post("/api/conversations/", {"listing": self.listing.id, "body": "Bonjour"})
        conversation = Conversation.objects.first()

        intrus = User.objects.create_user(username="intrus", password="Test1234!")
        self.auth(intrus)
        res = self.client.get(f"/api/conversations/{conversation.id}/messages/")
        self.assertEqual(res.status_code, 403)

    def test_consulter_la_conversation_marque_les_messages_comme_lus(self):
        self.auth(self.buyer)
        self.client.post("/api/conversations/", {"listing": self.listing.id, "body": "Bonjour"})
        conversation = Conversation.objects.first()

        self.auth(self.seller)
        # Le vendeur consulte le fil : le message de l'acheteur passe à "lu"
        self.client.get(f"/api/conversations/{conversation.id}/messages/")
        res = self.client.post(f"/api/conversations/{conversation.id}/messages/", {"body": "Oui toujours dispo"})
        self.assertEqual(res.status_code, 201)

        unread = conversation.messages.filter(read_at__isnull=True)
        self.assertEqual(unread.count(), 1)  # seulement la réponse du vendeur, pas encore lue par l'acheteur

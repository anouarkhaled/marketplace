from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from .models import Category, Listing

User = get_user_model()


class ListingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="vendeur", password="Test1234!")
        self.other = User.objects.create_user(username="autre", password="Test1234!")
        self.category = Category.objects.create(name="Appartement", slug="appartement")

    def auth(self, user):
        """Connecte un utilisateur et pose le token."""
        res = self.client.post("/api/token/", {"username": user.username, "password": "Test1234!"})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    def test_liste_annonces_publique(self):
        """Un visiteur non connecté peut lister les annonces."""
        res = self.client.get("/api/listings/")
        self.assertEqual(res.status_code, 200)

    def test_creation_annonce_requiert_connexion(self):
        """Créer une annonce sans être connecté est refusé."""
        res = self.client.post("/api/listings/", {"title": "X", "description": "d", "price": "10", "location": "Tunis", "category": self.category.id})
        self.assertEqual(res.status_code, 401)

    def test_creation_annonce_connecte(self):
        """Un utilisateur connecté peut créer une annonce, liée à lui."""
        self.auth(self.user)
        res = self.client.post("/api/listings/", {"title": "Appart", "description": "joli", "price": "1000", "location": "Tunis", "category": self.category.id})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Listing.objects.first().seller, self.user)

    def test_seul_proprietaire_peut_supprimer(self):
        """Un autre utilisateur ne peut pas supprimer l'annonce d'autrui."""
        listing = Listing.objects.create(seller=self.user, title="A", description="d", price="10", location="T", category=self.category)
        self.auth(self.other)
        res = self.client.delete(f"/api/listings/{listing.id}/")
        self.assertEqual(res.status_code, 403)   # interdit
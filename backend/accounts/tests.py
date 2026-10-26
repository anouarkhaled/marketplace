from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import TestCase
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

User = get_user_model()


class PasswordResetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="jane", email="jane@example.com", password="AncienMdp123!",
        )

    def test_demande_reset_envoie_un_email_si_le_compte_existe(self):
        res = self.client.post("/api/password-reset/", {"email": "jane@example.com"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("reset-password", mail.outbox[0].body)

    def test_demande_reset_ne_revele_pas_les_emails_inconnus(self):
        res = self.client.post("/api/password-reset/", {"email": "inconnu@example.com"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)

    def test_confirmation_reset_change_le_mot_de_passe(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        res = self.client.post("/api/password-reset/confirm/", {
            "uid": uid, "token": token, "new_password": "NouveauMdp456!",
        })
        self.assertEqual(res.status_code, 200)

        login = self.client.post("/api/token/", {"username": "jane", "password": "NouveauMdp456!"})
        self.assertEqual(login.status_code, 200)

    def test_confirmation_reset_refuse_un_token_invalide(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        res = self.client.post("/api/password-reset/confirm/", {
            "uid": uid, "token": "token-invalide", "new_password": "NouveauMdp456!",
        })
        self.assertEqual(res.status_code, 400)

from io import BytesIO
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

User = get_user_model()


class AccountMVPTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username="owner", email="owner@example.com", password="SecureTest123!")
        cls.other = User.objects.create_user(username="other", email="other@example.com")

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def registration(self, **changes):
        data = {"username": "newuser", "email": "new@example.com", "password": "SecureTest123!", "password2": "SecureTest123!"}
        data.update(changes)
        return self.client.post("/api/register/", data)

    def test_registration_requires_email(self):
        self.assertEqual(self.registration(email="").status_code, 400)

    def test_registration_rejects_duplicate_email_case_insensitively(self):
        response = self.registration(email="OWNER@example.com")
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

    def test_registration_normalizes_email_and_hashes_password(self):
        self.assertEqual(self.registration(email="New@Example.COM").status_code, 201)
        user = User.objects.get(username="newuser")
        self.assertEqual(user.email, "new@example.com")
        self.assertTrue(user.check_password("SecureTest123!"))

    def test_database_prevents_duplicate_emails(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.create_user(username="duplicate", email="OWNER@example.com")

    def test_profile_rejects_another_users_email(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch("/api/profile/", {"email": "OTHER@example.com"}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "owner@example.com")

    def test_profile_accepts_own_email(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.patch("/api/profile/", {"email": "OWNER@example.com"}, format="multipart").status_code, 200)

    @override_settings(MAX_UPLOAD_IMAGE_SIZE=1)
    def test_avatar_size_is_enforced(self):
        self.client.force_authenticate(self.user)
        image = BytesIO()
        Image.new("RGB", (1, 1)).save(image, format="PNG")
        avatar = SimpleUploadedFile("avatar.png", image.getvalue(), content_type="image/png")
        response = self.client.patch("/api/profile/", {"avatar": avatar}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("avatar", response.data)

    def test_invalid_avatar_is_rejected(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch("/api/profile/", {"avatar": SimpleUploadedFile("bad.png", b"invalid")}, format="multipart")
        self.assertEqual(response.status_code, 400)

    def test_valid_avatar_can_be_uploaded(self):
        self.client.force_authenticate(self.user)
        image = BytesIO()
        Image.new("RGB", (1, 1)).save(image, format="PNG")
        with TemporaryDirectory() as directory, override_settings(MEDIA_ROOT=directory):
            response = self.client.patch("/api/profile/", {"avatar": SimpleUploadedFile("avatar.png", image.getvalue())}, format="multipart")
            self.assertEqual(response.status_code, 200)

    def test_sensitive_endpoints_enforce_their_own_throttle(self):
        endpoints = [
            ("/api/register/", "accounts.throttles.RegisterRateThrottle"),
            ("/api/token/", "accounts.throttles.LoginRateThrottle"),
            ("/api/password-reset/", "accounts.throttles.PasswordResetRateThrottle"),
            ("/api/password-reset/confirm/", "accounts.throttles.PasswordResetConfirmRateThrottle"),
        ]
        for endpoint, throttle in endpoints:
            with self.subTest(endpoint=endpoint), patch(f"{throttle}.get_rate", return_value="1/hour"):
                cache.clear()
                first = self.client.post(endpoint, {})
                self.assertEqual(first.status_code, 400)
                second = self.client.post(endpoint, {})
                self.assertEqual(second.status_code, 429)
                self.assertIn("Retry-After", second)

    def test_invalid_login_returns_json_instead_of_server_error(self):
        response = self.client.post("/api/token/", {"username": "owner", "password": "wrong"})
        self.assertEqual(response.status_code, 401)
        self.assertIn("detail", response.json())

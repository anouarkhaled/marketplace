from datetime import datetime, timedelta
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from config.test_helpers import IsolatedAPITestCase, image_upload

User = get_user_model()


class AccountRegressionTests(IsolatedAPITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username="account-owner", email="owner@example.test", password="StrongPassword123!")
        cls.other = User.objects.create_user(username="account-other", email="other@example.test", phone="private")

    def registration(self, **changes):
        data = {"username": "new-user", "email": "new@example.test", "password": "AnotherStrong123!", "password2": "AnotherStrong123!"}
        data.update(changes)
        return self.client.post("/api/register/", data, format="json")

    def test_password_mismatch_does_not_create_account(self):
        count = User.objects.count()
        self.assertEqual(self.registration(password2="different").status_code, 400)
        self.assertEqual(User.objects.count(), count)

    def test_weak_passwords_are_rejected(self):
        for password in ("short", "123456789", "password"):
            with self.subTest(password=password):
                response = self.registration(password=password, password2=password)
                self.assertEqual(response.status_code, 400)
                self.assertIn("password", response.data)
        self.assertFalse(User.objects.filter(username="new-user").exists())

    def test_duplicate_username_is_rejected(self):
        self.assertEqual(self.registration(username=self.user.username).status_code, 400)

    def test_password_matching_username_is_rejected(self):
        value = "PublicIdentifier2026"
        response = self.registration(username=value, password=value, password2=value)
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(username=value).exists())

    def test_registration_cannot_grant_staff_privileges(self):
        response = self.registration(is_staff=True, is_superuser=True, is_active=False)
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="new-user")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.is_active)
        self.assertNotIn("password", response.data)
        self.assertNotIn("password2", response.data)

    def test_profile_requires_authentication(self):
        for method in (self.client.get, self.client.patch):
            self.assertEqual(method("/api/profile/").status_code, 401)

    def test_profile_update_only_changes_current_account(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch("/api/profile/", {
            "id": self.other.pk, "username": "hijacked", "email": "NEW@Example.test",
            "phone": "+216 20000000", "is_staff": True, "is_superuser": True,
        }, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.other.refresh_from_db()
        self.assertEqual(self.user.username, "account-owner")
        self.assertEqual(self.user.email, "new@example.test")
        self.assertEqual(self.user.phone, "+216 20000000")
        self.assertFalse(self.user.is_staff)
        self.assertFalse(self.user.is_superuser)
        self.assertEqual(self.other.email, "other@example.test")
        self.assertEqual(self.other.phone, "private")

    def test_expired_access_is_rejected_and_refresh_restores_access(self):
        access = AccessToken.for_user(self.user)
        access.set_exp(lifetime=timedelta(seconds=-1))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(self.client.get("/api/profile/").status_code, 401)
        refresh = RefreshToken.for_user(self.user)
        response = self.client.post("/api/token/refresh/", {"refresh": str(refresh)})
        self.assertEqual(response.status_code, 200)
        self.assertIn("refresh", response.data)
        self.assertNotEqual(response.data["refresh"], str(refresh))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        profile = self.client.get("/api/profile/")
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.data["id"], self.user.pk)

    def test_expired_refresh_is_rejected(self):
        refresh = RefreshToken.for_user(self.user)
        refresh.set_exp(lifetime=timedelta(seconds=-1))
        self.assertEqual(self.client.post("/api/token/refresh/", {"refresh": str(refresh)}).status_code, 401)

    def test_refresh_token_cannot_be_used_as_access_token(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(self.user)}")
        self.assertEqual(self.client.get("/api/profile/").status_code, 401)

    def test_inactive_account_cannot_login_or_use_existing_access(self):
        access = AccessToken.for_user(self.user)
        self.user.is_active = False
        self.user.save()
        response = self.client.post("/api/token/", {"username": self.user.username, "password": "StrongPassword123!"})
        self.assertEqual(response.status_code, 401)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(self.client.get("/api/profile/").status_code, 401)

    def test_stats_require_staff(self):
        self.assertEqual(self.client.get("/api/stats/").status_code, 401)
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get("/api/stats/").status_code, 403)
        self.user.is_staff = True
        self.user.save()
        self.assertEqual(self.client.get("/api/stats/").status_code, 200)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PasswordResetRegressionTests(IsolatedAPITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username="reset-owner", email="reset@example.test", password="OldStrongPassword123!")

    def payload(self, token=None):
        return {
            "uid": urlsafe_base64_encode(force_bytes(self.user.pk)),
            "token": token or default_token_generator.make_token(self.user),
            "new_password": "NewStrongPassword456!",
        }

    def test_email_contains_usable_frontend_link(self):
        with override_settings(FRONTEND_URL="https://marketplace.example.test"):
            response = self.client.post("/api/password-reset/", {"email": "RESET@example.test"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.user.email])
        link = next(line for line in mail.outbox[0].body.splitlines() if line.startswith("https://"))
        parsed = urlsplit(link)
        self.assertEqual(parsed.netloc, "marketplace.example.test")
        self.assertEqual(parsed.path, "/reset-password")
        params = parse_qs(parsed.query)
        payload = {key: params[key][0] for key in ("uid", "token")}
        payload["new_password"] = "NewStrongPassword456!"
        self.assertEqual(self.client.post("/api/password-reset/confirm/", payload).status_code, 200)

    def test_unknown_email_has_same_response_as_known_email(self):
        known = self.client.post("/api/password-reset/", {"email": self.user.email})
        unknown = self.client.post("/api/password-reset/", {"email": "unknown@example.test"})
        self.assertEqual((known.status_code, known.data), (unknown.status_code, unknown.data))
        self.assertEqual(len(mail.outbox), 1)

    def test_expired_reset_token_is_rejected_without_changing_password(self):
        now = datetime(2026, 1, 1, 12)
        with patch.object(default_token_generator, "_now", return_value=now):
            payload = self.payload()
        with patch.object(default_token_generator, "_now", return_value=now + timedelta(seconds=settings.PASSWORD_RESET_TIMEOUT + 1)):
            response = self.client.post("/api/password-reset/confirm/", payload)
        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("OldStrongPassword123!"))

    def test_reset_token_is_single_use_and_old_password_no_longer_logs_in(self):
        payload = self.payload()
        self.assertEqual(self.client.post("/api/password-reset/confirm/", payload).status_code, 200)
        self.assertEqual(self.client.post("/api/password-reset/confirm/", payload).status_code, 400)
        self.assertEqual(self.client.post("/api/token/", {"username": self.user.username, "password": "OldStrongPassword123!"}).status_code, 401)
        self.assertEqual(self.client.post("/api/token/", {"username": self.user.username, "password": payload["new_password"]}).status_code, 200)

    def test_malformed_user_ids_return_validation_error(self):
        for uid in ("not-base64", "_w", "OTk5OTk5OTk5"):
            with self.subTest(uid=uid):
                self.assertEqual(self.client.post("/api/password-reset/confirm/", {**self.payload(), "uid": uid}).status_code, 400)

    def test_weak_reset_password_is_rejected_and_token_remains_usable(self):
        payload = self.payload()
        self.assertEqual(self.client.post("/api/password-reset/confirm/", {**payload, "new_password": "123"}).status_code, 400)
        self.assertEqual(self.client.post("/api/password-reset/confirm/", payload).status_code, 200)

    def test_reset_password_matching_username_is_rejected(self):
        value = "PublicIdentifier2026"
        self.user.username = value
        self.user.save()
        response = self.client.post("/api/password-reset/confirm/", {**self.payload(), "new_password": value})
        self.assertEqual(response.status_code, 400)


class AvatarBoundaryTests(IsolatedAPITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username="avatar-owner", email="avatar@example.test")

    def test_exact_maximum_size_is_accepted(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch("/api/profile/", {"avatar": image_upload(size=settings.MAX_UPLOAD_IMAGE_SIZE)}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.avatar.size, settings.MAX_UPLOAD_IMAGE_SIZE)

    def test_one_byte_above_maximum_is_rejected(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch("/api/profile/", {"avatar": image_upload(size=settings.MAX_UPLOAD_IMAGE_SIZE + 1)}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertFalse(self.user.avatar)

"""Test database selection uses TEST_DATABASE_URL, independently of DATABASE_URL."""
import os

import dj_database_url

# The production settings validate this value during import, before overrides.
os.environ.setdefault("SECRET_KEY", "marketplace-tests-only-key-do-not-use-in-production-2026")

from .settings import *  # noqa: F403,E402

DEBUG = False
SECRET_KEY = "marketplace-tests-only-key-do-not-use-in-production-2026"
ALLOWED_HOSTS = ["testserver", "localhost", "127.0.0.1"]
DATABASES = {
    "default": dj_database_url.parse(os.environ.get("TEST_DATABASE_URL", "sqlite:///:memory:")),
}
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache", "LOCATION": "marketplace-tests"}}
SECURE_SSL_REDIRECT = False
TEST_RUNNER = "config.test_runner.IsolatedTestRunner"

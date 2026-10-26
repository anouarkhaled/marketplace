from io import BytesIO
from tempfile import TemporaryDirectory

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient


def image_upload(name="photo.png", size=None):
    """Create a real PNG, optionally padded to an exact upload boundary."""
    stream = BytesIO()
    Image.new("RGB", (2, 2), "blue").save(stream, format="PNG")
    content = stream.getvalue()
    if size is not None:
        if size < len(content):
            raise ValueError("Requested size is too small for the image.")
        content += b"\0" * (size - len(content))
    return SimpleUploadedFile(name, content, content_type="image/png")


class IsolatedAPITestCase(TestCase):
    def setUp(self):
        super().setUp()
        cache.clear()
        self.addCleanup(cache.clear)
        self.client = APIClient()
        media = TemporaryDirectory(prefix="marketplace-test-upload-")
        self.addCleanup(media.cleanup)
        settings = override_settings(MEDIA_ROOT=media.name)
        settings.enable()
        self.addCleanup(settings.disable)

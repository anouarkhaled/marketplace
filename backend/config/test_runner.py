from pathlib import Path
from tempfile import TemporaryDirectory

from django.test import override_settings
from django.test.runner import DiscoverRunner


class IsolatedTestRunner(DiscoverRunner):
    def run_tests(self, *args, **kwargs):
        with TemporaryDirectory(prefix="marketplace-tests-") as directory:
            root = Path(directory)
            static_root = root / "static"
            static_root.mkdir()
            with override_settings(MEDIA_ROOT=root / "media", STATIC_ROOT=static_root):
                return super().run_tests(*args, **kwargs)

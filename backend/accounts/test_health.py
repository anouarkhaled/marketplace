from unittest.mock import patch

from django.db import DatabaseError

from config.test_helpers import IsolatedAPITestCase


class HealthTests(IsolatedAPITestCase):
    def test_ready_database_returns_ok_without_authentication(self):
        response = self.client.get("/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_database_failure_returns_503_without_connection_details(self):
        with patch("config.health.connection.cursor", side_effect=DatabaseError("private connection details")):
            response = self.client.get("/health/")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"status": "unavailable"})

    def test_health_endpoint_rejects_writes(self):
        self.assertEqual(self.client.post("/health/").status_code, 405)

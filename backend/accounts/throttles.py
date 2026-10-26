from rest_framework.throttling import SimpleRateThrottle


class AuthRateThrottle(SimpleRateThrottle):
    """Limit sensitive endpoints per client IP, including authenticated requests."""

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


class RegisterRateThrottle(AuthRateThrottle):
    scope = "register"


class LoginRateThrottle(AuthRateThrottle):
    scope = "login"


class PasswordResetRateThrottle(AuthRateThrottle):
    scope = "password_reset"


class PasswordResetConfirmRateThrottle(AuthRateThrottle):
    scope = "password_reset_confirm"

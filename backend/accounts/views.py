from rest_framework import generics, permissions
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer
from rest_framework.settings import api_settings
from rest_framework_simplejwt.views import TokenObtainPairView
from .throttles import (
    LoginRateThrottle, RegisterRateThrottle,
    PasswordResetRateThrottle, PasswordResetConfirmRateThrottle,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    authentication_classes = []
    throttle_classes = [*api_settings.DEFAULT_THROTTLE_CLASSES, RegisterRateThrottle]
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class LoginView(TokenObtainPairView):
    throttle_classes = [*api_settings.DEFAULT_THROTTLE_CLASSES, LoginRateThrottle]
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import ProfileSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]   # pour l'upload d'avatar

    def get_object(self):
        return self.request.user   # toujours l'utilisateur connecté
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from listings.models import Listing
from favorites.models import Favorite

User = get_user_model()


class StatsView(APIView):
    permission_classes = [permissions.IsAdminUser]   # ← réservé aux admins (is_staff)

    def get(self, request):
        return Response({
            "users": User.objects.count(),
            "listings_total": Listing.objects.count(),
            "listings_active": Listing.objects.filter(is_active=True).count(),
            "listings_hidden": Listing.objects.filter(is_active=False).count(),
            "favorites": Favorite.objects.count(),
        })


from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from .serializers import PasswordResetConfirmSerializer, PasswordResetRequestSerializer


class PasswordResetRequestView(APIView):
    """Envoie un email avec un lien de réinitialisation si le compte existe."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [*api_settings.DEFAULT_THROTTLE_CLASSES, PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = User.objects.filter(email__iexact=email).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            send_mail(
                subject="Réinitialisation de votre mot de passe",
                message=(
                    f"Bonjour {user.username},\n\n"
                    "Vous avez demandé la réinitialisation de votre mot de passe.\n"
                    f"Cliquez sur ce lien pour en choisir un nouveau :\n{reset_link}\n\n"
                    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )

        # Toujours la même réponse, pour ne pas révéler quels emails sont enregistrés
        return Response(
            {"detail": "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé."}
        )


class PasswordResetConfirmView(APIView):
    """Vérifie le token et applique le nouveau mot de passe."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [*api_settings.DEFAULT_THROTTLE_CLASSES, PasswordResetConfirmRateThrottle]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"detail": "Mot de passe réinitialisé avec succès."})

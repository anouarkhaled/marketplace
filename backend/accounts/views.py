from rest_framework import generics, permissions
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer
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
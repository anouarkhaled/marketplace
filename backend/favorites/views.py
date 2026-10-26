from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Favorite
from .serializers import FavoriteSerializer
from listings.models import Listing
from rest_framework.generics import get_object_or_404


class FavoriteListView(generics.ListAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user, listing__is_active=True).order_by("-created_at")


class FavoriteToggleView(APIView):
    """Ajoute le favori s'il n'existe pas, le retire s'il existe (toggle)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, listing_id):
        listing = get_object_or_404(Listing, pk=listing_id, is_active=True)
        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            listing=listing,
        )
        if not created:
            # Existait déjà → on le retire
            favorite.delete()
            return Response({"favorited": False}, status=status.HTTP_200_OK)
        return Response({"favorited": True}, status=status.HTTP_201_CREATED)

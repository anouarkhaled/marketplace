from rest_framework import generics, permissions
from .models import Listing
from .serializers import ListingSerializer


class ListingListCreateView(generics.ListCreateAPIView):
    queryset = Listing.objects.filter(is_active=True).order_by("-created_at")
    serializer_class = ListingSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]   # créer = connecté
        return [permissions.AllowAny()]              # lire = tout le monde

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)    # vendeur = user connecté
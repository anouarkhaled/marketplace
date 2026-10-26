from rest_framework import generics, permissions, filters   # ← ajoute filters
from .models import Listing
from .serializers import ListingSerializer

from rest_framework.parsers import MultiPartParser, FormParser
from .models import Listing, ListingImage
from .serializers import ListingImageSerializer



from django_filters.rest_framework import DjangoFilterBackend
from .filters import ListingFilter
from django.db.models import Q
from rest_framework.generics import get_object_or_404

class ListingListCreateView(generics.ListCreateAPIView):
    queryset = Listing.objects.filter(is_active=True).order_by("-created_at")
    serializer_class = ListingSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]   # ← les deux
    filterset_class = ListingFilter                                 # ← ajouté
    search_fields = ["title", "description", "location"]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
class ListingImageUploadView(generics.CreateAPIView):
    serializer_class = ListingImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]   # pour recevoir des fichiers

    def perform_create(self, serializer):
        listing = get_object_or_404(Listing, pk=self.kwargs["listing_id"])
        # Sécurité : seul le propriétaire de l'annonce peut ajouter une photo
        if listing.seller != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous n'êtes pas le propriétaire de cette annonce.")
        serializer.save(listing=listing)


class ListingImageDeleteView(generics.DestroyAPIView):
    queryset = ListingImage.objects.all()
    serializer_class = ListingImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        # Sécurité : seul le propriétaire de l'annonce peut retirer une photo
        if obj.listing.seller != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous n'êtes pas le propriétaire de cette annonce.")
        return obj


from .permissions import IsOwnerOrReadOnly


class ListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ListingSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        listings = Listing.objects.all()
        if user.is_authenticated:
            if user.is_staff:
                return listings
            return listings.filter(Q(is_active=True) | Q(seller=user))
        return listings.filter(is_active=True)
from .models import Category
from .serializers import CategorySerializer


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.order_by("name", "pk")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
class MyListingsView(generics.ListAPIView):
    serializer_class = ListingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Seulement les annonces du vendeur connecté
        return Listing.objects.filter(seller=self.request.user).order_by("-created_at")

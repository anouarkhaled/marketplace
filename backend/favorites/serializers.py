from rest_framework import serializers
from .models import Favorite
from listings.serializers import ListingSerializer


class FavoriteSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ["id", "listing", "created_at"]
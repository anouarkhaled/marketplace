from rest_framework import serializers
from .models import Listing, Category, ListingImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "type"]


class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ["id", "image", "uploaded_at"]


class ListingSerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)
    seller = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Listing
        fields = [
            "id", "title", "description", "price", "location",
            "category", "seller", "images", "is_active", "created_at",
        ]
        read_only_fields = ["seller", "created_at"]
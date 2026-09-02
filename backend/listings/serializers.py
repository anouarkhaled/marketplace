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


from django.contrib.auth import get_user_model

User = get_user_model()


class SellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "phone"]

   
class ListingSerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)
    seller = SellerSerializer(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    is_favorited = serializers.SerializerMethodField()   # ← ajouté

    class Meta:
        model = Listing
        fields = [
            "id", "title", "description", "price", "location",
            "category", "category_name", "seller", "images",
            "is_favorited", "is_active", "created_at",   # ← ajoute is_favorited
        ]
        read_only_fields = ["seller", "created_at"]

    def get_is_favorited(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.favorited_by.filter(user=request.user).exists()
        return False
    def to_representation(self, instance):
            data = super().to_representation(instance)
            # Masquer email + téléphone si l'utilisateur n'est pas connecté
            request = self.context.get("request")
            if not (request and request.user.is_authenticated):
                data["seller"].pop("email", None)
                data["seller"].pop("phone", None)
            return data
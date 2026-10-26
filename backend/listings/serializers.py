from rest_framework import serializers
from .models import Listing, Category, ListingImage
from config.validators import validate_image_size


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "type"]


class ListingImageSerializer(serializers.ModelSerializer):
    def validate_image(self, value):
        return validate_image_size(value)

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
    is_moderated = serializers.SerializerMethodField()

    def get_is_moderated(self, obj):
        return bool(obj.moderated_at and not obj.is_active)

    images = ListingImageSerializer(many=True, read_only=True)
    seller = SellerSerializer(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    is_favorited = serializers.SerializerMethodField()   # ← ajouté

    def validate(self, attrs):
        if (
            self.instance and self.instance.moderated_at
            and attrs.get("is_active") is True
        ):
            raise serializers.ValidationError({
                "is_active": "Seul un administrateur peut réactiver une annonce modérée."
            })
        return attrs

    class Meta:
        model = Listing
        fields = [
            "id", "title", "description", "price", "location",
            "category", "category_name", "seller", "images",
            "is_favorited", "is_active", "is_moderated", "created_at",
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

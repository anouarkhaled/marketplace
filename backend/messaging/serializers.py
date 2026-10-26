from django.contrib.auth import get_user_model
from rest_framework import serializers

from listings.models import Listing

from .models import Conversation, Message

User = get_user_model()


class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "avatar"]


class MessageSerializer(serializers.ModelSerializer):
    sender = ParticipantSerializer(read_only=True)
    body = serializers.CharField(max_length=2000)

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "body", "created_at", "read_at"]
        read_only_fields = ["sender", "created_at", "read_at", "conversation"]


class ConversationSerializer(serializers.ModelSerializer):
    buyer = ParticipantSerializer(read_only=True)
    seller = ParticipantSerializer(read_only=True)
    listing_title = serializers.CharField(source="listing.title", read_only=True)
    listing_image = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id", "listing", "listing_title", "listing_image",
            "buyer", "seller", "created_at", "last_message", "unread_count",
        ]

    def get_listing_image(self, obj):
        first = obj.listing.images.first()
        if not first:
            return None
        request = self.context.get("request")
        url = first.image.url
        return request.build_absolute_uri(url) if request else url

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        if not last:
            return None
        return {
            "body": last.body,
            "created_at": last.created_at,
            "sender_id": last.sender_id,
        }

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        return obj.messages.exclude(sender=request.user).filter(read_at__isnull=True).count()


class ConversationCreateSerializer(serializers.Serializer):
    listing = serializers.PrimaryKeyRelatedField(queryset=Listing.objects.filter(is_active=True))
    body = serializers.CharField(max_length=2000)

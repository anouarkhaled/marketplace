from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from .models import Conversation, Message
from .serializers import (
    ConversationCreateSerializer,
    ConversationSerializer,
    MessageSerializer,
)


class ConversationListCreateView(generics.ListAPIView):
    """Liste les conversations de l'utilisateur ; POST démarre (ou réutilise) une conversation."""

    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(Q(buyer=user) | Q(seller=user)).order_by("-created_at", "-pk")

    def post(self, request, *args, **kwargs):
        serializer = ConversationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        listing = serializer.validated_data["listing"]
        body = serializer.validated_data["body"]

        if listing.seller_id == request.user.id:
            return Response(
                {"detail": "Vous ne pouvez pas vous contacter vous-même."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        conversation, _ = Conversation.objects.get_or_create(
            listing=listing,
            buyer=request.user,
            defaults={"seller": listing.seller},
        )
        Message.objects.create(conversation=conversation, sender=request.user, body=body)
        return Response(
            ConversationSerializer(conversation, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ConversationDetailView(generics.RetrieveAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(Q(buyer=user) | Q(seller=user))


class MessageListCreateView(generics.ListCreateAPIView):
    """Liste les messages d'une conversation (et les marque lus) ; POST envoie un message."""

    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_conversation(self):
        conversation = get_object_or_404(Conversation, pk=self.kwargs["conversation_id"])
        if self.request.user not in (conversation.buyer, conversation.seller):
            raise PermissionDenied("Vous ne participez pas à cette conversation.")
        return conversation

    def get_queryset(self):
        conversation = self.get_conversation()
        return conversation.messages.select_related("sender").order_by("-created_at", "-pk")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        messages = list(page if page is not None else queryset)
        now = timezone.now()
        unread_ids = [
            message.pk for message in messages
            if message.sender_id != request.user.pk and message.read_at is None
        ]
        Message.objects.filter(pk__in=unread_ids, read_at__isnull=True).update(read_at=now)
        for message in messages:
            if message.pk in unread_ids:
                message.read_at = now
        data = self.get_serializer(messages, many=True).data
        return self.get_paginated_response(data) if page is not None else Response(data)

    def perform_create(self, serializer):
        conversation = self.get_conversation()
        serializer.save(sender=self.request.user, conversation=conversation)

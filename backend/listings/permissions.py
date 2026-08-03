from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Lecture pour tous, écriture/suppression réservée au propriétaire."""

    def has_object_permission(self, request, view, obj):
        # GET, HEAD, OPTIONS → autorisés pour tout le monde
        if request.method in permissions.SAFE_METHODS:
            return True
        # PUT, PATCH, DELETE → seulement le vendeur propriétaire
        return obj.seller == request.user
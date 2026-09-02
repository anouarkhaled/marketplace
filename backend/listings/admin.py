from django.contrib import admin
from django.utils import timezone
from .models import Category, Listing, ListingImage


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 1


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ["title", "seller", "price", "location", "category", "is_active", "moderated_at", "created_at"]
    list_filter = ["is_active", "category", "created_at"]
    search_fields = ["title", "description", "location", "seller__username"]
    list_editable = ["is_active"]
    ordering = ["-created_at"]
    inlines = [ListingImageInline]
    actions = ["moderer_annonces"]            # ← action personnalisée

    @admin.action(description="🚫 Masquer pour non-conformité")
    def moderer_annonces(self, request, queryset):
        count = queryset.update(
            is_active=False,
            moderated_at=timezone.now(),
            moderation_reason="Contenu non conforme (modération admin)",
        )
        self.message_user(request, f"{count} annonce(s) masquée(s) pour non-conformité.")
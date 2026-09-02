from django.contrib import admin
from .models import Category, Listing, ListingImage


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 1


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ["title", "seller", "price", "location", "category", "is_active", "created_at"]
    list_filter = ["is_active", "category", "created_at"]
    search_fields = ["title", "description", "location", "seller__username"]
    list_editable = ["is_active"]        # basculer actif/inactif directement dans la liste
    ordering = ["-created_at"]
    inlines = [ListingImageInline]       # voir/ajouter les photos depuis l'annonce


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "type"]
    prepopulated_fields = {"slug": ("name",)}   # slug auto-généré depuis le nom
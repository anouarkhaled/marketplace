from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ["username", "email", "phone", "is_seller", "is_active", "is_staff", "date_joined"]
    list_filter = ["is_seller", "is_active", "is_staff"]
    search_fields = ["username", "email", "phone"]
    ordering = ["-date_joined"]

    fieldsets = UserAdmin.fieldsets + (
        ("Informations marketplace", {"fields": ("phone", "is_seller", "avatar")}),
    )
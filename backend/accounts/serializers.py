from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from django.db import IntegrityError, transaction
from config.validators import validate_image_size

User = get_user_model()


class UniqueEmailMixin:
    def validate_email(self, value):
        value = value.strip().lower()
        users = User.objects.filter(email__iexact=value)
        if self.instance:
            users = users.exclude(pk=self.instance.pk)
        if users.exists():
            raise serializers.ValidationError("Cette adresse email est déjà utilisée.")
        return value

    def save(self, **kwargs):
        try:
            with transaction.atomic():
                return super().save(**kwargs)
        except IntegrityError:
            # A concurrent registration/profile update may have claimed the email.
            email = self.validated_data.get("email")
            users = User.objects.filter(email__iexact=email) if email else User.objects.none()
            if self.instance:
                users = users.exclude(pk=self.instance.pk)
            if users.exists():
                raise serializers.ValidationError({"email": "Cette adresse email est déjà utilisée."})
            raise


class RegisterSerializer(UniqueEmailMixin, serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["username", "email", "phone", "password", "password2"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Les deux mots de passe ne correspondent pas."}
            )
        user = User(username=attrs.get("username", ""), email=attrs.get("email", ""))
        try:
            validate_password(attrs["password"], user=user)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"password": error.messages}) from error
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        # create_user hash automatiquement le mot de passe
        user = User.objects.create_user(**validated_data)
        return user
class ProfileSerializer(UniqueEmailMixin, serializers.ModelSerializer):
    email = serializers.EmailField(required=True)

    def validate_avatar(self, value):
        return validate_image_size(value)

    class Meta:
        model = User
        fields = ["id", "username", "email", "phone", "avatar", "is_staff"]
        read_only_fields = ["id", "username", "is_staff"]   # on ne change pas le username ici


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_decode

        try:
            uid = urlsafe_base64_decode(attrs["uid"]).decode()
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise serializers.ValidationError({"uid": "Lien invalide."})

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"token": "Lien invalide ou expiré."})

        try:
            validate_password(attrs["new_password"], user=user)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"new_password": error.messages}) from error

        attrs["user"] = user
        return attrs

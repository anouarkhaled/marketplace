from django.conf import settings
from rest_framework import serializers


def validate_image_size(image):
    if image and image.size > settings.MAX_UPLOAD_IMAGE_SIZE:
        raise serializers.ValidationError("L'image dépasse la taille maximale autorisée (5 Mo).")
    return image

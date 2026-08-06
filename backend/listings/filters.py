import django_filters
from .models import Listing


class ListingFilter(django_filters.FilterSet):
    # Prix min / max
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    # Localisation : contient (insensible à la casse)
    location = django_filters.CharFilter(field_name="location", lookup_expr="icontains")
    # Type de bien : via le type de la catégorie liée
    type = django_filters.CharFilter(field_name="category__type", lookup_expr="iexact")

    class Meta:
        model = Listing
        fields = ["category", "location", "min_price", "max_price", "type"]
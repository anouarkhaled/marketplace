from django.core.management.base import BaseCommand
from django.db import transaction

from listings.models import Category


class Command(BaseCommand):
    help = "Ajoute les catégories initiales de la V1 sans modifier les catégories existantes."

    @transaction.atomic
    def handle(self, *args, **options):
        categories = [
            ("equipements-professionnels", "Équipements professionnels"),
            ("vehicules", "Véhicules"),
            ("informatique-electronique", "Informatique et électronique"),
            ("maison-jardin", "Maison et jardin"),
            ("immobilier", "Immobilier"),
            ("services", "Services"),
            ("autres", "Autres"),
        ]
        created = 0
        for slug, name in categories:
            _, added = Category.objects.get_or_create(slug=slug, defaults={"name": name})
            created += added
        self.stdout.write(self.style.SUCCESS(f"{created} catégorie(s) ajoutée(s)."))

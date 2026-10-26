from django.db import migrations, models
from django.db.models.functions import Lower


def check_duplicate_emails(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    duplicates = (
        User.objects.using(schema_editor.connection.alias)
        .exclude(email="")
        .annotate(normalized_email=Lower("email"))
        .values("normalized_email")
        .annotate(total=models.Count("pk"))
        .filter(total__gt=1)
    )
    if duplicates.exists():
        raise RuntimeError(
            "Des comptes partagent la même adresse email (sans distinction de casse). "
            "Corrigez ces doublons avant de relancer migrate. Aucun compte n'a été modifié."
        )


class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_remove_user_is_seller")]

    operations = [
        migrations.RunPython(check_duplicate_emails, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="user",
            constraint=models.UniqueConstraint(
                Lower("email"),
                condition=~models.Q(email=""),
                name="accounts_user_email_ci_unique",
            ),
        ),
    ]

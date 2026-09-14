from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0006_quotelineitem_quantity'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='quotelineitem',
            name='markup_percent',
        ),
        migrations.RenameField(
            model_name='quotelineitem',
            old_name='cost',
            new_name='unit_price',
        ),
    ]

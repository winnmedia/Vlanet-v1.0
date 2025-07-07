# Generated migration for Feedback
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="Feedback",
            fields=[
                ('id', models.AutoField(primary_key=True)),
                ('id', models.IntegerField()),
                ('title', models.CharField(max_length=255)),
                ('content', models.CharField(max_length=255)),
                ('is_resolved', models.BooleanField()),
                ('priority', models.IntegerField()),
                ('score', models.FloatField()),
                ('attachments', models.JSONField()),
                ('reviewer_data', models.JSONField()),
            ],
        ),
    ]

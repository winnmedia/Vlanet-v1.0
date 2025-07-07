# Generated migration for Video-Planning
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="Video-Planning",
            fields=[
                ('id', models.AutoField(primary_key=True)),
                ('id', models.IntegerField()),
                ('title', models.CharField(max_length=255)),
                ('description', models.CharField(max_length=255)),
                ('is_active', models.BooleanField()),
                ('view_count', models.IntegerField()),
                ('rating', models.FloatField()),
                ('tags', models.JSONField()),
                ('metadata', models.JSONField()),
                ('created_at', models.CharField(max_length=255)),
            ],
        ),
    ]

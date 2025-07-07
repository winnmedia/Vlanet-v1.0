# Generated migration for Project
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="Project",
            fields=[
                ('id', models.AutoField(primary_key=True)),
                ('id', models.IntegerField()),
                ('name', models.CharField(max_length=255)),
                ('manager', models.CharField(max_length=255)),
                ('is_public', models.BooleanField()),
                ('budget', models.IntegerField()),
                ('completion_rate', models.FloatField()),
                ('team_members', models.JSONField()),
                ('settings', models.JSONField()),
            ],
        ),
    ]

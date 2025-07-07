# Generated migration for ProjectFromSpec
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    
    operations = [
        migrations.CreateModel(
            name='ProjectFromSpec',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255, null=True, blank=True)),
                ('manager', models.CharField(max_length=255, null=True, blank=True)),
                ('consumer', models.CharField(max_length=255, null=True, blank=True)),
                ('description', models.CharField(max_length=255, null=True, blank=True)),
                ('color', models.CharField(max_length=255, null=True, blank=True)),
                ('tone_manner', models.CharField(max_length=255, null=True, blank=True)),
                ('genre', models.CharField(max_length=255, null=True, blank=True)),
                ('concept', models.CharField(max_length=255, null=True, blank=True)),
                ('created', models.CharField(max_length=255, null=True, blank=True)),
                ('updated', models.CharField(max_length=255, null=True, blank=True)),
            ],
            options={
                'db_table': 'project_from_spec',
                'verbose_name': 'Project (API 스펙)',
                'verbose_name_plural': 'Projects (API 스펙)',
                'ordering': ['-id'],
            },
        ),
    ]

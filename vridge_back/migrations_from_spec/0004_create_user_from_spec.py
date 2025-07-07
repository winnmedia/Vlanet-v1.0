# Generated migration for UserFromSpec
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    
    operations = [
        migrations.CreateModel(
            name='UserFromSpec',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('username', models.CharField(max_length=255, null=True, blank=True)),
                ('email', models.EmailField(max_length=254, null=True, blank=True)),
                ('first_name', models.CharField(max_length=255, null=True, blank=True)),
                ('last_name', models.CharField(max_length=255, null=True, blank=True)),
                ('is_active', models.BooleanField(default=False)),
                ('is_staff', models.BooleanField(default=False)),
                ('date_joined', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'user_from_spec',
                'verbose_name': 'User (API 스펙)',
                'verbose_name_plural': 'Users (API 스펙)',
                'ordering': ['-id'],
            },
        ),
    ]

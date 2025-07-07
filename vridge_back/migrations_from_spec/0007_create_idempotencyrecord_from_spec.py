# Generated migration for IdempotencyRecordFromSpec
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    
    operations = [
        migrations.CreateModel(
            name='IdempotencyRecordFromSpec',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('idempotency_key', models.CharField(max_length=255, null=True, blank=True)),
                ('project_id', models.IntegerField(null=True, blank=True)),
                ('request_data', models.CharField(max_length=255, null=True, blank=True)),
                ('status', models.CharField(max_length=255, null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'idempotencyrecord_from_spec',
                'verbose_name': 'IdempotencyRecord (API 스펙)',
                'verbose_name_plural': 'IdempotencyRecords (API 스펙)',
                'ordering': ['-id'],
            },
        ),
    ]

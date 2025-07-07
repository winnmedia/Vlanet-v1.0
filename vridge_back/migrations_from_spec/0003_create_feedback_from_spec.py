# Generated migration for FeedbackFromSpec
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    
    operations = [
        migrations.CreateModel(
            name='FeedbackFromSpec',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255, null=True, blank=True)),
                ('url', models.URLField(max_length=500, null=True, blank=True)),
                ('description', models.CharField(max_length=255, null=True, blank=True)),
                ('status', models.CharField(max_length=255, null=True, blank=True)),
                ('is_public', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'feedback_from_spec',
                'verbose_name': 'Feedback (API 스펙)',
                'verbose_name_plural': 'Feedbacks (API 스펙)',
                'ordering': ['-id'],
            },
        ),
    ]

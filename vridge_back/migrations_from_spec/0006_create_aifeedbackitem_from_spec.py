# Generated migration for AIFeedbackItemFromSpec
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    
    operations = [
        migrations.CreateModel(
            name='AIFeedbackItemFromSpec',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('feedback_type', models.CharField(max_length=255, null=True, blank=True)),
                ('confidence', models.FloatField(null=True, blank=True)),
                ('teacher_personality', models.CharField(max_length=255, null=True, blank=True)),
                ('feedback_content', models.CharField(max_length=255, null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'aifeedbackitem_from_spec',
                'verbose_name': 'AIFeedbackItem (API 스펙)',
                'verbose_name_plural': 'AIFeedbackItems (API 스펙)',
                'ordering': ['-id'],
            },
        ),
    ]

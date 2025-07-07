# Generated migration for VideoPlanningFromSpec
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    
    operations = [
        migrations.CreateModel(
            name='VideoPlanningFromSpec',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255, null=True, blank=True)),
                ('planning_text', models.CharField(max_length=255, null=True, blank=True)),
                ('stories', models.JSONField(default=dict, null=True, blank=True)),
                ('selected_story', models.JSONField(default=dict, null=True, blank=True)),
                ('scenes', models.JSONField(default=dict, null=True, blank=True)),
                ('shots', models.JSONField(default=dict, null=True, blank=True)),
                ('storyboards', models.JSONField(default=dict, null=True, blank=True)),
                ('is_completed', models.BooleanField(default=False)),
                ('current_step', models.IntegerField(null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'videoplanning_from_spec',
                'verbose_name': 'VideoPlanning (API 스펙)',
                'verbose_name_plural': 'VideoPlannings (API 스펙)',
                'ordering': ['-id'],
            },
        ),
    ]

# Generated migration for VideoAnalysisResultFromSpec
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    
    operations = [
        migrations.CreateModel(
            name='VideoAnalysisResultFromSpec',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('video_id', models.CharField(max_length=255, null=True, blank=True)),
                ('analysis_status', models.CharField(max_length=255, null=True, blank=True)),
                ('twelve_labs_video_id', models.CharField(max_length=255, null=True, blank=True)),
                ('index_id', models.CharField(max_length=255, null=True, blank=True)),
                ('analysis_data', models.JSONField(default=dict, null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'videoanalysisresult_from_spec',
                'verbose_name': 'VideoAnalysisResult (API 스펙)',
                'verbose_name_plural': 'VideoAnalysisResults (API 스펙)',
                'ordering': ['-id'],
            },
        ),
    ]

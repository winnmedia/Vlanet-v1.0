# Enhanced migration for VideoPlanningEnhanced
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    
    operations = [
        migrations.CreateModel(
            name='VideoPlanningEnhanced',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, null=True, blank=True)),
                ('description', models.TextField(null=True, blank=True)),
                ('status', models.CharField(max_length=50, null=True, blank=True, help_text='status 상태')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'videoplanning_enhanced',
                'verbose_name': 'VideoPlanning (Enhanced)',
                'verbose_name_plural': 'VideoPlannings (Enhanced)',
                'ordering': ['-id'],
            },
        ),
        migrations.AddIndex(
            model_name='videoplanningenhanced',
            index=models.Index(fields=['status'], name='videoplanning_status_idx'),
        ),
        migrations.AddIndex(
            model_name='videoplanningenhanced',
            index=models.Index(fields=['created_at'], name='videoplanning_created_at_idx'),
        ),
    ]

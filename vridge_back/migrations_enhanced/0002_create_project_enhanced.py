# Enhanced migration for ProjectEnhanced
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    
    operations = [
        migrations.CreateModel(
            name='ProjectEnhanced',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, null=True, blank=True)),
                ('description', models.TextField(null=True, blank=True)),
                ('manager', models.CharField(max_length=255, null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'project_enhanced',
                'verbose_name': 'Project (Enhanced)',
                'verbose_name_plural': 'Projects (Enhanced)',
                'ordering': ['-id'],
            },
        ),
        migrations.AddIndex(
            model_name='projectenhanced',
            index=models.Index(fields=['created_at'], name='project_created_at_idx'),
        ),
    ]

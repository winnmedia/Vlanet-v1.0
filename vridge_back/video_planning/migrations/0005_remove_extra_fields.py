# Generated manually to fix Railway deployment issues

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('video_planning', '0004_videoplanningprotemplate_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='videoplanning',
            name='ai_generation_config',
        ),
        migrations.RemoveField(
            model_name='videoplanning',
            name='audio_config',
        ),
        migrations.RemoveField(
            model_name='videoplanning',
            name='camera_settings',
        ),
        migrations.RemoveField(
            model_name='videoplanning',
            name='collaboration_settings',
        ),
        migrations.RemoveField(
            model_name='videoplanning',
            name='color_tone',
        ),
        migrations.RemoveField(
            model_name='videoplanning',
            name='lighting_setup',
        ),
        migrations.RemoveField(
            model_name='videoplanning',
            name='prompt_templates',
        ),
        migrations.RemoveField(
            model_name='videoplanning',
            name='workflow_config',
        ),
    ]
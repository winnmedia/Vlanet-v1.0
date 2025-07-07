from django.db import models

class Video-Planning(models.Model):
    id = models.IntegerField()
    title = models.CharField(max_length=255)
    description = models.CharField(max_length=255)
    is_active = models.BooleanField()
    view_count = models.IntegerField()
    rating = models.FloatField()
    tags = models.JSONField()
    metadata = models.JSONField()
    created_at = models.CharField(max_length=255)
    def __str__(self): return str(self.pk)

class Project(models.Model):
    id = models.IntegerField()
    name = models.CharField(max_length=255)
    manager = models.CharField(max_length=255)
    is_public = models.BooleanField()
    budget = models.IntegerField()
    completion_rate = models.FloatField()
    team_members = models.JSONField()
    settings = models.JSONField()
    def __str__(self): return str(self.pk)

class Feedback(models.Model):
    id = models.IntegerField()
    title = models.CharField(max_length=255)
    content = models.CharField(max_length=255)
    is_resolved = models.BooleanField()
    priority = models.IntegerField()
    score = models.FloatField()
    attachments = models.JSONField()
    reviewer_data = models.JSONField()
    def __str__(self): return str(self.pk)
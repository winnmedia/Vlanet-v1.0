#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from projects.models import Project
from feedbacks.models import FeedBack
from users.models import User

# Check current state
print("=== Checking Database State ===")
print(f"Users: {User.objects.count()}")
print(f"Projects: {Project.objects.count()}")
print(f"Feedbacks: {FeedBack.objects.count()}")

# Create test data if needed
if Project.objects.count() == 0:
    print("\n=== Creating Test Data ===")
    # Get or create test user
    user, created = User.objects.get_or_create(
        username="test@example.com",
        defaults={
            "nickname": "Test User",
            "email": "test@example.com"
        }
    )
    print(f"User: {user.username} (created: {created})")
    
    # Create test project
    project = Project.objects.create(
        name="Test Project",
        user=user,
        manager="Test Manager",
        consumer="Test Consumer",
        description="Test Description"
    )
    print(f"Created project: {project.name} (ID: {project.id})")
    
    # Create feedback for project
    feedback = FeedBack.objects.create()
    project.feedback = feedback
    project.save()
    print(f"Created feedback: {feedback.id}")
else:
    # Check existing projects
    print("\n=== Existing Projects ===")
    for project in Project.objects.all()[:5]:
        print(f"Project {project.id}: {project.name}")
        print(f"  Owner: {project.user.username}")
        print(f"  Has feedback: {hasattr(project, 'feedback') and project.feedback is not None}")
        if hasattr(project, 'feedback') and project.feedback:
            print(f"  Feedback ID: {project.feedback.id}")
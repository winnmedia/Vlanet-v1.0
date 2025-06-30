#!/usr/bin/env python3
import os
import sys
import json
import requests
from datetime import date, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'vridge_back'))
import django
django.setup()

from projects.models import Project
from users.models import User

print("=" * 60)
print("PROJECT SYSTEM TEST")
print("=" * 60)

# Check project count
project_count = Project.objects.count()
print(f"\n✓ Total projects in database: {project_count}")

# Check users
user_count = User.objects.count()
print(f"✓ Total users in database: {user_count}")

# Test login
print("\n" + "=" * 30)
print("TESTING LOGIN")
print("=" * 30)

login_data = {"email": "test@example.com", "password": "test1234"}
response = requests.post("http://localhost:8000/users/login", json=login_data)

if response.status_code == 201:
    print("✓ Login successful")
    token = response.json().get('vridge_session')
    print(f"✓ Token received: {token[:20]}...")
    
    # Test project list
    print("\n" + "=" * 30)
    print("TESTING PROJECT LIST")
    print("=" * 30)
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get("http://localhost:8000/projects/project_list", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Project list retrieved successfully")
        print(f"✓ Projects count: {len(data.get('result', []))}")
        print(f"✓ User: {data.get('user')}")
    else:
        print(f"✗ Project list failed: {response.status_code}")
        print(f"Response: {response.text}")
    
    # Test project creation
    print("\n" + "=" * 30)
    print("TESTING PROJECT CREATION")
    print("=" * 30)
    
    today = date.today()
    project_data = {
        "inputs": json.dumps({
            "name": "Test Project",
            "manager": "Test Manager",
            "consumer": "Test Consumer",
            "description": "Test Description"
        }),
        "process": json.dumps([
            {
                "text": "기초 기획안 작성",
                "startDate": str(today),
                "endDate": str(today + timedelta(days=7)),
                "key": "basic_plan"
            },
            {
                "text": "스토리보드 작성",
                "startDate": str(today + timedelta(days=8)),
                "endDate": str(today + timedelta(days=14)),
                "key": "story_board"
            },
            {
                "text": "촬영(계획/진행)",
                "startDate": str(today + timedelta(days=15)),
                "endDate": str(today + timedelta(days=21)),
                "key": "filming"
            },
            {
                "text": "비디오 편집",
                "startDate": str(today + timedelta(days=22)),
                "endDate": str(today + timedelta(days=28)),
                "key": "video_edit"
            },
            {
                "text": "후반 작업",
                "startDate": str(today + timedelta(days=29)),
                "endDate": str(today + timedelta(days=35)),
                "key": "post_work"
            },
            {
                "text": "비디오 시사(피드백)",
                "startDate": str(today + timedelta(days=36)),
                "endDate": str(today + timedelta(days=42)),
                "key": "video_preview"
            },
            {
                "text": "최종 컨펌",
                "startDate": str(today + timedelta(days=43)),
                "endDate": str(today + timedelta(days=49)),
                "key": "confirmation"
            },
            {
                "text": "영상 납품",
                "startDate": str(today + timedelta(days=50)),
                "endDate": str(today + timedelta(days=56)),
                "key": "video_delivery"
            }
        ])
    }
    
    # Note: Using regular form data, not multipart
    response = requests.post(
        "http://localhost:8000/projects/create", 
        data=project_data,
        headers=headers
    )
    
    if response.status_code in [200, 201]:
        print("✓ Project created successfully!")
        result = response.json()
        print(f"✓ Project ID: {result.get('id')}")
    else:
        print(f"✗ Project creation failed: {response.status_code}")
        print(f"Response: {response.text}")
        
else:
    print(f"✗ Login failed: {response.status_code}")
    print(f"Response: {response.text}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.http import JsonResponse
from django.db.models import Count
from projects.models import Project
from users.models import User
from feedbacks.models import FeedBackComment
from projects.models import SampleFiles


@staff_member_required
def dashboard_stats(request):
    """관리자 대시보드 통계 API"""
    stats = {
        'projects': Project.objects.count(),
        'users': User.objects.filter(is_active=True).count(),
        'feedbacks': FeedBackComment.objects.count(),
        'files': SampleFiles.objects.count()
    }
    return JsonResponse(stats)


@staff_member_required
def admin_dashboard(request):
    """관리자 대시보드 페이지"""
    context = {
        'title': 'Vlanet 관리 대시보드',
    }
    return render(request, 'admin/dashboard.html', context)
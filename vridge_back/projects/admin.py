from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
import datetime
from . import models


class MembersInline(admin.TabularInline):
    model = models.Members
    verbose_name = "멤버"
    verbose_name_plural = "멤버"


class FileInline(admin.TabularInline):
    model = models.File
    verbose_name = "프로젝트 파일"
    verbose_name_plural = "프로젝트 파일"


@admin.register(models.Memo)
class MemoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "memo",
        "created",
    )

    list_display_links = list_display


@admin.register(models.Project)
class ProjectAdmin(admin.ModelAdmin):
    inlines = (
        MembersInline,
        FileInline,
    )

    list_display = (
        "id",
        "get_colored_name",
        "manager",
        "consumer",
        "get_progress",
        "get_members_count",
        "get_status",
        "created",
    )

    list_display_links = ("id", "get_colored_name")

    search_fields = ("name",)
    search_help_text = "프로젝트 이름"

    list_select_related = [
        "user",
        "basic_plan",
        "story_board",
        "filming",
        "video_edit",
        "post_work",
        "video_preview",
        "confirmation",
        "video_delivery",
        "feedback",
    ]

    autocomplete_fields = ("user",)
    
    def get_colored_name(self, obj):
        return format_html(
            '<span style="border-left: 4px solid {}; padding-left: 8px;">{}</span>',
            obj.color or '#0059db',
            obj.name
        )
    get_colored_name.short_description = '프로젝트명'
    get_colored_name.admin_order_field = 'name'
    
    def get_progress(self, obj):
        phases = [
            obj.basic_plan, obj.story_board, obj.filming, obj.video_edit,
            obj.post_work, obj.video_preview, obj.confirmation, obj.video_delivery
        ]
        completed = sum(1 for phase in phases if phase and phase.end_date and phase.end_date < datetime.date.today())
        total = len(phases)
        percentage = (completed / total) * 100
        
        color = '#27ae60' if percentage == 100 else '#f39c12' if percentage > 50 else '#e74c3c'
        return format_html(
            '<div style="width: 100px; background: #ddd; border-radius: 10px; overflow: hidden;">' +
            '<div style="width: {}%; background: {}; height: 20px; text-align: center; color: white; font-size: 12px; line-height: 20px;">' +
            '{}%</div></div>',
            percentage, color, int(percentage)
        )
    get_progress.short_description = '진행률'
    
    def get_members_count(self, obj):
        count = obj.members.count() + 1  # +1 for owner
        return format_html('<span style="font-weight: bold;">{}명</span>', count)
    get_members_count.short_description = '참여자'
    
    def get_status(self, obj):
        if obj.video_delivery and obj.video_delivery.end_date and obj.video_delivery.end_date < datetime.date.today():
            return format_html('<span style="color: #27ae60; font-weight: bold;">완료</span>')
        elif obj.end_date and obj.end_date < datetime.date.today():
            return format_html('<span style="color: #e74c3c; font-weight: bold;">지연</span>')
        else:
            return format_html('<span style="color: #3498db; font-weight: bold;">진행중</span>')
    get_status.short_description = '상태'


# @admin.register(
#     models.BasicPlan,
#     models.Storyboard,
#     models.Filming,
#     models.VideoEdit,
#     models.PostWork,
#     models.VideoPreview,
#     models.Confirmation,
#     models.VideoDelivery,
# )
# class AbstractAdmin(admin.ModelAdmin):
#     list_display = (
#         "id",
#         "start_date",
#         "end_date",
#         "created",
#     )


@admin.register(models.ProjectInvite)
class ProjectInviteAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "__str__",
        "created",
    )
    list_display_links = list_display


@admin.register(models.SampleFiles)
class SampleFilesAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "created",
    )
    list_display_links = list_display

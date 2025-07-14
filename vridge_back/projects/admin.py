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
        today = datetime.date.today()
        completed = sum(1 for phase in phases if phase and phase.end_date and 
                       (phase.end_date.date() if hasattr(phase.end_date, 'date') else phase.end_date) < today)
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
        # 비디오 배송이 완료된 경우
        if obj.video_delivery and hasattr(obj.video_delivery, 'end_date'):
            if obj.video_delivery.end_date:
                today = datetime.date.today()
                end_date = obj.video_delivery.end_date
                if hasattr(end_date, 'date'):
                    end_date = end_date.date()
                if end_date < today:
                    return format_html('<span style="color: #27ae60; font-weight: bold;">완료</span>')
        
        # 진행 상태 확인
        phases = [
            obj.basic_plan, obj.story_board, obj.filming, obj.video_edit,
            obj.post_work, obj.video_preview, obj.confirmation, obj.video_delivery
        ]
        active_phases = [p for p in phases if p is not None]
        
        if len(active_phases) == 0:
            return format_html('<span style="color: #95a5a6; font-weight: bold;">대기</span>')
        elif len(active_phases) == len(phases):
            return format_html('<span style="color: #27ae60; font-weight: bold;">완료</span>')
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


@admin.register(models.DevelopmentFramework)
class DevelopmentFrameworkAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "get_is_default",
        "user",
        "created",
        "updated",
    )
    list_display_links = ("id", "name")
    list_filter = ("is_default", "created", "updated")
    search_fields = ("name", "user__username", "user__email")
    readonly_fields = ("created", "updated")
    autocomplete_fields = ("user",)
    
    fieldsets = (
        ("기본 정보", {
            "fields": ("name", "user", "is_default")
        }),
        ("프레임워크 내용", {
            "fields": ("intro_hook", "immersion", "twist", "hook_next"),
            "classes": ("wide",)
        }),
        ("생성/수정 정보", {
            "fields": ("created", "updated"),
            "classes": ("collapse",)
        }),
    )
    
    def get_is_default(self, obj):
        if obj.is_default:
            return format_html('<span style="color: #27ae60; font-weight: bold;">✓ 기본값</span>')
        return format_html('<span style="color: #95a5a6;">-</span>')
    get_is_default.short_description = '기본값'
    get_is_default.admin_order_field = 'is_default'

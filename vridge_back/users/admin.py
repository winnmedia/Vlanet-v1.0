from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.db.models import Count
from . import models
from projects.models import Project


@admin.register(models.User)
class UserAdmin(UserAdmin):
    list_display = (
        "id",
        "username",
        "nickname",
        "login_method",
        "get_status",
        "get_project_count",
        "date_joined",
    )

    list_display_links = (
        "id",
        "nickname",
        "date_joined",
    )

    list_filter = (
        "is_staff",
        "is_active",
        "is_superuser",
    )

    search_fields = (
        "id",
        "username",
    )

    search_help_text = "id or email"

    fieldsets = (
        (
            "인증정보",
            {
                "fields": UserAdmin.fieldsets[0][1]["fields"]
                + (
                    "login_method",
                    "email_secret",
                ),
            },
        ),
        (
            "프로필",
            {
                "fields": ("nickname",),
            },
        ),
        (
            "활동정보",
            {
                "fields": (
                    "date_joined",
                    "last_login",
                ),
            },
        ),
        (
            "권한",
            {
                "classes": ("collapse",),
                "fields": (
                    "is_staff",
                    "is_active",
                    "is_superuser",
                ),
            },
        ),
    )

    readonly_fields = ["date_joined", "last_login"]
    ordering = ("-date_joined",)

    def get_form(self, request, obj=None, **kwargs):
        form = super(UserAdmin, self).get_form(request, obj, **kwargs)
        form.base_fields["username"].label = "ID"
        return form
    
    def get_status(self, obj):
        if obj.is_superuser:
            return format_html('<span style="color: #ff4545; font-weight: bold;">시스템 관리자</span>')
        elif obj.is_staff:
            return format_html('<span style="color: #0059db; font-weight: bold;">스태프</span>')
        elif obj.is_active:
            return format_html('<span style="color: #27ae60;">활성</span>')
        else:
            return format_html('<span style="color: #e74c3c;">비활성</span>')
    get_status.short_description = '상태'
    
    def get_project_count(self, obj):
        owned = obj.projects.count()
        # Members 모델을 통해 참여 중인 프로젝트 수 확인
        from projects.models import Members
        member = Members.objects.filter(user=obj).count()
        total = owned + member
        return format_html(
            '<span style="color: #0059db; font-weight: bold;">{}</span> <small>(소유: {}, 참여: {})</small>',
            total, owned, member
        )
    get_project_count.short_description = '프로젝트'


@admin.register(models.EmailVerify)
class EmailVerifyAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "__str__",
        "updated",
        "created",
    )

    list_display_links = list_display


@admin.register(models.UserMemo)
class UserMemoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "__str__",
        "updated",
        "created",
    )

    list_display_links = list_display


@admin.register(models.UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "company",
        "position",
        "phone",
        "has_profile_image",
        "updated",
    )
    
    list_display_links = ("id", "user")
    
    search_fields = ("user__username", "user__nickname", "company", "position")
    
    list_filter = ("company", "position", "updated")
    
    def has_profile_image(self, obj):
        return format_html(
            '<span style="color: {};">{}</span>',
            "#27ae60" if obj.profile_image else "#e74c3c",
            "✓" if obj.profile_image else "✗"
        )
    has_profile_image.short_description = "프로필 이미지"
    
    fieldsets = (
        ("사용자", {
            "fields": ("user",)
        }),
        ("프로필 정보", {
            "fields": ("profile_image", "bio", "phone", "company", "position")
        }),
        ("시간 정보", {
            "fields": ("created", "updated"),
            "classes": ("collapse",)
        }),
    )
    
    readonly_fields = ("created", "updated")

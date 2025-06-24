from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from . import models


@admin.register(models.User)
class UserAdmin(UserAdmin):
    list_display = (
        "id",
        "username",
        "nickname",
        "login_method",
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

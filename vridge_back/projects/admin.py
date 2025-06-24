from django.contrib import admin
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
        "name",
        "manager",
        "consumer",
        "created",
    )

    list_display_links = list_display

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

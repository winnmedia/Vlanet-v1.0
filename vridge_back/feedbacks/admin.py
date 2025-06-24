from django.contrib import admin
from . import models


# @admin.register(models.FeedBack)
# class FeedbackAdmin(admin.ModelAdmin):
#     list_display = (
#         "id",
#         "created",
#     )

#     list_display_links = list_display

#     search_fields = ("id",)


@admin.register(models.FeedBackComment)
class FeedBackCommentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "__str__",
        "security",
        "title",
        "section",
        "text",
        "created",
    )

    list_display_links = list_display

    autocomplete_fields = (
        # "feedback",
        "user",
    )

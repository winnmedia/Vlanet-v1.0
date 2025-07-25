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
        "is_important",
        "title",
        "section",
        "text",
        "parent",
        "created",
    )

    list_display_links = ("id", "__str__")
    list_filter = ("is_important", "security", "display_mode", "created")
    search_fields = ("title", "text", "user__username", "user__nickname")

    autocomplete_fields = (
        # "feedback",
        "user",
        "parent",
    )


@admin.register(models.FeedbackReaction)
class FeedbackReactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "comment",
        "reaction",
        "created",
    )
    
    list_display_links = ("id", "user")
    list_filter = ("reaction", "created")
    search_fields = ("user__username", "user__nickname", "comment__text")
    
    autocomplete_fields = (
        "user",
        "comment",
    )

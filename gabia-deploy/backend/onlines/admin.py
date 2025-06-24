from django.contrib import admin
from . import models


@admin.register(models.OnlineVideo)
class OnlineAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "link",
        "created",
    )

    list_display_links = list_display

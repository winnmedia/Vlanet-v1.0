from django.contrib import admin
from .models import VideoPlanning, VideoPlanningImage


class VideoPlanningImageInline(admin.TabularInline):
    model = VideoPlanningImage
    extra = 0
    fields = ['frame_number', 'image_url', 'created_at']
    readonly_fields = ['created_at']


@admin.register(VideoPlanning)
class VideoPlanningAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'is_completed', 'current_step', 'created_at']
    list_filter = ['is_completed', 'current_step', 'created_at']
    search_fields = ['title', 'planning_text', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [VideoPlanningImageInline]
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'title', 'planning_text', 'is_completed', 'current_step')
        }),
        ('생성된 데이터', {
            'fields': ('stories', 'selected_story', 'scenes', 'selected_scene', 
                      'shots', 'selected_shot', 'storyboards'),
            'classes': ('collapse',)
        }),
        ('메타데이터', {
            'fields': ('created_at', 'updated_at')
        })
    )


@admin.register(VideoPlanningImage)
class VideoPlanningImageAdmin(admin.ModelAdmin):
    list_display = ['planning', 'frame_number', 'created_at']
    list_filter = ['created_at']
    search_fields = ['planning__title']
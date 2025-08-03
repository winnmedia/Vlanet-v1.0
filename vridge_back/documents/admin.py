from django.contrib import admin
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['filename', 'project', 'category', 'uploader', 'size', 'uploaded_at', 'is_active']
    list_filter = ['category', 'is_active', 'uploaded_at']
    search_fields = ['filename', 'description', 'project__name', 'uploader__username']
    readonly_fields = ['size', 'mime_type', 'download_count', 'uploaded_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('project', 'filename', 'file', 'category')
        }),
        ('상세 정보', {
            'fields': ('description', 'uploader', 'size', 'mime_type')
        }),
        ('통계', {
            'fields': ('download_count', 'is_active')
        }),
        ('타임스탬프', {
            'fields': ('uploaded_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
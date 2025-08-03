from django.db import models
from django.contrib.auth import get_user_model
from projects.models import Project
import os

User = get_user_model()

class Document(models.Model):
    """프로젝트 문서 모델"""
    
    CATEGORY_CHOICES = [
        ('contract', '계약서'),
        ('planning', '기획서'),
        ('script', '대본'),
        ('storyboard', '스토리보드'),
        ('report', '보고서'),
        ('reference', '참고자료'),
        ('other', '기타'),
    ]
    
    project = models.ForeignKey(
        Project, 
        on_delete=models.CASCADE, 
        related_name='documents',
        verbose_name='프로젝트'
    )
    
    uploader = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        verbose_name='업로더'
    )
    
    filename = models.CharField(
        max_length=255,
        verbose_name='파일명'
    )
    
    file = models.FileField(
        upload_to='documents/%Y/%m/%d/',
        verbose_name='파일'
    )
    
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='other',
        verbose_name='카테고리'
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='설명'
    )
    
    size = models.BigIntegerField(
        default=0,
        verbose_name='파일 크기'
    )
    
    mime_type = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='MIME 타입'
    )
    
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='업로드 일시'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='수정 일시'
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name='활성 상태'
    )
    
    download_count = models.IntegerField(
        default=0,
        verbose_name='다운로드 횟수'
    )
    
    class Meta:
        verbose_name = '문서'
        verbose_name_plural = '문서'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['project', 'category']),
            models.Index(fields=['uploaded_at']),
        ]
    
    def __str__(self):
        return f"{self.project.name} - {self.filename}"
    
    def save(self, *args, **kwargs):
        # 파일 크기 자동 설정
        if self.file and not self.size:
            self.size = self.file.size
        
        # MIME 타입 자동 설정
        if self.file and not self.mime_type:
            import mimetypes
            self.mime_type = mimetypes.guess_type(self.file.name)[0] or 'application/octet-stream'
        
        super().save(*args, **kwargs)
    
    def get_file_extension(self):
        """파일 확장자 반환"""
        return os.path.splitext(self.filename)[1].lower()
    
    def is_image(self):
        """이미지 파일인지 확인"""
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg']
        return self.get_file_extension() in image_extensions
    
    def is_pdf(self):
        """PDF 파일인지 확인"""
        return self.get_file_extension() == '.pdf'
    
    def increment_download_count(self):
        """다운로드 횟수 증가"""
        self.download_count += 1
        self.save(update_fields=['download_count'])
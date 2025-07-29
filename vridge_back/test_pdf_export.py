#!/usr/bin/env python3
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from video_planning.models import VideoPlanning
from video_planning.serializers import VideoPlanningSerializer
from video_planning.pdf_export_service import PDFExportService
from django.contrib.auth import get_user_model

User = get_user_model()

def test_pdf_export():
    """PDF 내보내기 테스트"""
    
    # 사용 가능한 기획 확인
    plannings = VideoPlanning.objects.all()
    print(f"Total VideoPlanning records: {plannings.count()}")
    
    for planning in plannings:
        print(f"ID: {planning.id}, Title: {planning.title}, User: {planning.user}")
    
    # 첫 번째 기획으로 테스트
    if plannings.exists():
        planning = plannings.first()
        print(f"\nTesting with planning ID: {planning.id}")
        
        # 직렬화
        serializer = VideoPlanningSerializer(planning)
        planning_data = serializer.data
        
        print(f"Serialized data keys: {list(planning_data.keys())}")
        print(f"Title: {planning_data.get('title')}")
        print(f"Planning options: {planning_data.get('planning_options')}")
        
        # PDF 생성 테스트
        try:
            pdf_service = PDFExportService()
            pdf_buffer = pdf_service.generate_pdf(planning_data)
            
            if pdf_buffer:
                print(f"PDF generated successfully. Buffer size: {len(pdf_buffer.getvalue())} bytes")
                
                # 파일로 저장 (테스트용)
                with open('test_output.pdf', 'wb') as f:
                    f.write(pdf_buffer.getvalue())
                print("PDF saved as test_output.pdf")
            else:
                print("PDF buffer is empty")
                
        except Exception as e:
            print(f"Error generating PDF: {str(e)}")
            import traceback
            traceback.print_exc()
    else:
        print("No VideoPlanning records found")

if __name__ == "__main__":
    test_pdf_export()
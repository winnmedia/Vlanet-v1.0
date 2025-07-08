"""
기획안 내보내기 관련 시리얼라이저
"""

from rest_framework import serializers


class ProposalExportSerializer(serializers.Serializer):
    """기획안 내보내기 요청 시리얼라이저"""
    
    planning_text = serializers.CharField(
        max_length=10000,
        help_text="자유 형식의 기획안 텍스트 (최대 10,000자)"
    )
    
    # 선택적 메타데이터
    title = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        help_text="기획안 제목 (선택사항)"
    )
    
    project_type = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        help_text="프로젝트 유형 (선택사항)"
    )
    
    export_format = serializers.ChoiceField(
        choices=[
            ('google_slides', 'Google Slides'),
            ('json', 'JSON 데이터만'),
            ('both', '둘 다')
        ],
        default='google_slides',
        help_text="내보내기 형식"
    )
    
    def validate_planning_text(self, value):
        """기획안 텍스트 검증"""
        if not value or not value.strip():
            raise serializers.ValidationError("기획안 텍스트를 입력해주세요.")
        
        if len(value.strip()) < 50:
            raise serializers.ValidationError("기획안 텍스트가 너무 짧습니다. 최소 50자 이상 입력해주세요.")
        
        return value.strip()


class ProposalExportResponseSerializer(serializers.Serializer):
    """기획안 내보내기 응답 시리얼라이저"""
    
    success = serializers.BooleanField()
    message = serializers.CharField(max_length=500)
    
    # 성공 시 데이터
    structured_data = serializers.JSONField(required=False)
    presentation = serializers.JSONField(required=False)
    
    # 오류 시 데이터
    error = serializers.CharField(max_length=500, required=False)
    step = serializers.CharField(max_length=50, required=False)
    details = serializers.JSONField(required=False)


class ProposalStructurePreviewSerializer(serializers.Serializer):
    """기획안 구조 미리보기 시리얼라이저"""
    
    planning_text = serializers.CharField(
        max_length=10000,
        help_text="구조화할 기획안 텍스트"
    )
    
    preview_only = serializers.BooleanField(
        default=True,
        help_text="미리보기만 생성 (Google Slides 생성 안함)"
    )


class SlideContentSerializer(serializers.Serializer):
    """슬라이드 콘텐츠 시리얼라이저"""
    
    title_text = serializers.CharField(max_length=100, required=False)
    subtitle_text = serializers.CharField(max_length=200, required=False)
    bullet_points = serializers.ListField(
        child=serializers.CharField(max_length=200),
        required=False
    )
    left_column = serializers.ListField(
        child=serializers.CharField(max_length=200),
        required=False
    )
    right_column = serializers.ListField(
        child=serializers.CharField(max_length=200),
        required=False
    )
    budget_breakdown = serializers.ListField(
        child=serializers.CharField(max_length=200),
        required=False
    )
    timeline = serializers.ListField(
        child=serializers.CharField(max_length=200),
        required=False
    )


class SlideInfoSerializer(serializers.Serializer):
    """슬라이드 정보 시리얼라이저"""
    
    slide_number = serializers.IntegerField()
    layout = serializers.ChoiceField(choices=[
        ('TITLE', 'Title'),
        ('TITLE_AND_BODY', 'Title and Body'),
        ('TITLE_AND_TWO_COLUMNS', 'Title and Two Columns'),
        ('CAPTION_ONLY', 'Caption Only')
    ])
    title = serializers.CharField(max_length=100)
    content = SlideContentSerializer()


class ProposalMetadataSerializer(serializers.Serializer):
    """기획안 메타데이터 시리얼라이저"""
    
    title = serializers.CharField(max_length=100)
    subtitle = serializers.CharField(max_length=200, required=False)
    project_type = serializers.CharField(max_length=50)
    target_audience = serializers.CharField(max_length=100)
    duration = serializers.CharField(max_length=50)
    budget_range = serializers.CharField(max_length=100, required=False)
    deadline = serializers.CharField(max_length=100, required=False)


class StructuredProposalSerializer(serializers.Serializer):
    """구조화된 기획안 시리얼라이저"""
    
    metadata = ProposalMetadataSerializer()
    slides = serializers.ListField(child=SlideInfoSerializer())
    
    def validate_slides(self, value):
        """슬라이드 개수 검증"""
        if len(value) < 3:
            raise serializers.ValidationError("최소 3개 이상의 슬라이드가 필요합니다.")
        
        if len(value) > 15:
            raise serializers.ValidationError("슬라이드는 최대 15개까지 가능합니다.")
        
        return value
from rest_framework import serializers
from .models import VideoPlanning, VideoPlanningImage


class VideoPlanningImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoPlanningImage
        fields = ['id', 'frame_number', 'image_url', 'prompt_used', 'created_at']


class VideoPlanningListSerializer(serializers.ModelSerializer):
    """목록 조회용 간략한 시리얼라이저"""
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = VideoPlanning
        fields = [
            'id', 'title', 'username', 'is_completed', 
            'current_step', 'created_at', 'updated_at'
        ]
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # 프론트엔드 호환성을 위해 plannings 배열로 래핑
        return data


class VideoPlanningSerializer(serializers.ModelSerializer):
    """상세 조회 및 생성/수정용 시리얼라이저"""
    username = serializers.CharField(source='user.username', read_only=True)
    images = VideoPlanningImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = VideoPlanning
        fields = [
            'id', 'title', 'username', 'planning_text',
            'stories', 'selected_story', 
            'scenes', 'selected_scene',
            'shots', 'selected_shot',
            'storyboards', 'images',
            'planning_options',
            'is_completed', 'current_step',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'username', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['user'] = request.user
        else:
            # 인증되지 않은 경우 None으로 설정 (모델에서 null=True여야 함)
            validated_data['user'] = None
        return super().create(validated_data)
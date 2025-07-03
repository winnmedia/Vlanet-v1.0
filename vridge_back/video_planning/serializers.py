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
            'is_completed', 'current_step',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'username', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
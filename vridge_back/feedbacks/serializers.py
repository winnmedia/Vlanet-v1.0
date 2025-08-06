from rest_framework import serializers
from .models import FeedBack, FeedBackMessage, FeedBackComment, FeedbackReaction, FeedbackFile


class FeedbackFileSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    
    class Meta:
        model = FeedbackFile
        fields = [
            'id', 'file', 'filename', 'file_type', 'file_size',
            'uploaded_by', 'uploaded_by_name', 'created', 'updated'
        ]
        read_only_fields = ['uploaded_by', 'created', 'updated']
    
    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)


class FeedbackReactionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = FeedbackReaction
        fields = ['id', 'user', 'user_name', 'reaction_type', 'created']
        read_only_fields = ['user', 'created']


class FeedBackCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = FeedBackComment
        fields = [
            'id', 'feedback', 'user', 'user_name', 'display_name',
            'timestamp', 'type', 'content', 'text', 'title', 'section',
            'security', 'display_mode', 'nickname', 'created', 'updated'
        ]
        read_only_fields = ['user', 'created', 'updated']
    
    def get_display_name(self, obj):
        if obj.display_mode == 'anonymous' or obj.security:
            return '익명'
        elif obj.display_mode == 'nickname' and obj.nickname:
            return obj.nickname
        else:
            return obj.user.username if obj.user else '알 수 없음'
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class FeedBackMessageSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    reactions = FeedbackReactionSerializer(many=True, read_only=True)
    reaction_counts = serializers.SerializerMethodField()
    
    class Meta:
        model = FeedBackMessage
        fields = [
            'id', 'feedback', 'user', 'user_name', 'text', 'status',
            'reactions', 'reaction_counts', 'created', 'updated'
        ]
        read_only_fields = ['user', 'created', 'updated']
    
    def get_reaction_counts(self, obj):
        counts = {}
        for reaction in obj.reactions.all():
            if reaction.reaction_type not in counts:
                counts[reaction.reaction_type] = 0
            counts[reaction.reaction_type] += 1
        return counts
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class FeedBackSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    messages_count = serializers.IntegerField(source='messages.count', read_only=True)
    comments_count = serializers.IntegerField(source='comments.count', read_only=True)
    video_url = serializers.SerializerMethodField()
    hls_url = serializers.CharField(source='hls_playlist_url', read_only=True)
    
    class Meta:
        model = FeedBack
        fields = [
            'id', 'project', 'project_name', 'user', 'user_name',
            'title', 'description', 'status',
            'files', 'video_file', 'video_url', 'hls_url',
            'video_file_web', 'video_file_high', 'video_file_medium', 'video_file_low',
            'thumbnail', 'encoding_status', 
            'duration', 'width', 'height', 'file_size',
            'messages_count', 'comments_count',
            'created', 'updated'
        ]
        read_only_fields = ['user', 'created', 'updated', 'encoding_status']
    
    def get_video_url(self, obj):
        request = self.context.get('request')
        if obj.files and request:
            return request.build_absolute_uri(obj.files.url)
        return None
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class FeedBackDetailSerializer(FeedBackSerializer):
    messages = FeedBackMessageSerializer(many=True, read_only=True)
    comments = FeedBackCommentSerializer(many=True, read_only=True)
    attached_files = FeedbackFileSerializer(many=True, read_only=True)
    
    class Meta(FeedBackSerializer.Meta):
        fields = FeedBackSerializer.Meta.fields + ['messages', 'comments', 'attached_files']


class FeedBackCreateSerializer(serializers.ModelSerializer):
    video_file = serializers.FileField(required=False, write_only=True)
    
    class Meta:
        model = FeedBack
        fields = ['title', 'description', 'video_file', 'project']
    
    def create(self, validated_data):
        video_file = validated_data.pop('video_file', None)
        validated_data['user'] = self.context['request'].user
        
        feedback = FeedBack.objects.create(**validated_data)
        
        if video_file:
            feedback.files = video_file
            feedback.file_size = video_file.size
            feedback.save()
        
        return feedback
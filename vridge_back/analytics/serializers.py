from rest_framework import serializers
from .models import *

class UserSessionSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    duration_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = UserSession
        fields = [
            'session_id', 'user_email', 'start_time', 'end_time', 
            'duration', 'duration_minutes', 'completion_rate', 'final_step',
            'page_url', 'ip_address'
        ]
    
    def get_duration_minutes(self, obj):
        if obj.duration:
            return round(obj.duration / 1000 / 60, 2)
        return 0

class UserEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserEvent
        fields = ['event_id', 'event_type', 'timestamp', 'data']

class FormInteractionSerializer(serializers.ModelSerializer):
    average_time_per_focus = serializers.SerializerMethodField()
    
    class Meta:
        model = FormInteraction
        fields = [
            'field_name', 'focus_count', 'change_count', 'clear_count',
            'total_time', 'max_length', 'abandonment_rate', 'average_time_per_focus'
        ]
    
    def get_average_time_per_focus(self, obj):
        if obj.focus_count > 0:
            return round(obj.total_time / obj.focus_count / 1000, 2)
        return 0

class ClickHeatmapSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClickHeatmap
        fields = ['step', 'button_type', 'click_count']

class PerformanceMetricSerializer(serializers.ModelSerializer):
    step_duration_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = PerformanceMetric
        fields = [
            'step', 'step_duration', 'step_duration_minutes',
            'efficiency_score', 'engagement_score', 'frustration_score'
        ]
    
    def get_step_duration_minutes(self, obj):
        return round(obj.step_duration / 1000 / 60, 2)

class UserInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserInsight
        fields = [
            'insight_type', 'severity', 'message', 'action_suggestion',
            'created_at', 'resolved'
        ]

class UserFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFeedback
        fields = [
            'feedback_type', 'rating', 'message', 'created_at', 'processed'
        ]

class DailyAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyAnalytics
        fields = [
            'date', 'total_sessions', 'total_users', 'average_session_duration',
            'completion_rate', 'step_1_completion', 'step_2_completion',
            'step_3_completion', 'step_4_completion', 'total_errors',
            'most_clicked_button', 'most_edited_field'
        ]

class SessionDetailSerializer(serializers.ModelSerializer):
    """세션 상세 정보 (이벤트, 인터랙션 포함)"""
    events = UserEventSerializer(many=True, read_only=True)
    form_interactions = FormInteractionSerializer(many=True, read_only=True)
    clicks = ClickHeatmapSerializer(many=True, read_only=True)
    performance_metrics = PerformanceMetricSerializer(many=True, read_only=True)
    insights = UserInsightSerializer(many=True, read_only=True)
    feedback = UserFeedbackSerializer(many=True, read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = UserSession
        fields = [
            'session_id', 'user_email', 'start_time', 'end_time', 'duration',
            'completion_rate', 'final_step', 'page_url', 'user_agent',
            'ip_address', 'events', 'form_interactions', 'clicks',
            'performance_metrics', 'insights', 'feedback'
        ]
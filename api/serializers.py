from rest_framework import serializers
from .models import CV, JobDescription, MatchResult

class CVSerializer(serializers.ModelSerializer):
    class Meta:
        model = CV
        fields = ['id', 'name', 'file', 'processed_at']

class JobDescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobDescription
        fields = ['id', 'title', 'content', 'industry', 'technical_skills', 'created_at']

class MatchResultSerializer(serializers.ModelSerializer):
    cv = CVSerializer(read_only=True)
    job = JobDescriptionSerializer(read_only=True)
    
    class Meta:
        model = MatchResult
        fields = ['id', 'cv', 'job', 'total_score', 'industry_score', 
                 'tech_skills_score', 'description_match_score', 'matched_at']
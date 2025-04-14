from django.db import models

class CV(models.Model):
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='cvs/')
    content = models.TextField(blank=True)
    processed_at = models.DateTimeField(auto_now_add=True)

class JobDescription(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    industry = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    
    technical_skills = models.JSONField(default=dict)

class MatchResult(models.Model):
    cv = models.ForeignKey(CV, on_delete=models.CASCADE)
    job = models.ForeignKey(JobDescription, on_delete=models.CASCADE)
    total_score = models.FloatField()
    industry_score = models.FloatField()  # 10%
    tech_skills_score = models.FloatField()  # 30%
    description_match_score = models.FloatField()  # 60%
    matched_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('cv', 'job')
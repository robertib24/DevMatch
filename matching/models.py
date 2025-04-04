from django.db import models

class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class Industry(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class CV(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='cvs/')
    content = models.TextField(blank=True) 
    uploaded_at = models.DateTimeField(auto_now_add=True)
    skills = models.ManyToManyField(Skill, blank=True)
    industries = models.ManyToManyField(Industry, blank=True)
    
    def __str__(self):
        return self.title

class JobRequirement(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='jobs/', null=True, blank=True)
    description = models.TextField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    industries = models.ManyToManyField(Industry, blank=True)
    
    def __str__(self):
        return self.title

class RequiredSkill(models.Model):
    job = models.ForeignKey(JobRequirement, related_name='required_skills', on_delete=models.CASCADE)
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    weight = models.FloatField(default=0) 
    
    class Meta:
        unique_together = ('job', 'skill')
    
    def __str__(self):
        return f"{self.skill.name} ({self.weight}%)"

class MatchResult(models.Model):
    cv = models.ForeignKey(CV, on_delete=models.CASCADE)
    job = models.ForeignKey(JobRequirement, on_delete=models.CASCADE)
    overall_score = models.FloatField()
    industry_score = models.FloatField()
    skills_score = models.FloatField()
    semantic_score = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('cv', 'job')
    
    def __str__(self):
        return f"{self.cv.title} - {self.job.title}: {self.overall_score}%"
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import CV, JobDescription, MatchResult
from .serializers import CVSerializer, JobDescriptionSerializer, MatchResultSerializer
from .utils import (
    extract_text_from_docx, get_industry_score, calculate_technical_skills_score,
    calculate_description_match_score, calculate_total_match_score
)
import os

class CVViewSet(viewsets.ModelViewSet):
    queryset = CV.objects.all()
    serializer_class = CVSerializer
    
    def create(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        name = request.data.get('name', file.name)
        
        cv = CV.objects.create(name=name, file=file)
        
        file_path = cv.file.path
        content = extract_text_from_docx(file_path)
        cv.content = content
        cv.save()
        
        serializer = self.get_serializer(cv)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def find_best_job(self, request, pk=None):
        """Find the best matching job for a CV"""
        cv = self.get_object()
        
        jobs = JobDescription.objects.all()
        
        results = []
        for job in jobs:
            # Calculate scores
            industry_score = get_industry_score(cv.content, job.industry)
            tech_skills_score = calculate_technical_skills_score(cv.content, job.technical_skills)
            description_match_score = calculate_description_match_score(cv.content, job.content)
            
            # Calculate total score
            total_score = calculate_total_match_score(
                industry_score, tech_skills_score, description_match_score
            )
            
            # Save the match result
            match_result, _ = MatchResult.objects.update_or_create(
                cv=cv,
                job=job,
                defaults={
                    'industry_score': industry_score,
                    'tech_skills_score': tech_skills_score,
                    'description_match_score': description_match_score,
                    'total_score': total_score
                }
            )
            
            results.append({
                'job': JobDescriptionSerializer(job).data,
                'total_score': total_score,
                'industry_score': industry_score,
                'tech_skills_score': tech_skills_score,
                'description_match_score': description_match_score
            })
        
        # Sort by total score
        results.sort(key=lambda x: x['total_score'], reverse=True)
        
        # Return the best match
        if results:
            return Response(results[0])
        return Response({'message': 'No jobs found'}, status=status.HTTP_404_NOT_FOUND)

class JobDescriptionViewSet(viewsets.ModelViewSet):
    queryset = JobDescription.objects.all()
    serializer_class = JobDescriptionSerializer
    
    @action(detail=True, methods=['get'])
    def find_matching_cvs(self, request, pk=None):
        """Find the top 5 matching CVs for a job"""
        job = self.get_object()
        
        # Get all CVs
        cvs = CV.objects.all()
        
        # Calculate match scores for each CV
        results = []
        for cv in cvs:
            # Calculate scores
            industry_score = get_industry_score(cv.content, job.industry)
            tech_skills_score = calculate_technical_skills_score(cv.content, job.technical_skills)
            description_match_score = calculate_description_match_score(cv.content, job.content)
            
            # Calculate total score
            total_score = calculate_total_match_score(
                industry_score, tech_skills_score, description_match_score
            )
            
            # Save the match result
            match_result, _ = MatchResult.objects.update_or_create(
                cv=cv,
                job=job,
                defaults={
                    'industry_score': industry_score,
                    'tech_skills_score': tech_skills_score,
                    'description_match_score': description_match_score,
                    'total_score': total_score
                }
            )
            
            results.append({
                'cv': CVSerializer(cv).data,
                'total_score': total_score,
                'industry_score': industry_score,
                'tech_skills_score': tech_skills_score,
                'description_match_score': description_match_score
            })
        
        # Sort by total score and get top 5
        results.sort(key=lambda x: x['total_score'], reverse=True)
        top_5 = results[:5] if len(results) >= 5 else results
        
        return Response(top_5)
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import CV, JobDescription, MatchResult
from .serializers import CVSerializer, JobDescriptionSerializer, MatchResultSerializer
from .utils import extract_text_from_docx
from .gemini_utils import GeminiAI
import os

class CVViewSet(viewsets.ModelViewSet):
    queryset = CV.objects.all()
    serializer_class = CVSerializer
    
    def create(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        name = request.data.get('name', file.name)
        
        # Save the file
        cv = CV.objects.create(name=name, file=file)
        
        # Extract text from the file
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
        
        # Get all jobs
        jobs = JobDescription.objects.all()
        if not jobs:
            return Response({'message': 'No jobs found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Initialize the Gemini AI
        gemini = GeminiAI()
        
        # Calculate match scores for each job
        results = []
        for job in jobs:
            # Get match scores from Gemini
            match_result = gemini.process_cv_job_match(
                cv_text=cv.content,
                job_description=job.content,
                job_industry=job.industry,
                technical_skills=job.technical_skills
            )
            
            # Calculate total score
            total_score = (
                match_result['industry_score'] * 0.1 + 
                match_result['tech_skills_score'] * 0.3 + 
                match_result['description_match_score'] * 0.6
            )
            
            # Save the match result
            match, _ = MatchResult.objects.update_or_create(
                cv=cv,
                job=job,
                defaults={
                    'industry_score': match_result['industry_score'],
                    'tech_skills_score': match_result['tech_skills_score'],
                    'description_match_score': match_result['description_match_score'],
                    'total_score': total_score
                }
            )
            
            results.append({
                'job': JobDescriptionSerializer(job).data,
                'total_score': total_score,
                'industry_score': match_result['industry_score'],
                'tech_skills_score': match_result['tech_skills_score'],
                'description_match_score': match_result['description_match_score'],
                'explanation': match_result.get('explanation', '')
            })
        
        # Sort by total score
        results.sort(key=lambda x: x['total_score'], reverse=True)
        
        # Return the best match
        return Response(results[0])

class JobDescriptionViewSet(viewsets.ModelViewSet):
    queryset = JobDescription.objects.all()
    serializer_class = JobDescriptionSerializer
    
    @action(detail=True, methods=['get'])
    def find_matching_cvs(self, request, pk=None):
        """Find the top 5 matching CVs for a job"""
        job = self.get_object()
        
        # Get all CVs
        cvs = CV.objects.all()
        if not cvs:
            return Response({'message': 'No CVs found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Initialize the Gemini AI
        gemini = GeminiAI()
        
        # Calculate match scores for each CV
        results = []
        for cv in cvs:
            # Get match scores from Gemini
            match_result = gemini.process_cv_job_match(
                cv_text=cv.content,
                job_description=job.content,
                job_industry=job.industry,
                technical_skills=job.technical_skills
            )
            
            # Calculate total score
            total_score = (
                match_result['industry_score'] * 0.1 + 
                match_result['tech_skills_score'] * 0.3 + 
                match_result['description_match_score'] * 0.6
            )
            
            # Save the match result
            match, _ = MatchResult.objects.update_or_create(
                cv=cv,
                job=job,
                defaults={
                    'industry_score': match_result['industry_score'],
                    'tech_skills_score': match_result['tech_skills_score'],
                    'description_match_score': match_result['description_match_score'],
                    'total_score': total_score
                }
            )
            
            results.append({
                'cv': CVSerializer(cv).data,
                'total_score': total_score,
                'industry_score': match_result['industry_score'],
                'tech_skills_score': match_result['tech_skills_score'],
                'description_match_score': match_result['description_match_score'],
                'explanation': match_result.get('explanation', '')
            })
        
        # Sort by total score and get top 5
        results.sort(key=lambda x: x['total_score'], reverse=True)
        top_5 = results[:5] if len(results) >= 5 else results
        
        return Response(top_5)
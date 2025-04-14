import google.generativeai as genai
from django.conf import settings
import json
import re

class GeminiAI:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-pro-preview-03-25')
    
    def process_cv_job_match(self, cv_text, job_description, job_industry, technical_skills):
        """Process a CV and job description match using Gemini."""
        # Construct the prompt for Gemini
        skills_json = json.dumps(technical_skills)
        
        prompt = f"""
        You are a CV-Job matching expert AI. Analyze the CV and job description below and score
        how well the candidate matches the job requirements.
        
        The scoring is based on 3 criteria with different weights:
        
        1. Industry Knowledge (10%): How well does the candidate's experience match the specific
           industry ({job_industry}) mentioned in the job description?
        
        2. Technical Skills (30%): How well does the candidate's skills match the required technical skills.
           The skills and their relative importance (weights) are: {skills_json}
        
        3. Job Description Match (60%): Overall match between the CV and the complete job description,
           considering all factors.
        
        For each criterion, provide a score between 0 and 100.
        
        CV Text:
        {cv_text}
        
        Job Description:
        {job_description}
        
        Format your response as a JSON object with the following structure:
        {{
            "industry_score": [0-100],
            "tech_skills_score": [0-100],
            "description_match_score": [0-100],
            "explanation": "Brief explanation of your scoring"
        }}
        
        Only return the JSON object, nothing else.
        """
        
        response = self.model.generate_content(prompt)
        result_text = response.text.strip()
        
        # Extract JSON from the response
        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if json_match:
            try:
                result = json.loads(json_match.group(0))
                # Normalize scores to 0-1 range
                return {
                    'industry_score': result['industry_score'] / 100,
                    'tech_skills_score': result['tech_skills_score'] / 100,
                    'description_match_score': result['description_match_score'] / 100,
                    'explanation': result.get('explanation', '')
                }
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                pass
        
        # Default fallback
        return {
            'industry_score': 0.5,
            'tech_skills_score': 0.5,
            'description_match_score': 0.5,
            'explanation': 'Could not process result'
        }
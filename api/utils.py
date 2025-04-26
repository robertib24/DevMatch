import docx
import re
from google import generativeai as genai
from django.conf import settings

def extract_text_from_docx(file_path):
    """Extract text content from a DOCX file."""
    doc = docx.Document(file_path)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return '\n'.join(full_text)

def setup_gemini():
    """Configure the Gemini API client."""
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel('gemini-1.5-flash-latest')

def get_industry_score(cv_text, job_industry):
    """Calculate industry match score (10%)."""
    model = setup_gemini()
    
    prompt = f"""
    Analyze the CV text below and determine the candidate's experience level in the {job_industry} industry.
    Assign a score from 0 to 100 based on the following criteria:
    - 0: No relevant industry experience
    - 1-40: Minimal relevant experience
    - 41-70: Moderate relevant experience
    - 71-100: Extensive, direct experience
    
    Only return the numeric score, nothing else.
    
    CV: {cv_text}
    """
    
    response = model.generate_content(prompt)
    score_text = response.text.strip()
    
    try:
        score = float(score_text)
        return min(max(score, 0), 100) / 100 
    except ValueError:
        return 0.5 

def calculate_technical_skills_score(cv_text, required_skills):
    """Calculate technical skills match score (30%)."""
    model = setup_gemini()
    
    skills_list = ", ".join([f"{skill} (weight: {weight}%)" for skill, weight in required_skills.items()])
    
    prompt = f"""
    Analyze the CV text below and determine how well the candidate matches the following technical skills:
    {skills_list}
    
    For each skill, assign a match score from 0-100% based on:
    - Explicit mention of the skill
    - Years of experience with the skill
    - Proficiency level indicated
    - Projects using the skill
    
    Consider the weights provided for each skill.
    Return the final weighted score as a single number from 0-100.
    
    CV: {cv_text}
    """
    
    response = model.generate_content(prompt)
    score_text = response.text.strip()
    
    try:
        score = float(re.search(r'\d+', score_text).group())
        return min(max(score, 0), 100) / 100 
    except (ValueError, AttributeError):
        return 0.5 

def calculate_description_match_score(cv_text, job_description):
    """Calculate overall job description match score (60%)."""
    model = setup_gemini()
    
    prompt = f"""
    Compare the CV text and job description below. Evaluate how well the candidate's
    qualifications match the job requirements overall. Consider both technical skills and
    qualifications as well as experience in relevant domains.
    
    Assign a match score from 0 to 100, where:
    - 0-20: Poor match
    - 21-40: Below average match
    - 41-60: Average match
    - 61-80: Good match
    - 81-100: Excellent match
    
    Return only the numeric score.
    
    CV: {cv_text}
    
    Job Description: {job_description}
    """
    
    response = model.generate_content(prompt)
    score_text = response.text.strip()
    
    try:
        score = float(re.search(r'\d+', score_text).group())
        return min(max(score, 0), 100) / 100 
    except (ValueError, AttributeError):
        return 0.5 

def calculate_total_match_score(industry_score, tech_skills_score, description_match_score):
    """Calculate the final weighted match score."""
    return (industry_score * 0.1) + (tech_skills_score * 0.3) + (description_match_score * 0.6)
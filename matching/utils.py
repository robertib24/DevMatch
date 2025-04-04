import re
import docx2txt
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .models import Skill, Industry, CV, JobRequirement, RequiredSkill, MatchResult

# Initialize NLP model
nlp = spacy.load("en_core_web_lg")

def extract_text_from_docx(file_path):
    """Extract text from a .docx file"""
    return docx2txt.process(file_path)

def preprocess_text(text):
    """Clean and preprocess text data"""
    text = re.sub(r'\s+', ' ', re.sub(r'[^\w\s]', ' ', text.lower())).strip()
    return text

def extract_skills(text, skills_list):
    """Extract skills from text based on predefined skill list"""
    found_skills = []
    processed_text = preprocess_text(text)
    
    for skill in skills_list:
        if re.search(r'\b' + re.escape(skill.name.lower()) + r'\b', processed_text):
            found_skills.append(skill)
    
    return found_skills

def extract_industries(text, industries_list):
    """Extract industries from text"""
    found_industries = []
    processed_text = preprocess_text(text)
    
    for industry in industries_list:
        if re.search(r'\b' + re.escape(industry.name.lower()) + r'\b', processed_text):
            found_industries.append(industry)
    
    return found_industries

class CVMatchingSystem:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')
        
    def calculate_industry_score(self, cv, job):
        """Calculate industry knowledge score (10%)"""
        cv_industries = set(cv.industries.all())
        job_industries = set(job.industries.all())
        
        if not job_industries:
            return 1.0 
        
        matches = cv_industries & job_industries
        
        if not matches:
            return 0.0 

        score = min(1.0, len(matches) / len(job_industries))
        return score
    
    def calculate_technical_skills_score(self, cv, job):
        """Calculate technical skills score (30%)"""
        required_skills = job.required_skills.all()
        
        if not required_skills:
            return 1.0
            
        total_weight = sum(rs.weight for rs in required_skills)
        if total_weight == 0:
            return 0.0
            
        cv_skills = set(cv.skills.all())
        skill_score = 0
        
        for rs in required_skills:
            if rs.skill in cv_skills:
                skill_score += rs.weight
                
        return skill_score / 100 
    
    def calculate_semantic_match_score(self, cv_text, job_description):
        """Calculate semantic matching score (60%)"""
        docs = [preprocess_text(cv_text), preprocess_text(job_description)]
        tfidf_matrix = self.vectorizer.fit_transform(docs)
        
        cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return cosine_sim
    
    def calculate_match(self, cv, job):
        """Calculate overall match score with proper weightings"""
        industry_score = self.calculate_industry_score(cv, job)
        tech_skills_score = self.calculate_technical_skills_score(cv, job)
        semantic_score = self.calculate_semantic_match_score(cv.content, job.description)
        
        industry_component = industry_score * 0.10
        skills_component = tech_skills_score * 0.30
        semantic_component = semantic_score * 0.60
        
        overall_score = (industry_component + skills_component + semantic_component) * 100
        
        match_result, created = MatchResult.objects.update_or_create(
            cv=cv,
            job=job,
            defaults={
                'overall_score': overall_score,
                'industry_score': industry_score * 100,
                'skills_score': tech_skills_score * 100,
                'semantic_score': semantic_score * 100,
            }
        )
        
        return match_result

    def find_best_job_for_cv(self, cv):
        """Find the best matching job for a given CV"""
        all_jobs = JobRequirement.objects.all()
        best_match = None
        best_score = -1
        
        for job in all_jobs:
            match = self.calculate_match(cv, job)
            if match.overall_score > best_score:
                best_score = match.overall_score
                best_match = match
        
        return best_match
    
    def find_top_cvs_for_job(self, job, limit=5):
        """Find the top 5 CVs for a given job"""
        all_cvs = CV.objects.all()
        matches = []
        
        for cv in all_cvs:
            match = self.calculate_match(cv, job)
            matches.append(match)

        top_matches = sorted(matches, key=lambda m: m.overall_score, reverse=True)[:limit]
        return top_matches
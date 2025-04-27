import google.generativeai as genai
from django.conf import settings
import json
import re
from django.core.cache import cache
import hashlib
from concurrent.futures import ThreadPoolExecutor

class GeminiAI:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-1.5-flash-latest')
        self.max_workers = 3  # Limit concurrent API calls to avoid rate limits
    
    def _get_cache_key(self, cv_id, job_id):
        """Generate a unique cache key for a CV-job match pair."""
        return f"match_result_{cv_id}_{job_id}"

    def process_cv_job_match(self, cv_id, job_id, cv_text, job_description, job_industry, technical_skills):
        """Process a CV and job description match using Gemini, with caching."""
        # Check if we have a cached result
        cache_key = self._get_cache_key(cv_id, job_id)
        cached_result = cache.get(cache_key)
        
        if cached_result:
            print(f"Using cached match result for CV {cv_id} and Job {job_id}")
            return cached_result
        
        # Calculate a hash of the CV and job texts to detect changes
        cv_hash = hashlib.md5(cv_text.encode()).hexdigest()[:10]
        job_hash = hashlib.md5(job_description.encode()).hexdigest()[:10]
        
        # Generate a more efficient prompt with content summarization for large texts
        cv_summary = self._summarize_text(cv_text, 3000)  # Limit to 3000 chars
        job_summary = self._summarize_text(job_description, 2000)  # Limit to 2000 chars
        
        # Simplified prompt to reduce token usage
        skills_json = json.dumps(technical_skills)
        prompt = f"""
        As a CV-Job matching expert, analyze this CV and job description to score match quality:

        Industry Match (10%): Rate how well the candidate's experience matches the {job_industry} industry.
        Technical Skills (30%): Rate how well the candidate's skills match: {skills_json}
        Overall Description Match (60%): Rate overall compatibility.

        For each criterion, provide a score from 0-100.

        CV: {cv_summary}
        
        Job: {job_summary}
        
        Provide a very brief explanation of why this candidate is a good or bad match in 10-15 words.
        
        Return JSON only:
        {{
            "industry_score": [0-100],
            "tech_skills_score": [0-100],
            "description_match_score": [0-100],
            "explanation": "Very brief explanation (10-15 words)"
        }}
        """
        
        response = self.model.generate_content(prompt)
        result_text = response.text.strip()
        
        # Extract JSON from the response
        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if json_match:
            try:
                result = json.loads(json_match.group(0))
                # Normalize scores to 0-1 range
                normalized_result = {
                    'industry_score': result['industry_score'] / 100,
                    'tech_skills_score': result['tech_skills_score'] / 100,
                    'description_match_score': result['description_match_score'] / 100,
                    'explanation': result.get('explanation', ''),
                    'cv_hash': cv_hash,
                    'job_hash': job_hash
                }
                
                # Cache the result for future use (expire after 24 hours)
                cache.set(cache_key, normalized_result, 86400)
                return normalized_result
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                pass
        
        # Default fallback
        fallback_result = {
            'industry_score': 0.5,
            'tech_skills_score': 0.5,
            'description_match_score': 0.5,
            'explanation': 'Could not process result',
            'cv_hash': cv_hash,
            'job_hash': job_hash
        }
        # Cache the fallback result too, but for a shorter time
        cache.set(cache_key, fallback_result, 3600)
        return fallback_result
    
    def _summarize_text(self, text, max_length=3000):
        """Smartly truncate text to max_length, preserving important content."""
        if len(text) <= max_length:
            return text
        
        # For simplicity, we'll take the first 60% and last 40% of the allowed length
        # This helps preserve both the intro and conclusion of documents
        first_part = int(max_length * 0.6)
        last_part = max_length - first_part
        
        return text[:first_part] + "\n...[content truncated]...\n" + text[-last_part:]
        
    def process_matches_parallel(self, matches_data):
        """Process multiple matches in parallel with controlled concurrency."""
        results = []
        
        def process_single_match(match_data):
            cv_id = match_data.get('cv_id')
            job_id = match_data.get('job_id')
            cv_text = match_data.get('cv_text')
            job_description = match_data.get('job_description')
            job_industry = match_data.get('job_industry')
            technical_skills = match_data.get('technical_skills', {})
            
            result = self.process_cv_job_match(
                cv_id, job_id, cv_text, job_description, job_industry, technical_skills
            )
            return {
                'cv_id': cv_id,
                'job_id': job_id,
                'result': result
            }
        
        # Use ThreadPoolExecutor to process matches in parallel with limited concurrency
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all tasks
            future_to_match = {executor.submit(process_single_match, match_data): match_data 
                              for match_data in matches_data}
            
            # Collect results as they complete
            for future in future_to_match:
                try:
                    result = future.result()
                    results.append(result)
                except Exception as exc:
                    print(f'Match processing generated an exception: {exc}')
                    # Still include the match but with an error result
                    match_data = future_to_match[future]
                    results.append({
                        'cv_id': match_data.get('cv_id'),
                        'job_id': match_data.get('job_id'),
                        'result': {
                            'industry_score': 0,
                            'tech_skills_score': 0,
                            'description_match_score': 0,
                            'explanation': 'Error processing match',
                        }
                    })
        
        return results
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

interface Job {
  id: number;
  title: string;
}

interface CV {
  id: number;
  name: string;
}

interface MatchResult {
  cv: CV;
  total_score: number;
  industry_score: number;
  tech_skills_score: number;
  description_match_score: number;
  explanation?: string;
}

interface Activity {
  time: string | Date;
  description: string;
}

interface StatisticsResponse {
  totalCVs: number;
  totalJobs: number;
  totalMatches: number;
  recentActivity: Activity[];
}

@Component({
  selector: 'app-start',
  standalone: true, 
  imports: [
    CommonModule,
    FormsModule, 
    RouterModule  
  ],
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent implements OnInit {
  jobs: Job[] = [];
  selectedJob: Job | null = null;
  matchingCVs: MatchResult[] = [];
  statistics = {
    totalCVs: 0,
    totalJobs: 0,
    totalMatches: 0
  };
  recentActivities: Activity[] = [];

  isLoadingJobs: boolean = false;
  isLoadingCVs: boolean = false;
  isLoadingStats: boolean = false;
  errorMessage: string | null = null;
  progressValue: number = 0;
  progressInterval: any = null;

  // This should match your backend API URL
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.loadJobs();
    this.loadStatsAndActivities();
  }

  loadJobs(): void {
    this.isLoadingJobs = true;
    this.errorMessage = null;
    this.http.get<any>(`${this.apiUrl}/api/jobs/`).subscribe({
      next: (data) => {
        console.log('Jobs response:', data);
        if (Array.isArray(data)) {
          this.jobs = data;
        } else if (data && Array.isArray(data.results)) {
          this.jobs = data.results;
        } else {
          this.jobs = [];
          console.error('Unexpected jobs data format:', data);
        }
        this.isLoadingJobs = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading jobs:', error);
        this.errorMessage = 'Failed to load jobs. Please ensure the backend server is running.';
        this.isLoadingJobs = false;
      }
    });
  }

  loadMatchingCVs(): void {
    if (!this.selectedJob) {
      this.matchingCVs = [];
      return;
    }
    
    // Reset previous results
    this.matchingCVs = [];
    this.errorMessage = null;
    
    // Start loading state
    this.isLoadingCVs = true;
    
    // Start progress animation
    this.startProgressAnimation();
    
    // Add cache-busting parameter and for debugging purposes
    const useCache = localStorage.getItem('useCache') === 'false' ? 'false' : 'true';
    
    // Additional parameters for optimization
    let params = new HttpParams()
      .set('use_cache', useCache)
      .set('max_cvs', '10');  // Limit to 10 candidates for better performance
      
    this.http.get<any>(`${this.apiUrl}/api/jobs/${this.selectedJob.id}/find_matching_cvs/`, { params }).subscribe({
      next: (data) => {
        console.log('Matching CVs response:', data);
        
        // Clear progress animation
        this.stopProgressAnimation();
        
        // Process data
        if (Array.isArray(data)) {
          this.matchingCVs = data;
        } else if (data && Array.isArray(data.results)) {
          this.matchingCVs = data.results;
        } else {
          this.matchingCVs = [];
          console.error('Unexpected matchingCVs data format:', data);
        }
        
        // Update loading state
        this.isLoadingCVs = false;
        
        // Refresh statistics to show the new matches
        this.loadStatsAndActivities();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading matching CVs:', error);
        this.errorMessage = `Failed to load candidates for ${this.selectedJob?.title}. Please try again.`;
        this.isLoadingCVs = false;
        this.stopProgressAnimation();
      }
    });
  }
  
  // Animation for progress bar
  startProgressAnimation(): void {
    // Clear any existing interval
    this.stopProgressAnimation();
    
    // No need to update progress value as we're using CSS animation now
  }
  
  stopProgressAnimation(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    this.progressValue = 0;
  }

  loadStatsAndActivities(): void {
    this.isLoadingStats = true;
    this.errorMessage = null;
    this.http.get<StatisticsResponse>(`${this.apiUrl}/api/statistics/`).subscribe({
      next: (data) => {
        console.log('Statistics response:', data);
        this.statistics = {
          totalCVs: data.totalCVs,
          totalJobs: data.totalJobs,
          totalMatches: data.totalMatches
        };
        if (Array.isArray(data.recentActivity)) {
          this.recentActivities = data.recentActivity;
        } else {
          this.recentActivities = [];
          console.error('Unexpected recentActivity data format:', data.recentActivity);
        }
        this.isLoadingStats = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading statistics and activities:', error);
        this.errorMessage = 'Failed to load system statistics. Is the backend endpoint /api/statistics/ available?';
        this.statistics = { totalCVs: 0, totalJobs: 0, totalMatches: 0 };
        this.recentActivities = [];
        this.isLoadingStats = false;
      }
    });
  }

  viewCandidateDetails(match: MatchResult): void {
    if (match?.cv?.id) {
      this.router.navigate(['/candidate-detail', match.cv.id]);
    } else {
      console.error("Cannot navigate: Invalid candidate data provided.", match);
      this.errorMessage = "Could not retrieve candidate details.";
    }
  }

  onJobSelectionChange(): void {
    this.matchingCVs = [];
    this.errorMessage = null;
  }

  // Toggle cache for debugging purposes
  toggleCache(): void {
    const currentSetting = localStorage.getItem('useCache') === 'false';
    localStorage.setItem('useCache', (!currentSetting).toString());
    console.log(`Cache ${!currentSetting ? 'enabled' : 'disabled'} for API requests`);
  }
  
  // Helper method to get the appropriate score class
  getScoreClass(score: number): string {
    if (score >= 0.7) return 'high-score';
    if (score >= 0.5) return 'medium-score';
    return 'low-score';
  }
}
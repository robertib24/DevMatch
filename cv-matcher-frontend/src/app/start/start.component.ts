import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
    this.isLoadingCVs = true;
    this.errorMessage = null;
    this.matchingCVs = [];
    this.http.get<any>(`${this.apiUrl}/api/jobs/${this.selectedJob.id}/find_matching_cvs/`).subscribe({
      next: (data) => {
        console.log('Matching CVs response:', data);
        if (Array.isArray(data)) {
          this.matchingCVs = data;
        } else if (data && Array.isArray(data.results)) {
          this.matchingCVs = data.results;
        } else {
          this.matchingCVs = [];
          console.error('Unexpected matchingCVs data format:', data);
        }
        this.isLoadingCVs = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading matching CVs:', error);
        this.errorMessage = `Failed to load candidates for ${this.selectedJob?.title}. Please try again.`;
        this.isLoadingCVs = false;
      }
    });
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
}
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

  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.loadJobs();
    this.loadStatsAndActivities();
  }

  loadJobs(): void {
    this.isLoadingJobs = true;
    this.errorMessage = null;
    this.http.get<Job[]>(`${this.apiUrl}/api/jobs/`).subscribe({
      next: (data) => {
        this.jobs = data;
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
    this.http.get<MatchResult[]>(`${this.apiUrl}/api/jobs/${this.selectedJob.id}/find_matching_cvs/`).subscribe({
      next: (data) => {
        this.matchingCVs = data;
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
        this.statistics = {
          totalCVs: data.totalCVs,
          totalJobs: data.totalJobs,
          totalMatches: data.totalMatches
        };
        this.recentActivities = data.recentActivity;
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
      this.router.navigate(['/candidate', match.cv.id]);
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
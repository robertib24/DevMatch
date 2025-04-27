import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Job {
  id: number;
  title: string;
  content: string;
  industry: string;
  technical_skills: Record<string, number>;
  created_at: string;
  topCandidates?: MatchResult[]; // Property for top candidates
}

interface MatchResult {
  cv: {
    id: number;
    name: string;
  };
  total_score: number;
  industry_score: number;
  tech_skills_score: number;
  description_match_score: number;
  explanation?: string;
}

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.scss']
})
export class JobListComponent implements OnInit {
  jobs: Job[] = [];
  isLoading = false;
  processingAction = false;
  errorMessage: string | null = null;
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  
  // Sorting and Search
  sortField = 'created_at';
  sortDirection = 'desc';
  searchTerm = '';
  
  // Modals
  showDetailModal = false;
  showMatchesModal = false;
  selectedJob: Job | null = null;
  matchResults: MatchResult[] = [];
  
  // Display modes
  viewMode: 'grid' | 'list' = 'grid';
  
  // Show top candidates flags for each job
  showTopCandidates: Record<number, boolean> = {};
  
  private apiUrl = 'http://localhost:8000';
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadJobs();
  }
  
  toggleViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  loadJobs(page: number = 1): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.currentPage = page;
    
    // Build request parameters
    let params = new HttpParams()
      .set('page', page.toString());
    
    // Add ordering
    const ordering = this.sortDirection === 'desc' ? `-${this.sortField}` : this.sortField;
    params = params.set('ordering', ordering);
    
    // Add search if specified
    if (this.searchTerm) {
      params = params.set('search', this.searchTerm);
    }
    
    this.http.get<any>(`${this.apiUrl}/api/jobs/`, { params }).subscribe({
      next: (response) => {
        console.log('Jobs response:', response);
        
        if (Array.isArray(response)) {
          this.jobs = response;
          this.totalPages = 1;
        } else if (response && Array.isArray(response.results)) {
          this.jobs = response.results;
          this.totalPages = Math.ceil(response.count / 10); // Assuming page size of 10
        } else {
          this.jobs = [];
          console.error('Unexpected jobs data format:', response);
        }
        
        // Initialize top candidates display state
        this.jobs.forEach(job => {
          this.showTopCandidates[job.id] = false;
        });
        
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading jobs:', err);
        this.errorMessage = 'Failed to load jobs. Please try again.';
        this.isLoading = false;
      }
    });
  }

  getPageNumbers(): number[] {
    const pageNumbers: number[] = [];
    const maxPages = 5; // Show at most 5 page numbers
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadJobs(page);
    }
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      // Toggle sort direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc'; // Default to descending for new sort field
    }
    
    this.loadJobs(1); // Reset to page 1 when sorting changes
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  search(): void {
    this.loadJobs(1); // Reset to page 1 when searching
  }

  showJobDetails(job: Job): void {
    this.selectedJob = job;
    this.showDetailModal = true;
  }

  closeJobDetail(): void {
    this.showDetailModal = false;
    this.selectedJob = null;
  }

  findMatchingCVs(job: Job): void {
    this.processingAction = true;
    this.selectedJob = job;
    
    this.http.get<MatchResult[]>(`${this.apiUrl}/api/jobs/${job.id}/find_matching_cvs/`).subscribe({
      next: (response) => {
        this.processingAction = false;
        
        if (Array.isArray(response) && response.length > 0) {
          this.matchResults = response;
          this.showMatchesModal = true;
        } else {
          this.matchResults = [];
          this.showMatchesModal = true;
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error finding matching CVs:', err);
        this.processingAction = false;
        this.errorMessage = 'Error finding matching candidates. Please try again.';
      }
    });
  }

  toggleTopCandidates(job: Job, event?: Event): void {
    if (event) {
      event.stopPropagation(); // Prevent other click handlers
    }
    
    // If we already have the top candidates for this job, just toggle visibility
    if (job.topCandidates) {
      this.showTopCandidates[job.id] = !this.showTopCandidates[job.id];
      return;
    }
    
    // Otherwise fetch top candidates
    this.processingAction = true;
    
    this.http.get<MatchResult[]>(`${this.apiUrl}/api/jobs/${job.id}/top_candidates/`).subscribe({
      next: (response) => {
        job.topCandidates = response;
        this.showTopCandidates[job.id] = true;
        this.processingAction = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error fetching top candidates:', err);
        this.processingAction = false;
        // Create an empty array to prevent repeated failed requests
        job.topCandidates = [];
        this.showTopCandidates[job.id] = true;
      }
    });
  }

  closeMatchesModal(): void {
    this.showMatchesModal = false;
    this.matchResults = [];
  }

  deleteJob(job: Job): void {
    if (confirm(`Are you sure you want to delete the job "${job.title}"? This action cannot be undone.`)) {
      this.processingAction = true;
      
      this.http.delete(`${this.apiUrl}/api/jobs/${job.id}/`).subscribe({
        next: () => {
          this.jobs = this.jobs.filter(j => j.id !== job.id);
          this.processingAction = false;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error deleting job:', err);
          this.processingAction = false;
          this.errorMessage = 'Failed to delete job. Please try again.';
        }
      });
    }
  }

  getShortDescription(content: string): string {
    if (!content) return '';
    // Strip HTML tags if any and limit to 150 characters
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 150 ? 
      plainText.substring(0, 150) + '...' : 
      plainText;
  }

  getSkillsCount(skills: Record<string, number> | undefined): number {
    if (!skills) return 0;
    return Object.keys(skills).length;
  }

  getTopSkills(skills: Record<string, number> | undefined, count: number): string[] {
    if (!skills) return [];
    return Object.keys(skills).slice(0, count);
  }

  getAllSkills(skills: Record<string, number> | undefined): string[] {
    if (!skills) return [];
    return Object.keys(skills);
  }

  getScorePercentage(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  getScoreWidth(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  getScoreClass(score: number): string {
    if (score >= 0.7) return 'high-score';
    if (score >= 0.5) return 'medium-score';
    return 'low-score';
  }

  getScoreGradient(score: number): string {
    if (score >= 0.7) {
      return 'linear-gradient(135deg, #4caf50, #2e7d32)';
    } else if (score >= 0.5) {
      return 'linear-gradient(135deg, #ff9800, #e65100)';
    } else {
      return 'linear-gradient(135deg, #f44336, #c62828)';
    }
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface MatchResult {
  id: number;
  cv: {
    id: number;
    name: string;
  };
  job: {
    id: number;
    title: string;
    industry: string;
    content: string;
    technical_skills: { [key: string]: number };
    created_at: string;
  };
  total_score: number;
  industry_score: number;
  tech_skills_score: number;
  description_match_score: number;
  matched_at: string;
}

interface JobMatchStats {
  avgScore: number;
  totalMatches: number;
  highMatches: number;
  mediumMatches: number;
  lowMatches: number;
}

@Component({
  selector: 'app-match-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './match-list.component.html',
  styleUrls: ['./match-list.component.scss']
})
export class MatchListComponent implements OnInit {
  matches: MatchResult[] = [];
  filteredMatches: MatchResult[] = [];
  loading = false;
  errorMessage: string | null = null;
  
  // Pagination properties
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 25;
  
  // Sorting properties
  sortField = 'total_score';
  sortDirection = 'desc';
  
  // Search and filter properties
  searchTerm = '';
  viewMode = 'grid';
  
  // Job details modal properties
  showJobDetailModal = false;
  selectedJob: any = null;
  jobMatchStats: JobMatchStats | null = null;
  
  private apiUrl = 'http://localhost:8000';
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadMatches();
  }

  loadMatches(): void {
    this.loading = true;
    this.errorMessage = null;
    
    const ordering = this.sortDirection === 'desc' ? `-${this.sortField}` : this.sortField;
    let params = new HttpParams()
      .set('ordering', ordering)
      .set('page_size', this.itemsPerPage.toString())
      .set('page', this.currentPage.toString());
    
    if (this.searchTerm) {
      params = params.set('search', this.searchTerm);
    }
    
    this.http.get<any>(`${this.apiUrl}/api/matches/`, { params }).subscribe({
      next: (response) => {
        console.log('Matches response:', response);
        if (response && Array.isArray(response.results)) {
          this.matches = response.results;
          this.totalPages = Math.ceil(response.count / this.itemsPerPage);
        } else if (Array.isArray(response)) {
          this.matches = response;
          this.totalPages = Math.ceil(this.matches.length / this.itemsPerPage);
        } else {
          this.matches = [];
          console.error('Unexpected matches data format:', response);
        }
        
        // Apply filtering
        this.filteredMatches = this.matches;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading matches:', err);
        this.errorMessage = 'Failed to load matches. Please try again.';
        this.loading = false;
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMatches();
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
    
    // Reload data with new sorting
    this.currentPage = 1; // Reset to first page
    this.loadMatches();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  applySearch(): void {
    this.currentPage = 1;
    this.loadMatches();
  }
  
  // Job details methods
  showJobDetails(job: any): void {
    this.selectedJob = job;
    this.showJobDetailModal = true;
    
    // Calculate job match statistics
    this.calculateJobMatchStats(job.id);
  }
  
  calculateJobMatchStats(jobId: number): void {
    // Find all matches for this job
    const jobMatches = this.matches.filter(match => match.job.id === jobId);
    
    if (jobMatches.length === 0) {
      this.jobMatchStats = null;
      return;
    }
    
    // Calculate statistics
    const totalMatches = jobMatches.length;
    const avgScore = jobMatches.reduce((sum, match) => sum + match.total_score, 0) / totalMatches;
    const highMatches = jobMatches.filter(match => match.total_score >= 0.7).length;
    const mediumMatches = jobMatches.filter(match => match.total_score >= 0.5 && match.total_score < 0.7).length;
    const lowMatches = jobMatches.filter(match => match.total_score < 0.5).length;
    
    this.jobMatchStats = {
      avgScore,
      totalMatches,
      highMatches,
      mediumMatches,
      lowMatches
    };
  }
  
  closeJobDetails(): void {
    this.showJobDetailModal = false;
    this.selectedJob = null;
    this.jobMatchStats = null;
  }
  
  getSkillsCount(): number {
    if (!this.selectedJob || !this.selectedJob.technical_skills) return 0;
    return Object.keys(this.selectedJob.technical_skills).length;
  }
  
  getSkillsList(): string[] {
    if (!this.selectedJob || !this.selectedJob.technical_skills) return [];
    return Object.keys(this.selectedJob.technical_skills);
  }
  
  getSkillWeight(skill: string): number {
    if (!this.selectedJob || !this.selectedJob.technical_skills) return 100;
    return this.selectedJob.technical_skills[skill] || 100;
  }
  
  getJobDescriptionParagraphs(): string[] {
    if (!this.selectedJob || !this.selectedJob.content) return [];
    return this.selectedJob.content.split('\n').filter((line: string) => line.trim() !== '');
  }

  viewCVDetails(cvId: number): void {
    this.router.navigate(['/candidate-detail', cvId]);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  formatScore(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  getScoreClass(score: number): string {
    if (score >= 0.7) return 'high-score';
    if (score >= 0.5) return 'medium-score';
    return 'low-score';
  }

  getScoreBackground(score: number): string {
    if (score >= 0.7) {
      return 'linear-gradient(135deg, #4caf50, #2e7d32)';
    } else if (score >= 0.5) {
      return 'linear-gradient(135deg, #ff9800, #e65100)';
    } else {
      return 'linear-gradient(135deg, #f44336, #c62828)';
    }
  }

  getPageNumbers(): number[] {
    const pageNumbers: number[] = [];
    const totalPagesToShow = 5;
    
    if (this.totalPages <= totalPagesToShow) {
      // Show all pages if there are few
      for (let i = 1; i <= this.totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show a subset of pages with current page in the middle
      let startPage = Math.max(this.currentPage - Math.floor(totalPagesToShow / 2), 1);
      let endPage = startPage + totalPagesToShow - 1;
      
      if (endPage > this.totalPages) {
        endPage = this.totalPages;
        startPage = Math.max(endPage - totalPagesToShow + 1, 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  }

  exportToCSV(): void {
    if (this.matches.length === 0) return;
    
    const headers = ['Candidate', 'Job', 'Industry', 'Total Score', 'Industry Score', 'Skills Score', 'Description Score', 'Date'];
    const rows = this.matches.map(match => [
      match.cv.name,
      match.job.title,
      match.job.industry,
      this.formatScore(match.total_score),
      this.formatScore(match.industry_score),
      this.formatScore(match.tech_skills_score),
      this.formatScore(match.description_match_score),
      this.formatDate(match.matched_at)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'match_results.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
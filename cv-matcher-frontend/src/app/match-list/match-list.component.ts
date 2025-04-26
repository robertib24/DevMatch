import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

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
  };
  total_score: number;
  industry_score: number;
  tech_skills_score: number;
  description_match_score: number;
  matched_at: string;
}

@Component({
  selector: 'app-match-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './match-list.component.html',
  styleUrls: ['./match-list.component.scss']
})
export class MatchListComponent implements OnInit {
  matches: MatchResult[] = [];
  loading = false;
  errorMessage: string | null = null;
  currentPage = 1;
  totalPages = 1;
  sortField = 'total_score';
  sortDirection = 'desc';
  
  // Use the same API URL as your start component
  private apiUrl = 'http://localhost:8000';
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadMatches();
  }

  loadMatches(page: number = 1): void {
    this.loading = true;
    this.errorMessage = null;
    
    const ordering = this.sortDirection === 'desc' ? `-${this.sortField}` : this.sortField;
    
    this.http.get<any>(`${this.apiUrl}/api/matches/?page=${page}&ordering=${ordering}`).subscribe({
      next: (response) => {
        console.log('Matches response:', response);
        if (response && Array.isArray(response.results)) {
          this.matches = response.results;
          this.currentPage = page;
          this.totalPages = Math.ceil(response.count / 10); // Assuming page size of 10
        } else if (Array.isArray(response)) {
          this.matches = response;
          this.currentPage = 1;
          this.totalPages = 1;
        } else {
          this.matches = [];
          console.error('Unexpected matches data format:', response);
        }
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
      this.loadMatches(page);
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
    this.loadMatches(1); // Reset to page 1 when sorting changes
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  viewCVDetails(cvId: number): void {
    // In future, this could navigate to a detailed view
    alert(`CV ID: ${cvId}`);
  }

  viewJobDetails(jobId: number): void {
    // In future, this could navigate to a detailed view
    alert(`Job ID: ${jobId}`);
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
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface CV {
  id: number;
  name: string;
  file: string;
  processed_at: string;
}

@Component({
  selector: 'app-cv-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cv-list.component.html',
  styleUrls: ['./cv-list.component.scss']
})
export class CvListComponent implements OnInit {
  cvs: CV[] = [];
  isLoading = false;
  processingAction = false;
  errorMessage: string | null = null;
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  
  // Sorting and Search
  sortField = 'processed_at';
  sortDirection = 'desc';
  searchTerm = '';
  
  private apiUrl = 'http://localhost:8000';
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCVs();
  }

  loadCVs(page: number = 1): void {
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
    
    this.http.get<any>(`${this.apiUrl}/api/cvs/`, { params }).subscribe({
      next: (response) => {
        console.log('CVs response:', response);
        
        if (Array.isArray(response)) {
          this.cvs = response;
          this.totalPages = 1;
        } else if (response && Array.isArray(response.results)) {
          this.cvs = response.results;
          this.totalPages = Math.ceil(response.count / 10); // Assuming page size of 10
        } else {
          this.cvs = [];
          console.error('Unexpected CV data format:', response);
        }
        
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading CVs:', err);
        this.errorMessage = 'Failed to load candidates. Please try again.';
        this.isLoading = false;
      }
    });
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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadCVs(page);
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
    
    this.loadCVs(1); // Reset to page 1 when sorting changes
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  search(): void {
    this.loadCVs(1); // Reset to page 1 when searching
  }

  findBestJob(cv: CV): void {
    this.processingAction = true;
    
    this.http.get<any>(`${this.apiUrl}/api/cvs/${cv.id}/find_best_job/`).subscribe({
      next: (response) => {
        this.processingAction = false;
        
        if (response && response.job) {
          const score = Math.round(response.total_score * 100);
          const message = `Best job match for ${cv.name}:\n\n` +
                         `${response.job.title}\n` +
                         `Industry: ${response.job.industry}\n` +
                         `Match Score: ${score}%\n\n` +
                         `Industry Score: ${Math.round(response.industry_score * 100)}%\n` +
                         `Skills Score: ${Math.round(response.tech_skills_score * 100)}%\n` +
                         `Description Score: ${Math.round(response.description_match_score * 100)}%`;
          
          alert(message);
        } else {
          alert('No matching jobs found for this CV.');
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error finding best job:', err);
        this.processingAction = false;
        alert('Error finding best job match. Please try again.');
      }
    });
  }

  deleteCV(cv: CV): void {
    if (confirm(`Are you sure you want to delete the CV for ${cv.name}? This action cannot be undone.`)) {
      this.processingAction = true;
      
      this.http.delete(`${this.apiUrl}/api/cvs/${cv.id}/`).subscribe({
        next: () => {
          this.cvs = this.cvs.filter(c => c.id !== cv.id);
          this.processingAction = false;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error deleting CV:', err);
          this.processingAction = false;
          this.errorMessage = 'Failed to delete CV. Please try again.';
        }
      });
    }
  }
}
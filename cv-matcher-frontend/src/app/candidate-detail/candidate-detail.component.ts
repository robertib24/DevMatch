import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

interface CvDetail {
  id: number;
  name: string;
  content: string; // CV text content
  processed_at: string;
  file: string; // URL to download the original file
}

@Component({
  selector: 'app-candidate-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './candidate-detail.component.html',
  styleUrls: ['./candidate-detail.component.scss']
})
export class CandidateDetailComponent implements OnInit {
  cv: CvDetail | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  cvId: string | null = null;

  private apiUrl = 'http://localhost:8000';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router 
  ) {}

  ngOnInit(): void {
    // Get the CV ID from the route parameters
    this.cvId = this.route.snapshot.paramMap.get('id');

    if (this.cvId) {
      this.loadCvDetails(this.cvId);
    } else {
      console.error('CV ID is missing from the route.');
      this.errorMessage = 'Could not load candidate details: CV ID is missing.';
    }
  }

  loadCvDetails(id: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.cv = null;

    console.log('Loading CV details for ID:', id);

    // Fetch the CV details from the API
    this.http.get<CvDetail>(`${this.apiUrl}/api/cvs/${id}/`).subscribe({
      next: (data) => {
        console.log('CV data received:', data);
        
        // Log content information for debugging
        if (data && data.content) {
          console.log('Content received with length:', data.content.length);
        } else {
          console.warn('CV content is empty or missing in API response');
        }
        
        // Store the CV data
        this.cv = data;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading CV details:', error);
        if (error.status === 404) {
          this.errorMessage = 'Candidate CV not found.';
        } else {
          this.errorMessage = 'Failed to load candidate details. Please try again later.';
        }
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/start']);
  }
}
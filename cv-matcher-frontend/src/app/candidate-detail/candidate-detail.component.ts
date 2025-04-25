import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';


interface CvDetail {
  id: number;
  name: string;
  content: string;
  processed_at: string;
  file: string; 
}

@Component({
  selector: 'app-candidate-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './candidate-detail.component.html',
  styleUrls: ['./candidate-detail.component.scss']
})
export class CandidateDetailComponent implements OnInit {

  cv: CvDetail | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  cvId: string | null = null; // ID-ul CV-ului din ruta

  private apiUrl = 'http://localhost:8000';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router 
  ) {}

  ngOnInit(): void {
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

    this.http.get<CvDetail>(`${this.apiUrl}/api/cvs/${id}/`).subscribe({
      next: (data) => {
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
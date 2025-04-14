import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  getAllCVs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cvs/`);
  }

  uploadCV(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/cvs/`, formData);
  }

  findBestJob(cvId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/cvs/${cvId}/find_best_job/`);
  }

  getAllJobs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/jobs/`);
  }

  createJob(job: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/jobs/`, job);
  }

  findMatchingCVs(jobId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/jobs/${jobId}/find_matching_cvs/`);
  }
}
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-cv-to-job',
  templateUrl: './cv-to-job.component.html',
  styleUrls: ['./cv-to-job.component.scss']
})
export class CvToJobComponent implements OnInit {
  cvForm: FormGroup;
  existingCVs: any[] = [];
  bestMatchingJob: any = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadCVs();
  }

  initForm(): void {
    this.cvForm = this.fb.group({
      selectedCvId: [null],
      newCv: this.fb.group({
        file: [null]
      })
    });
  }

  loadCVs(): void {
    this.apiService.getAllCVs().subscribe(
      cvs => this.existingCVs = cvs,
      error => console.error('Error loading CVs:', error)
    );
  }

  onCvSelect(event: any): void {
    const cvId = event.value;
    if (cvId) {
      this.findBestJob(cvId);
    }
  }

  findBestJob(cvId: number): void {
    this.loading = true;
    this.apiService.findBestJob(cvId).subscribe(
      response => {
        this.bestMatchingJob = response;
        this.loading = false;
      },
      error => {
        console.error('Error finding best job:', error);
        this.loading = false;
      }
    );
  }

  onFileChange(event: any): void {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.cvForm.get('newCv').patchValue({
        file: file
      });
    }
  }

   getSkills(technicalSkills: any): any[] {
        return Object.keys(technicalSkills).map(key => {
        return {
            name: key,
            weight: technicalSkills[key]
        };
    });
  }

  onSubmitNewCV(): void {
    const formData = new FormData();
    formData.append('file', this.cvForm.get('newCv').get('file').value);
    formData.append('name', this.cvForm.get('newCv').get('file').value.name);
    
    this.loading = true;
    this.apiService.uploadCV(formData).subscribe(
      response => {
        this.existingCVs.push(response);
        this.findBestJob(response.id);
        this.loading = false;
      },
      error => {
        console.error('Error uploading CV:', error);
        this.loading = false;
      }
    );
  }
}
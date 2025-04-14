import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-job-to-cv',
  templateUrl: './job-to-cv.component.html',
  styleUrls: ['./job-to-cv.component.scss']
})
export class JobToCvComponent implements OnInit {
  jobForm: FormGroup;
  existingJobs: any[] = [];
  matchingCVs: any[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadJobs();
  }

  initForm(): void {
    this.jobForm = this.fb.group({
      selectedJobId: [null],
      newJob: this.fb.group({
        title: ['', Validators.required],
        content: ['', Validators.required],
        industry: ['', Validators.required],
        technicalSkills: this.fb.array([])
      })
    });
  }

  get technicalSkills(): FormArray {
    return this.jobForm.get('newJob').get('technicalSkills') as FormArray;
  }

  addSkill(): void {
    this.technicalSkills.push(
      this.fb.group({
        name: ['', Validators.required],
        weight: [0, [Validators.required, Validators.min(1), Validators.max(100)]]
      })
    );
  }

  removeSkill(index: number): void {
    this.technicalSkills.removeAt(index);
  }

  loadJobs(): void {
    this.apiService.getAllJobs().subscribe(
      jobs => this.existingJobs = jobs,
      error => console.error('Error loading jobs:', error)
    );
  }

  onJobSelect(event: any): void {
    const jobId = event.value;
    if (jobId) {
      this.findMatchingCVs(jobId);
    }
  }

  findMatchingCVs(jobId: number): void {
    this.loading = true;
    this.apiService.findMatchingCVs(jobId).subscribe(
      response => {
        this.matchingCVs = response;
        this.loading = false;
      },
      error => {
        console.error('Error finding matching CVs:', error);
        this.loading = false;
      }
    );
  }

  onSubmitNewJob(): void {
    if (this.jobForm.get('newJob').invalid) {
      return;
    }
    
    const formValue = this.jobForm.get('newJob').value;
    
    // Format technical skills as required by the API
    const technicalSkills = {};
    formValue.technicalSkills.forEach(skill => {
      technicalSkills[skill.name] = skill.weight;
    });
    
    const jobData = {
      title: formValue.title,
      content: formValue.content,
      industry: formValue.industry,
      technical_skills: technicalSkills
    };
    
    this.loading = true;
    this.apiService.createJob(jobData).subscribe(
      response => {
        this.existingJobs.push(response);
        this.findMatchingCVs(response.id);
        this.loading = false;
      },
      error => {
        console.error('Error creating job:', error);
        this.loading = false;
      }
    );
  }
}
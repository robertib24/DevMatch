import { Routes } from '@angular/router';
import { UploadCvComponent } from './upload-cv/upload-cv.component';
import { UploadJobComponent } from './upload-job/upload-job.component';
import { CandidateDetailComponent } from './candidate-detail/candidate-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: 'start', pathMatch: 'full' },
  {
    path: 'start',
    loadComponent: () => import('./start/start.component').then(m => m.StartComponent)
  },
  { path: 'upload-cv', component: UploadCvComponent },
  { path: 'upload-job', component: UploadJobComponent },
  { path: 'candidate/:id', component: CandidateDetailComponent },
  { path: '**', redirectTo: 'start' },
];
import { Routes } from '@angular/router';
import { StartComponent } from './start/start.component';
import { UploadCvComponent } from './upload-cv/upload-cv.component';
import { UploadJobComponent } from './upload-job/upload-job.component';
import { CvListComponent } from './cv-list/cv-list.component';
import { JobListComponent } from './job-list/job-list.component';
import { MatchListComponent } from './match-list/match-list.component';

export const routes: Routes = [
  { path: '', redirectTo: '/start', pathMatch: 'full' },
  { path: 'start', component: StartComponent },
  { path: 'upload-cv', component: UploadCvComponent },
  { path: 'upload-job', component: UploadJobComponent },
  { path: 'cv-list', component: CvListComponent },
  { path: 'job-list', component: JobListComponent },
  { path: 'match-list', component: MatchListComponent },
  { path: '**', redirectTo: '/start' }
];
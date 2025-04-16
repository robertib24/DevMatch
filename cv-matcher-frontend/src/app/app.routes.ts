import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'start',
    pathMatch: 'full',
  },
  {
    path: 'start',
    loadComponent: () =>
      import('./start/start.component').then((module) => module.StartComponent),
  },
  { path: '**', redirectTo: 'start' },
];

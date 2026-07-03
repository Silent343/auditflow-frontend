import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AppShellComponent } from './shared/components/app-shell.component';

/**
 * Rutas de la aplicación.
 * Las rutas autenticadas viven bajo el AppShell (sidebar + contenido).
 * Los componentes se cargan de forma lazy para optimizar el bundle inicial.
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/auth-callback.component').then(m => m.AuthCallbackComponent),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'repos',
        loadComponent: () =>
          import('./features/repos/repos.component').then(m => m.ReposComponent),
      },
      {
        path: 'audits',
        loadComponent: () =>
          import('./features/audits/audit-list.component').then(m => m.AuditListComponent),
      },
      {
        path: 'audits/:id',
        loadComponent: () =>
          import('./features/audits/audit-detail.component').then(m => m.AuditDetailComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Layout principal de la app autenticada.
 * Sidebar de navegación + área de contenido con router-outlet.
 */
@Component({
  selector: 'af-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-mark mono">~/</span>
          <span class="brand-name">audit<span class="brand-accent">flow</span></span>
        </div>

        <nav class="nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon mono">▸</span> Dashboard
          </a>
          <a routerLink="/repos" routerLinkActive="active" class="nav-item">
            <span class="nav-icon mono">▸</span> Repositorios
          </a>
          <a routerLink="/audits" routerLinkActive="active" class="nav-item">
            <span class="nav-icon mono">▸</span> Auditorías
          </a>
        </nav>

        @if (auth.user(); as user) {
          <div class="user-card">
            @if (user.avatarUrl) {
              <img [src]="user.avatarUrl" [alt]="user.login" class="avatar" />
            }
            <div class="user-info">
              <span class="user-login mono">{{ user.login }}</span>
              <span class="user-plan">{{ user.plan }}</span>
            </div>
            <button class="btn-ghost logout" (click)="auth.logout()" title="Cerrar sesión">
              <span class="mono">⏻</span>
            </button>
          </div>
        }
      </aside>

      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .shell { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; }

    .sidebar {
      background: var(--bg-surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 20px 14px;
      position: sticky;
      top: 0;
      height: 100vh;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px 24px;
      font-size: 18px;
      font-weight: 700;
    }
    .brand-mark { color: var(--accent); font-size: 16px; }
    .brand-name { letter-spacing: -0.02em; }
    .brand-accent { color: var(--accent); }

    .nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: var(--radius);
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      transition: all 0.12s ease;
    }
    .nav-item:hover { background: var(--bg-hover); color: var(--text-primary); text-decoration: none; }
    .nav-item.active { background: var(--accent-bg); color: var(--accent); }
    .nav-icon { font-size: 10px; opacity: 0.6; }
    .nav-item.active .nav-icon { opacity: 1; }

    .user-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--bg-elevated);
    }
    .avatar { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border); }
    .user-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .user-login { font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; }
    .user-plan { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .logout { padding: 4px 8px; font-size: 14px; }

    .content { padding: 32px 40px; max-width: 1100px; width: 100%; }

    @media (max-width: 768px) {
      .shell { grid-template-columns: 1fr; }
      .sidebar { position: static; height: auto; flex-direction: row; align-items: center; }
      .nav { flex-direction: row; }
      .user-card { display: none; }
      .content { padding: 20px; }
    }
  `],
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
}

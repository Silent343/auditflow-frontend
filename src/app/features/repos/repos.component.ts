import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { RepoService } from './repo.service';
import { AuditService } from '../audits/audit.service';
import {
  ConnectedRepo,
  GitHubRepoItem,
} from '../../core/models/audit.models';

/**
 * Página de repositorios.
 * Permite conectar repos de GitHub y lanzar auditorías sobre los conectados.
 */
@Component({
  selector: 'af-repos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div>
        <h1>Repositorios</h1>
        <p class="text-secondary">Conecta repos de GitHub y lanza auditorías</p>
      </div>
    </header>

    <!-- Repos conectados -->
    <section class="section">
      <h2>Conectados</h2>
      @if (loadingConnected()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else if (connectedRepos().length === 0) {
        <div class="empty card">
          <p class="mono text-muted">// ningún repo conectado</p>
          <p class="text-secondary">Conecta uno desde la lista de abajo para empezar.</p>
        </div>
      } @else {
        <div class="repo-grid">
          @for (repo of connectedRepos(); track repo.id) {
            <div class="repo-card card">
              <div class="repo-head">
                <span class="repo-name mono">{{ repo.fullName }}</span>
                @if (repo.privateRepo) { <span class="badge badge-info">private</span> }
              </div>
              <span class="repo-branch mono text-muted">⎇ {{ repo.defaultBranch }}</span>
              <div class="repo-actions">
                <button
                  class="btn btn-primary"
                  [disabled]="auditingRepoId() === repo.id"
                  (click)="runAudit(repo)">
                  @if (auditingRepoId() === repo.id) {
                    <div class="spinner"></div> Iniciando...
                  } @else {
                    <span class="mono">▸</span> Auditar
                  }
                </button>
                <button class="btn btn-ghost btn-danger" (click)="disconnect(repo)" title="Desconectar">
                  <span class="mono">✕</span>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </section>

    <!-- Repos disponibles en GitHub -->
    <section class="section">
      <div class="section-head">
        <h2>Disponibles en GitHub</h2>
        <input
          class="input search"
          type="text"
          placeholder="Filtrar repos..."
          [value]="filter()"
          (input)="filter.set($any($event.target).value)" />
      </div>

      @if (loadingGitHub()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else {
        <div class="gh-list">
          @for (repo of filteredGitHubRepos(); track repo.id) {
            <div class="gh-row">
              <div class="gh-info">
                <span class="gh-name mono">{{ repo.fullName }}</span>
                @if (repo.description) { <span class="gh-desc text-muted">{{ repo.description }}</span> }
              </div>
              <div class="gh-actions">
                @if (repo.privateRepo) { <span class="badge badge-info">private</span> }
                @if (isConnected(repo)) {
                  <span class="connected mono">✓ conectado</span>
                } @else {
                  <button class="btn" (click)="connect(repo)" [disabled]="connectingId() === repo.id">
                    @if (connectingId() === repo.id) { <div class="spinner"></div> }
                    @else { <span class="mono">+</span> Conectar }
                  </button>
                }
              </div>
            </div>
          } @empty {
            <p class="text-muted mono">// sin resultados</p>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .page-header { margin-bottom: 32px; }
    .page-header p { margin-top: 4px; }

    .section { margin-bottom: 40px; }
    .section h2 { margin-bottom: 16px; }
    .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .section-head h2 { margin-bottom: 0; }
    .search { max-width: 260px; }

    .loading { display: flex; justify-content: center; padding: 48px; }

    .empty {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 40px; text-align: center;
    }

    .repo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }
    .repo-card { display: flex; flex-direction: column; gap: 8px; }
    .repo-head { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
    .repo-name { font-size: 14px; font-weight: 500; }
    .repo-branch { font-size: 12px; }
    .repo-actions { display: flex; gap: 8px; margin-top: 6px; }
    .repo-actions .btn-primary { flex: 1; justify-content: center; }

    .gh-list { display: flex; flex-direction: column; gap: 6px; }
    .gh-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .gh-row:hover { border-color: var(--border-strong); }
    .gh-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .gh-name { font-size: 13px; font-weight: 500; }
    .gh-desc { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 400px; }
    .gh-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .connected { font-size: 12px; color: var(--accent); }

    @media (max-width: 768px) {
      .section-head { flex-direction: column; align-items: stretch; gap: 12px; }
      .search { max-width: none; }
    }
  `],
})
export class ReposComponent implements OnInit {
  private readonly repoService  = inject(RepoService);
  private readonly auditService = inject(AuditService);
  private readonly router       = inject(Router);

  protected readonly connectedRepos = signal<ConnectedRepo[]>([]);
  protected readonly gitHubRepos    = signal<GitHubRepoItem[]>([]);
  protected readonly loadingConnected = signal(true);
  protected readonly loadingGitHub    = signal(true);
  protected readonly connectingId   = signal<number | null>(null);
  protected readonly auditingRepoId = signal<string | null>(null);
  protected readonly filter = signal('');

  protected readonly filteredGitHubRepos = computed(() => {
    const f = this.filter().toLowerCase().trim();
    if (!f) return this.gitHubRepos();
    return this.gitHubRepos().filter(r => r.fullName.toLowerCase().includes(f));
  });

  ngOnInit(): void {
    this.loadConnected();
    this.loadGitHub();
  }

  private loadConnected(): void {
    this.repoService.listConnectedRepos().subscribe({
      next: repos => { this.connectedRepos.set(repos); this.loadingConnected.set(false); },
      error: () => this.loadingConnected.set(false),
    });
  }

  private loadGitHub(): void {
    this.repoService.listGitHubRepos().subscribe({
      next: repos => { this.gitHubRepos.set(repos); this.loadingGitHub.set(false); },
      error: () => this.loadingGitHub.set(false),
    });
  }

  protected isConnected(repo: GitHubRepoItem): boolean {
    return this.connectedRepos().some(c => c.githubRepoId === repo.id);
  }

  protected connect(repo: GitHubRepoItem): void {
    this.connectingId.set(repo.id);
    this.repoService.connectRepo({
      githubRepoId: repo.id,
      fullName: repo.fullName,
      owner: repo.owner,
      repoName: repo.name,
      privateRepo: repo.privateRepo,
      defaultBranch: repo.defaultBranch,
    }).subscribe({
      next: connected => {
        this.connectedRepos.update(list => [...list, connected]);
        this.connectingId.set(null);
      },
      error: () => this.connectingId.set(null),
    });
  }

  protected disconnect(repo: ConnectedRepo): void {
    this.repoService.disconnectRepo(repo.id).subscribe({
      next: () => this.connectedRepos.update(list => list.filter(r => r.id !== repo.id)),
    });
  }

  protected runAudit(repo: ConnectedRepo): void {
    this.auditingRepoId.set(repo.id);
    this.auditService.startAudit({ repoId: repo.id, branch: repo.defaultBranch }).subscribe({
      next: audit => this.router.navigate(['/audits', audit.id]),
      error: () => this.auditingRepoId.set(null),
    });
  }
}

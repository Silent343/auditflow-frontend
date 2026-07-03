import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { AuditService } from '../audits/audit.service';
import { RepoService } from '../repos/repo.service';
import { AuditSummary } from '../../core/models/audit.models';
import { ScoreGaugeComponent } from '../../shared/components/score-gauge.component';
import { AuditStatusPipe } from '../../shared/pipes/audit-status.pipe';

/**
 * Dashboard: vista general del estado de las auditorías del usuario.
 * Muestra métricas agregadas y las auditorías más recientes.
 */
@Component({
  selector: 'af-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, ScoreGaugeComponent, AuditStatusPipe],
  template: `
    <header class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p class="text-secondary">
          @if (auth.user(); as u) { Hola, {{ u.name || u.login }} } — resumen de tu calidad de código
        </p>
      </div>
      <a routerLink="/repos" class="btn btn-primary">
        <span class="mono">+</span> Nueva auditoría
      </a>
    </header>

    @if (loading()) {
      <div class="loading"><div class="spinner"></div></div>
    } @else {
      <!-- Métricas agregadas -->
      <div class="metrics">
        <div class="metric">
          <span class="metric-value mono">{{ totalAudits() }}</span>
          <span class="metric-label">Auditorías</span>
        </div>
        <div class="metric">
          <span class="metric-value mono">{{ connectedReposCount() }}</span>
          <span class="metric-label">Repos conectados</span>
        </div>
        <div class="metric">
          <span class="metric-value mono" [style.color]="avgScoreColor()">{{ avgScore() ?? '—' }}</span>
          <span class="metric-label">Score promedio</span>
        </div>
        <div class="metric">
          <span class="metric-value mono" style="color: var(--sev-critical)">{{ totalIssues() }}</span>
          <span class="metric-label">Issues totales</span>
        </div>
      </div>

      <!-- Auditorías recientes -->
      <section class="recent">
        <h2>Auditorías recientes</h2>
        @if (recentAudits().length === 0) {
          <div class="empty card">
            <p class="mono text-muted">// sin auditorías todavía</p>
            <p class="text-secondary">Conecta un repo y corre tu primera auditoría.</p>
            <a routerLink="/repos" class="btn btn-primary">Conectar repositorio</a>
          </div>
        } @else {
          <div class="audit-list">
            @for (audit of recentAudits(); track audit.id) {
              <a [routerLink]="['/audits', audit.id]" class="audit-row">
                <div class="audit-score">
                  @if (audit.overallScore !== null) {
                    <af-score-gauge [score]="audit.overallScore" [size]="48" [showMax]="false" />
                  } @else {
                    <div class="score-pending mono">—</div>
                  }
                </div>
                <div class="audit-info">
                  <span class="audit-repo mono">{{ audit.repoFullName }}</span>
                  <span class="audit-meta text-muted mono">
                    {{ audit.branch }}
                    @if (audit.commitSha) { · {{ audit.commitSha.slice(0, 7) }} }
                    · {{ audit.startedAt | date:'short' }}
                  </span>
                </div>
                <div class="audit-stats">
                  @if (audit.totalIssues !== null) {
                    <span class="issue-count mono">{{ audit.totalIssues }} issues</span>
                  }
                  <span [class]="'status status-' + audit.status.toLowerCase()">
                    {{ audit.status | auditStatus }}
                  </span>
                </div>
              </a>
            }
          </div>
        }
      </section>
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 32px;
    }
    .page-header p { margin-top: 4px; }

    .loading { display: flex; justify-content: center; padding: 80px; }

    .metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 40px;
    }
    .metric {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .metric-value { font-size: 32px; font-weight: 800; line-height: 1; }
    .metric-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

    .recent h2 { margin-bottom: 16px; }

    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px;
      text-align: center;
    }

    .audit-list { display: flex; flex-direction: column; gap: 8px; }
    .audit-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 18px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      transition: all 0.12s ease;
      color: inherit;
    }
    .audit-row:hover { border-color: var(--border-strong); background: var(--bg-elevated); text-decoration: none; }

    .audit-score { flex-shrink: 0; }
    .score-pending {
      width: 48px; height: 48px;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-muted); font-size: 18px;
      border: 1px solid var(--border); border-radius: 50%;
    }

    .audit-info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .audit-repo { font-size: 14px; font-weight: 500; }
    .audit-meta { font-size: 11px; }

    .audit-stats { display: flex; align-items: center; gap: 12px; }
    .issue-count { font-size: 12px; color: var(--text-secondary); }

    @media (max-width: 768px) {
      .metrics { grid-template-columns: repeat(2, 1fr); }
      .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly auditService = inject(AuditService);
  private readonly repoService  = inject(RepoService);

  protected readonly loading = signal(true);
  protected readonly recentAudits = signal<AuditSummary[]>([]);
  protected readonly totalAudits = signal(0);
  protected readonly connectedReposCount = signal(0);

  protected readonly totalIssues = signal(0);
  protected readonly avgScore = signal<number | null>(null);

  ngOnInit(): void {
    this.auditService.listAudits(0, 8).subscribe({
      next: page => {
        this.recentAudits.set(page.content);
        this.totalAudits.set(page.totalElements);
        this.computeAggregates(page.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.repoService.listConnectedRepos().subscribe({
      next: repos => this.connectedReposCount.set(repos.length),
    });
  }

  private computeAggregates(audits: AuditSummary[]): void {
    const completed = audits.filter(a => a.status === 'COMPLETED' && a.overallScore !== null);
    if (completed.length > 0) {
      const avg = completed.reduce((sum, a) => sum + (a.overallScore ?? 0), 0) / completed.length;
      this.avgScore.set(Math.round(avg));
    }
    this.totalIssues.set(audits.reduce((sum, a) => sum + (a.totalIssues ?? 0), 0));
  }

  protected avgScoreColor(): string {
    const s = this.avgScore();
    if (s === null) return 'var(--text-muted)';
    if (s >= 70) return 'var(--score-good)';
    if (s >= 50) return 'var(--score-ok)';
    return 'var(--score-bad)';
  }
}

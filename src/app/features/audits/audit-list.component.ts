import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuditService } from './audit.service';
import { AuditSummary } from '../../core/models/audit.models';
import { ScoreGaugeComponent } from '../../shared/components/score-gauge.component';
import { AuditStatusPipe } from '../../shared/pipes/audit-status.pipe';

/**
 * Lista paginada de todas las auditorías del usuario.
 */
@Component({
  selector: 'af-audit-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, ScoreGaugeComponent, AuditStatusPipe],
  template: `
    <header class="page-header">
      <div>
        <h1>Auditorías</h1>
        <p class="text-secondary">Historial completo de análisis</p>
      </div>
      <a routerLink="/repos" class="btn btn-primary">
        <span class="mono">+</span> Nueva auditoría
      </a>
    </header>

    @if (loading()) {
      <div class="loading"><div class="spinner"></div></div>
    } @else if (audits().length === 0) {
      <div class="empty card">
        <p class="mono text-muted">// sin auditorías</p>
        <a routerLink="/repos" class="btn btn-primary">Conectar repositorio</a>
      </div>
    } @else {
      <div class="audit-list">
        @for (audit of audits(); track audit.id) {
          <a [routerLink]="['/audits', audit.id]" class="audit-row">
            <div class="audit-score">
              @if (audit.overallScore !== null) {
                <af-score-gauge [score]="audit.overallScore" [size]="52" [showMax]="false" />
              } @else {
                <div class="score-pending mono">—</div>
              }
            </div>
            <div class="audit-info">
              <span class="audit-repo mono">{{ audit.repoFullName }}</span>
              <span class="audit-meta text-muted mono">
                {{ audit.branch }}
                @if (audit.commitSha) { · {{ audit.commitSha.slice(0, 7) }} }
                · {{ audit.startedAt | date:'medium' }}
              </span>
            </div>
            <div class="audit-stats">
              @if (audit.filesAnalyzed !== null) {
                <span class="stat mono">{{ audit.filesAnalyzed }} archivos</span>
              }
              @if (audit.totalIssues !== null) {
                <span class="stat mono issues">{{ audit.totalIssues }} issues</span>
              }
              <span [class]="'status status-' + audit.status.toLowerCase()">
                {{ audit.status | auditStatus }}
              </span>
            </div>
          </a>
        }
      </div>

      <!-- Paginación -->
      @if (totalPages() > 1) {
        <div class="pagination">
          <button class="btn" [disabled]="page() === 0" (click)="changePage(page() - 1)">
            <span class="mono">←</span> Anterior
          </button>
          <span class="page-info mono text-muted">{{ page() + 1 }} / {{ totalPages() }}</span>
          <button class="btn" [disabled]="page() >= totalPages() - 1" (click)="changePage(page() + 1)">
            Siguiente <span class="mono">→</span>
          </button>
        </div>
      }
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
    .page-header p { margin-top: 4px; }

    .loading { display: flex; justify-content: center; padding: 80px; }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 48px; text-align: center; }

    .audit-list { display: flex; flex-direction: column; gap: 8px; }
    .audit-row {
      display: flex; align-items: center; gap: 18px;
      padding: 16px 20px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      transition: all 0.12s ease;
      color: inherit;
    }
    .audit-row:hover { border-color: var(--border-strong); background: var(--bg-elevated); text-decoration: none; }

    .score-pending {
      width: 52px; height: 52px;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-muted); font-size: 18px;
      border: 1px solid var(--border); border-radius: 50%;
    }

    .audit-info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .audit-repo { font-size: 15px; font-weight: 500; }
    .audit-meta { font-size: 11px; }

    .audit-stats { display: flex; align-items: center; gap: 14px; }
    .stat { font-size: 12px; color: var(--text-secondary); }
    .stat.issues { color: var(--sev-high); }

    .pagination {
      display: flex; align-items: center; justify-content: center; gap: 16px;
      margin-top: 24px;
    }
    .page-info { font-size: 13px; }

    @media (max-width: 768px) {
      .audit-stats { display: none; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
    }
  `],
})
export class AuditListComponent implements OnInit {
  private readonly auditService = inject(AuditService);

  protected readonly audits = signal<AuditSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);

  ngOnInit(): void {
    this.load(0);
  }

  private load(page: number): void {
    this.loading.set(true);
    this.auditService.listAudits(page, 12).subscribe({
      next: res => {
        this.audits.set(res.content);
        this.page.set(res.page);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected changePage(page: number): void {
    this.load(page);
  }
}

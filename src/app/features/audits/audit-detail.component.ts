import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AuditService } from './audit.service';
import { PdfExportService } from './pdf-export.service';
import {
  AuditDetail,
  Category,
  Severity,
} from '../../core/models/audit.models';
import { ScoreGaugeComponent } from '../../shared/components/score-gauge.component';
import { AuditStatusPipe } from '../../shared/pipes/audit-status.pipe';
import { CategoryPipe } from '../../shared/pipes/category.pipe';

/**
 * Detalle completo de una auditoría.
 * Hace polling en vivo mientras está en progreso, luego muestra:
 * - Score general (gauge grande)
 * - Scores por categoría (barras)
 * - Lista de issues filtrable por categoría y severidad
 * - Export a PDF (plan Pro)
 */
@Component({
  selector: 'af-audit-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, ScoreGaugeComponent, AuditStatusPipe, CategoryPipe],
  template: `
    @if (loading()) {
      <div class="loading"><div class="spinner"></div><p class="text-secondary mono">cargando...</p></div>
    } @else if (audit(); as a) {
      <!-- Breadcrumb + header -->
      <div class="breadcrumb mono text-muted">
        <a routerLink="/audits">auditorías</a> / {{ a.id.slice(0, 8) }}
      </div>

      <header class="page-header">
        <div>
          <h1 class="mono">{{ a.repoFullName }}</h1>
          <p class="text-secondary mono">
            {{ a.branch }}
            @if (a.commitSha) { · {{ a.commitSha.slice(0, 7) }} }
            · {{ a.startedAt | date:'medium' }}
          </p>
        </div>
        <div class="header-actions">
          <span [class]="'status status-' + a.status.toLowerCase()">
            @if (a.status === 'RUNNING' || a.status === 'PENDING') { <div class="spinner-sm"></div> }
            {{ a.status | auditStatus }}
          </span>
          @if (a.status === 'COMPLETED') {
            <button class="btn" (click)="exportPdf(a)">
              <span class="mono">↓</span> Exportar PDF
              @if (!isPro()) { <span class="pro-tag">PRO</span> }
            </button>
          }
        </div>
      </header>

      <!-- Estado en progreso -->
      @if (a.status === 'PENDING' || a.status === 'RUNNING') {
        <div class="card progress-card">
          <div class="spinner"></div>
          <div>
            <p class="progress-title">Analizando código con IA...</p>
            <p class="text-secondary">Esto puede tomar uno o dos minutos según el tamaño del repo.</p>
          </div>
        </div>
      }

      <!-- Estado fallido -->
      @if (a.status === 'FAILED') {
        <div class="card error-card">
          <p class="mono error-title">✗ Auditoría fallida</p>
          <p class="text-secondary">{{ a.errorMessage || 'Error desconocido durante el análisis.' }}</p>
        </div>
      }

      <!-- Resultados -->
      @if (a.status === 'COMPLETED') {
        <div class="results">
          <!-- Score general + categorías -->
          <div class="scores-section">
            <div class="overall-card card">
              <af-score-gauge [score]="a.overallScore ?? 0" [size]="140" />
              <div class="overall-meta">
                <span class="meta-line mono">{{ a.filesAnalyzed }} archivos</span>
                <span class="meta-line mono issues">{{ a.totalIssues }} issues</span>
              </div>
            </div>

            <div class="categories card">
              @for (cat of a.categoryScores; track cat.category) {
                <div class="cat-row">
                  <span class="cat-name">{{ cat.category | category }}</span>
                  <div class="cat-bar">
                    <div class="cat-bar-fill"
                         [style.width.%]="cat.score"
                         [style.background]="catColor(cat.score)"></div>
                  </div>
                  <span class="cat-score mono" [style.color]="catColor(cat.score)">{{ cat.score }}</span>
                  <span class="cat-issues mono text-muted">{{ cat.issueCount }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Filtros -->
          <div class="filters">
            <div class="filter-group">
              <button class="filter-chip" [class.active]="categoryFilter() === null"
                      (click)="categoryFilter.set(null)">Todas</button>
              @for (cat of categories; track cat) {
                <button class="filter-chip" [class.active]="categoryFilter() === cat"
                        (click)="categoryFilter.set(cat)">{{ cat | category }}</button>
              }
            </div>
            <div class="filter-group">
              <button class="filter-chip" [class.active]="severityFilter() === null"
                      (click)="severityFilter.set(null)">Toda severidad</button>
              @for (sev of severities; track sev) {
                <button class="filter-chip" [class.active]="severityFilter() === sev"
                        (click)="severityFilter.set(sev)">
                  <span [class]="'badge badge-' + sev.toLowerCase()">{{ sev }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Lista de issues -->
          <div class="issues">
            @for (issue of filteredIssues(); track issue.id) {
              <div class="issue-card">
                <div class="issue-head">
                  <span [class]="'badge badge-' + issue.severity.toLowerCase()">{{ issue.severity }}</span>
                  <span [class]="'badge badge-info'">{{ issue.category | category }}</span>
                  <span class="issue-title">{{ issue.title }}</span>
                </div>
                <span class="issue-loc mono text-muted">
                  {{ issue.filePath }}@if (issue.lineNumber) {<span class="line">:{{ issue.lineNumber }}</span>}
                </span>
                <p class="issue-desc text-secondary">{{ issue.description }}</p>
                @if (issue.suggestion) {
                  <div class="issue-suggestion">
                    <span class="suggestion-label mono">→ sugerencia</span>
                    <p>{{ issue.suggestion }}</p>
                  </div>
                }
              </div>
            } @empty {
              <div class="empty card">
                <p class="mono text-muted">// sin issues con estos filtros</p>
              </div>
            }
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .loading {
      display: flex; flex-direction: column; align-items: center; gap: 16px;
      padding: 100px; min-height: 60vh; justify-content: center;
    }

    .breadcrumb { font-size: 12px; margin-bottom: 12px; }
    .breadcrumb a { color: var(--text-muted); }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .page-header h1 { font-size: 20px; }
    .page-header p { margin-top: 4px; font-size: 12px; }
    .header-actions { display: flex; align-items: center; gap: 12px; }

    .pro-tag {
      font-family: var(--font-mono); font-size: 9px; font-weight: 700;
      background: var(--accent-bg); color: var(--accent);
      padding: 1px 5px; border-radius: 3px; margin-left: 4px;
    }

    .spinner-sm {
      width: 10px; height: 10px;
      border: 2px solid transparent; border-top-color: currentColor;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }

    .progress-card, .error-card {
      display: flex; align-items: center; gap: 18px;
    }
    .progress-title { font-weight: 500; margin-bottom: 2px; }
    .error-card { flex-direction: column; align-items: flex-start; gap: 8px; border-color: var(--sev-critical); }
    .error-title { color: var(--sev-critical); font-weight: 500; }

    /* Scores */
    .scores-section { display: grid; grid-template-columns: 220px 1fr; gap: 16px; margin-bottom: 28px; }
    .overall-card { display: flex; flex-direction: column; align-items: center; gap: 16px; justify-content: center; }
    .overall-meta { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .meta-line { font-size: 13px; color: var(--text-secondary); }
    .meta-line.issues { color: var(--sev-high); }

    .categories { display: flex; flex-direction: column; gap: 16px; justify-content: center; }
    .cat-row { display: grid; grid-template-columns: 110px 1fr 40px 30px; align-items: center; gap: 12px; }
    .cat-name { font-size: 13px; font-weight: 500; }
    .cat-bar { height: 8px; background: var(--bg-input); border-radius: 4px; overflow: hidden; }
    .cat-bar-fill { height: 100%; border-radius: 4px; transition: width 0.9s cubic-bezier(0.4,0,0.2,1); }
    .cat-score { font-size: 14px; font-weight: 700; text-align: right; }
    .cat-issues { font-size: 11px; text-align: right; }

    /* Filtros */
    .filters { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .filter-group { display: flex; gap: 6px; flex-wrap: wrap; }
    .filter-chip {
      font-family: var(--font-ui); font-size: 12px; font-weight: 500;
      padding: 5px 12px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 99px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.12s ease;
      display: inline-flex; align-items: center; gap: 4px;
    }
    .filter-chip:hover { border-color: var(--border-strong); color: var(--text-primary); }
    .filter-chip.active { background: var(--accent-bg); border-color: var(--accent); color: var(--accent); }
    .filter-chip .badge { font-size: 9px; padding: 1px 5px; }

    /* Issues */
    .issues { display: flex; flex-direction: column; gap: 10px; }
    .issue-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-left: 3px solid var(--border-strong);
      border-radius: var(--radius);
      padding: 16px 18px;
    }
    .issue-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .issue-title { font-size: 14px; font-weight: 500; }
    .issue-loc { font-size: 12px; display: block; margin-bottom: 10px; }
    .issue-loc .line { color: var(--sev-medium); }
    .issue-desc { font-size: 13px; line-height: 1.6; margin-bottom: 12px; }

    .issue-suggestion {
      background: var(--accent-bg);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
    }
    .suggestion-label { font-size: 11px; color: var(--accent); display: block; margin-bottom: 4px; }
    .issue-suggestion p { font-size: 13px; line-height: 1.6; }

    .empty { display: flex; justify-content: center; padding: 40px; }

    @media (max-width: 768px) {
      .scores-section { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 16px; }
      .cat-row { grid-template-columns: 90px 1fr 36px; }
      .cat-issues { display: none; }
    }
  `],
})
export class AuditDetailComponent implements OnInit, OnDestroy {
  private readonly route   = inject(ActivatedRoute);
  private readonly auth    = inject(AuthService);
  private readonly service = inject(AuditService);
  private readonly pdf     = inject(PdfExportService);

  protected readonly categories: Category[] = ['ARCHITECTURE', 'SOLID', 'SECURITY', 'PERFORMANCE'];
  protected readonly severities: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

  protected readonly audit = signal<AuditDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly categoryFilter = signal<Category | null>(null);
  protected readonly severityFilter = signal<Severity | null>(null);

  private pollSub?: Subscription;

  protected readonly filteredIssues = computed(() => {
    const a = this.audit();
    if (!a) return [];
    const cat = this.categoryFilter();
    const sev = this.severityFilter();
    return [...a.issues]
      .filter(i => cat === null || i.category === cat)
      .filter(i => sev === null || i.severity === sev)
      .sort((x, y) => this.severityRank(x.severity) - this.severityRank(y.severity));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    // Polling: emite cada actualización hasta COMPLETED o FAILED
    this.pollSub = this.service.pollAudit(id).subscribe({
      next: audit => {
        this.audit.set(audit);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  protected isPro(): boolean {
    const plan = this.auth.user()?.plan;
    return plan === 'PRO' || plan === 'TEAM';
  }

  protected exportPdf(audit: AuditDetail): void {
    // En producción, validar plan en el backend antes de permitir el export.
    this.pdf.export(audit);
  }

  protected catColor(score: number): string {
    if (score >= 70) return 'var(--score-good)';
    if (score >= 50) return 'var(--score-ok)';
    return 'var(--score-bad)';
  }

  private severityRank(sev: Severity): number {
    return this.severities.indexOf(sev);
  }
}

import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

/**
 * Medidor circular de score (0-100).
 * Es el elemento visual distintivo del dashboard: un anillo SVG que cambia
 * de color según el rango del score, con el número en mono al centro.
 */
@Component({
  selector: 'af-score-gauge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gauge" [style.width.px]="size()" [style.height.px]="size()">
      <svg [attr.viewBox]="'0 0 ' + size() + ' ' + size()">
        <!-- Track de fondo -->
        <circle
          [attr.cx]="center()"
          [attr.cy]="center()"
          [attr.r]="radius()"
          fill="none"
          stroke="var(--border)"
          [attr.stroke-width]="stroke()" />
        <!-- Arco del score -->
        <circle
          [attr.cx]="center()"
          [attr.cy]="center()"
          [attr.r]="radius()"
          fill="none"
          [attr.stroke]="color()"
          [attr.stroke-width]="stroke()"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circumference()"
          [attr.stroke-dashoffset]="dashOffset()"
          [attr.transform]="'rotate(-90 ' + center() + ' ' + center() + ')'"
          class="gauge-arc" />
      </svg>
      <div class="gauge-label">
        <span class="gauge-value mono" [style.color]="color()" [style.font-size.px]="valueFontSize()">
          {{ score() }}
        </span>
        @if (showMax()) {
          <span class="gauge-max mono">/100</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .gauge { position: relative; display: inline-flex; }
    .gauge svg { width: 100%; height: 100%; }
    .gauge-arc { transition: stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s; }
    .gauge-label {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0;
    }
    .gauge-value { font-weight: 800; line-height: 1; }
    .gauge-max { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  `],
})
export class ScoreGaugeComponent {
  /** Score a mostrar (0-100). */
  readonly score = input.required<number>();
  /** Diámetro del gauge en px. */
  readonly size = input<number>(120);
  /** Mostrar "/100" debajo del número. */
  readonly showMax = input<boolean>(true);

  protected readonly stroke = computed(() => this.size() * 0.08);
  protected readonly center = computed(() => this.size() / 2);
  protected readonly radius = computed(() => this.center() - this.stroke());
  protected readonly circumference = computed(() => 2 * Math.PI * this.radius());
  protected readonly valueFontSize = computed(() => this.size() * 0.3);

  protected readonly dashOffset = computed(() => {
    const pct = Math.max(0, Math.min(100, this.score())) / 100;
    return this.circumference() * (1 - pct);
  });

  protected readonly color = computed(() => {
    const s = this.score();
    if (s >= 70) return 'var(--score-good)';
    if (s >= 50) return 'var(--score-ok)';
    return 'var(--score-bad)';
  });
}

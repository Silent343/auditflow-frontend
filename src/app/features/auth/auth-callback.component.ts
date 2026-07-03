import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Maneja el callback de OAuth.
 * El backend redirige aquí con ?token=JWT tras el login exitoso de GitHub.
 */
@Component({
  selector: 'af-auth-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="callback">
      @if (error()) {
        <div class="callback-error">
          <p class="mono">✗ {{ error() }}</p>
          <a routerLink="/login" class="btn">Volver al login</a>
        </div>
      } @else {
        <div class="spinner"></div>
        <p class="text-secondary mono">Autenticando...</p>
      }
    </div>
  `,
  styles: [`
    .callback {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }
    .callback-error { text-align: center; display: flex; flex-direction: column; gap: 16px; align-items: center; }
    .callback-error p { color: var(--sev-critical); }
  `],
})
export class AuthCallbackComponent implements OnInit {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth   = inject(AuthService);

  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.error.set('No se recibió token de autenticación');
      return;
    }

    this.auth.handleAuthCallback(token).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => this.error.set('Error al cargar el perfil del usuario'),
    });
  }
}

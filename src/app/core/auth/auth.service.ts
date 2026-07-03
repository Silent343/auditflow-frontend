import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserProfile } from '../models/audit.models';

const TOKEN_KEY = 'auditflow_token';

/**
 * Servicio de autenticación.
 * Maneja el JWT, el perfil del usuario y el flujo OAuth con GitHub.
 * Usa signals para exponer el estado de forma reactiva.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  /** Usuario autenticado actual (null si no hay sesión). */
  private readonly userSignal = signal<UserProfile | null>(null);
  readonly user = this.userSignal.asReadonly();

  /** True si hay una sesión activa. */
  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  /** Token JWT almacenado. */
  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /** Inicia el flujo OAuth redirigiendo al backend. */
  loginWithGitHub(): void {
    window.location.href = `${this.apiUrl}/auth/github`;
  }

  /**
   * Guarda el token recibido del callback OAuth y carga el perfil.
   *
   * @param token JWT recibido en el query param del callback
   */
  handleAuthCallback(token: string): Observable<UserProfile> {
    localStorage.setItem(TOKEN_KEY, token);
    return this.loadProfile();
  }

  /** Carga el perfil del usuario desde el backend usando el JWT. */
  loadProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/auth/me`).pipe(
      tap(profile => this.userSignal.set(profile))
    );
  }

  /** Cierra la sesión y limpia el estado. */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.userSignal.set(null);
    this.router.navigate(['/login']);
  }
}

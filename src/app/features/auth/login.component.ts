import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Página de login. Punto de entrada no autenticado.
 * El hero presenta el producto con un mock de terminal — fiel al mundo del código.
 */
@Component({
  selector: 'af-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login">
      <div class="login-content">
        <div class="brand mono">~/auditflow</div>

        <h1 class="headline">
          Audita tu código<br>
          <span class="accent">antes de que lo haga producción.</span>
        </h1>

        <p class="subhead">
          Conecta un repo de GitHub y deja que la IA detecte violaciones de
          arquitectura, SOLID, seguridad y rendimiento — con un score auditable por módulo.
        </p>

        <button class="btn btn-primary login-btn" (click)="auth.loginWithGitHub()">
          <span class="mono">⎇</span> Continuar con GitHub
        </button>

        <div class="features mono">
          <span>+ DDD &amp; Clean Architecture</span>
          <span>+ Principios SOLID</span>
          <span>+ Vulnerabilidades de seguridad</span>
          <span>+ Cuellos de botella de rendimiento</span>
        </div>
      </div>

      <div class="login-visual">
        <div class="terminal">
          <div class="terminal-bar">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            <span class="terminal-title mono">auditflow — analyze</span>
          </div>
          <div class="terminal-body mono">
            <p><span class="prompt">$</span> auditflow run <span class="arg">--repo</span> my-api</p>
            <p class="dim">→ extracting 47 source files...</p>
            <p class="dim">→ analyzing with claude-sonnet-4-6...</p>
            <p class="ok">✓ ARCHITECTURE  ········ 82/100</p>
            <p class="warn">⚠ SOLID  ··············· 64/100</p>
            <p class="bad">✗ SECURITY  ············ 41/100</p>
            <p class="ok">✓ PERFORMANCE  ········· 88/100</p>
            <p><span class="prompt">→</span> <span class="result">overall: 69/100 · 23 issues found</span></p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
    }
    .login-content { padding: 0 8% 0 10%; max-width: 620px; }
    .brand { color: var(--accent); font-size: 15px; font-weight: 500; margin-bottom: 40px; }

    .headline { font-size: 42px; line-height: 1.12; letter-spacing: -0.03em; margin-bottom: 20px; }
    .headline .accent { color: var(--accent); }

    .subhead {
      color: var(--text-secondary);
      font-size: 16px;
      line-height: 1.65;
      margin-bottom: 32px;
      max-width: 480px;
    }

    .login-btn { font-size: 15px; padding: 12px 22px; }

    .features {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 40px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .login-visual {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      height: 100vh;
      background:
        radial-gradient(circle at 70% 30%, rgba(63,185,80,0.06), transparent 60%),
        var(--bg-base);
      border-left: 1px solid var(--border-muted);
    }

    .terminal {
      width: 100%;
      max-width: 480px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
    }
    .terminal-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 14px;
      background: var(--bg-elevated);
      border-bottom: 1px solid var(--border);
    }
    .dot { width: 11px; height: 11px; border-radius: 50%; background: var(--border-strong); }
    .terminal-title { margin-left: 10px; font-size: 11px; color: var(--text-muted); }

    .terminal-body { padding: 18px 20px; font-size: 13px; line-height: 1.9; }
    .terminal-body p { white-space: nowrap; }
    .prompt { color: var(--accent); }
    .arg { color: var(--sev-low); }
    .dim { color: var(--text-muted); }
    .ok  { color: var(--accent); }
    .warn { color: var(--sev-medium); }
    .bad { color: var(--sev-critical); }
    .result { color: var(--text-primary); font-weight: 500; }

    @media (max-width: 900px) {
      .login { grid-template-columns: 1fr; }
      .login-visual { display: none; }
      .login-content { padding: 60px 24px; }
      .headline { font-size: 32px; }
    }
  `],
})
export class LoginComponent {
  protected readonly auth = inject(AuthService);
}

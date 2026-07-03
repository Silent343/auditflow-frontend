import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timer, switchMap, takeWhile } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuditDetail,
  AuditSummary,
  PageResponse,
  StartAuditRequest,
} from '../../core/models/audit.models';

/**
 * Servicio para auditorías de código.
 * Incluye polling para seguir auditorías en progreso.
 */
@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http   = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Inicia una auditoría (retorna inmediatamente con status PENDING). */
  startAudit(request: StartAuditRequest): Observable<AuditSummary> {
    return this.http.post<AuditSummary>(`${this.apiUrl}/audits`, request);
  }

  /** Lista las auditorías del usuario con paginación. */
  listAudits(page = 0, size = 10): Observable<PageResponse<AuditSummary>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<AuditSummary>>(`${this.apiUrl}/audits`, { params });
  }

  /** Obtiene el detalle completo de una auditoría. */
  getAudit(auditId: string): Observable<AuditDetail> {
    return this.http.get<AuditDetail>(`${this.apiUrl}/audits/${auditId}`);
  }

  /** Lista el historial de auditorías de un repo. */
  listRepoAudits(repoId: string, page = 0, size = 10): Observable<PageResponse<AuditSummary>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<AuditSummary>>(
      `${this.apiUrl}/repos/${repoId}/audits`, { params });
  }

  /**
   * Hace polling del detalle de una auditoría cada 3s hasta que termina.
   * Emite cada actualización; completa cuando el status es COMPLETED o FAILED.
   *
   * @param auditId ID de la auditoría a seguir
   */
  pollAudit(auditId: string): Observable<AuditDetail> {
    return timer(0, 3000).pipe(
      switchMap(() => this.getAudit(auditId)),
      takeWhile(
        audit => audit.status === 'PENDING' || audit.status === 'RUNNING',
        true // inclusivo: emite también el valor final que rompe la condición
      )
    );
  }
}

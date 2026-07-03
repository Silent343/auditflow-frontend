import { Pipe, PipeTransform } from '@angular/core';
import { AuditStatus } from '../../core/models/audit.models';

/**
 * Traduce el status de auditoría a una etiqueta legible en español.
 */
@Pipe({ name: 'auditStatus' })
export class AuditStatusPipe implements PipeTransform {
  private readonly labels: Record<AuditStatus, string> = {
    PENDING:   'En cola',
    RUNNING:   'Analizando',
    COMPLETED: 'Completada',
    FAILED:    'Fallida',
  };

  transform(status: AuditStatus): string {
    return this.labels[status] ?? status;
  }
}

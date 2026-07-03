import { Pipe, PipeTransform } from '@angular/core';
import { Category } from '../../core/models/audit.models';

/**
 * Traduce las categorías de auditoría a etiquetas legibles.
 */
@Pipe({ name: 'category' })
export class CategoryPipe implements PipeTransform {
  private readonly labels: Record<Category, string> = {
    ARCHITECTURE: 'Arquitectura',
    SOLID:        'SOLID',
    SECURITY:     'Seguridad',
    PERFORMANCE:  'Rendimiento',
  };

  transform(category: Category): string {
    return this.labels[category] ?? category;
  }
}

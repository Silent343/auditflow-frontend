import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { AuditDetail, Category, Severity } from '../../core/models/audit.models';

/**
 * Genera un reporte PDF de una auditoría usando jsPDF.
 * Disponible para usuarios del plan Pro.
 */
@Injectable({ providedIn: 'root' })
export class PdfExportService {

  private readonly categoryLabels: Record<Category, string> = {
    ARCHITECTURE: 'Arquitectura',
    SOLID: 'SOLID',
    SECURITY: 'Seguridad',
    PERFORMANCE: 'Rendimiento',
  };

  private readonly severityColors: Record<Severity, [number, number, number]> = {
    CRITICAL: [248, 81, 73],
    HIGH:     [255, 140, 66],
    MEDIUM:   [210, 153, 34],
    LOW:      [88, 166, 255],
    INFO:     [139, 148, 158],
  };

  /**
   * Genera y descarga el PDF del reporte de auditoría.
   *
   * @param audit detalle completo de la auditoría
   */
  export(audit: AuditDetail): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    let y = margin;

    // ─── Header ───
    doc.setFontSize(22);
    doc.setTextColor(35, 134, 54);
    doc.text('AuditFlow', margin, y);
    doc.setFontSize(10);
    doc.setTextColor(110, 118, 129);
    doc.text('Reporte de auditoría de código', margin, y + 16);
    y += 48;

    // ─── Info del repo ───
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(audit.repoFullName, margin, y);
    y += 18;
    doc.setFontSize(9);
    doc.setTextColor(110, 118, 129);
    const meta = `Rama: ${audit.branch}  ·  Commit: ${audit.commitSha?.slice(0, 7) ?? 'N/A'}  ·  ${audit.filesAnalyzed ?? 0} archivos analizados`;
    doc.text(meta, margin, y);
    y += 30;

    // ─── Score general ───
    const score = audit.overallScore ?? 0;
    const scoreColor = this.scoreColor(score);
    doc.setFontSize(40);
    doc.setTextColor(...scoreColor);
    doc.text(`${score}`, margin, y + 18);
    doc.setFontSize(12);
    doc.setTextColor(110, 118, 129);
    doc.text('/100', margin + 56, y + 18);
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(`Score general  ·  ${audit.totalIssues ?? 0} issues encontrados`, margin + 100, y + 14);
    y += 48;

    // ─── Scores por categoría ───
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 24;

    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text('Scores por categoría', margin, y);
    y += 20;

    for (const cat of audit.categoryScores) {
      const label = this.categoryLabels[cat.category];
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(label, margin, y);

      // barra de score
      const barX = margin + 120;
      const barW = 200;
      doc.setFillColor(235, 235, 235);
      doc.roundedRect(barX, y - 8, barW, 8, 2, 2, 'F');
      doc.setFillColor(...this.scoreColor(cat.score));
      doc.roundedRect(barX, y - 8, (barW * cat.score) / 100, 8, 2, 2, 'F');

      doc.setTextColor(...this.scoreColor(cat.score));
      doc.text(`${cat.score}/100`, barX + barW + 16, y);
      doc.setTextColor(110, 118, 129);
      doc.text(`${cat.issueCount} issues`, barX + barW + 70, y);
      y += 20;
    }
    y += 16;

    // ─── Issues ───
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 24;

    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text(`Issues detectados (${audit.issues.length})`, margin, y);
    y += 22;

    const sorted = [...audit.issues].sort(
      (a, b) => this.severityRank(a.severity) - this.severityRank(b.severity)
    );

    for (const issue of sorted) {
      if (y > 760) { doc.addPage(); y = margin; }

      // severity badge
      const sevColor = this.severityColors[issue.severity];
      doc.setFillColor(...sevColor);
      doc.roundedRect(margin, y - 8, 52, 12, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(issue.severity, margin + 6, y);

      // título
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      const titleLines = doc.splitTextToSize(issue.title, pageWidth - margin * 2 - 70);
      doc.text(titleLines, margin + 62, y);
      y += titleLines.length * 12;

      // ruta
      doc.setFontSize(8);
      doc.setTextColor(110, 118, 129);
      const loc = issue.lineNumber ? `${issue.filePath}:${issue.lineNumber}` : issue.filePath;
      doc.text(loc, margin + 62, y);
      y += 12;

      // descripción
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const descLines = doc.splitTextToSize(issue.description, pageWidth - margin * 2 - 62);
      doc.text(descLines, margin + 62, y);
      y += descLines.length * 11 + 14;
    }

    doc.save(`auditflow-${audit.repoFullName.replace('/', '-')}-${score}.pdf`);
  }

  private scoreColor(score: number): [number, number, number] {
    if (score >= 70) return [35, 134, 54];
    if (score >= 50) return [210, 153, 34];
    return [248, 81, 73];
  }

  private severityRank(sev: Severity): number {
    return ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].indexOf(sev);
  }
}

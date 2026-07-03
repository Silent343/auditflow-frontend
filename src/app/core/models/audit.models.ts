/**
 * Modelos del dominio de AuditFlow.
 * Reflejan los DTOs del backend Spring Boot.
 */

export type Plan = 'FREE' | 'PRO' | 'TEAM';

export type AuditStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type Category = 'ARCHITECTURE' | 'SOLID' | 'SECURITY' | 'PERFORMANCE';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

/** Perfil del usuario autenticado. */
export interface UserProfile {
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  plan: Plan;
}

/** Repo disponible en GitHub (para el selector). */
export interface GitHubRepoItem {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  privateRepo: boolean;
  defaultBranch: string;
  description: string | null;
}

/** Repo conectado en AuditFlow. */
export interface ConnectedRepo {
  id: string;
  githubRepoId: number;
  fullName: string;
  owner: string;
  repoName: string;
  privateRepo: boolean;
  defaultBranch: string;
  connectedAt: string;
}

/** Request para conectar un repo. */
export interface ConnectRepoRequest {
  githubRepoId: number;
  fullName: string;
  owner: string;
  repoName: string;
  privateRepo: boolean;
  defaultBranch: string;
}

/** Resumen de auditoría (listados). */
export interface AuditSummary {
  id: string;
  repoId: string;
  repoFullName: string;
  branch: string;
  commitSha: string | null;
  status: AuditStatus;
  overallScore: number | null;
  totalIssues: number | null;
  filesAnalyzed: number | null;
  startedAt: string;
  completedAt: string | null;
}

/** Score por categoría. */
export interface CategoryScore {
  category: Category;
  score: number;
  issueCount: number;
}

/** Issue individual del reporte. */
export interface AuditIssue {
  id: string;
  category: Category;
  severity: Severity;
  filePath: string;
  lineNumber: number | null;
  title: string;
  description: string;
  suggestion: string | null;
}

/** Detalle completo de una auditoría. */
export interface AuditDetail extends AuditSummary {
  errorMessage: string | null;
  categoryScores: CategoryScore[];
  issues: AuditIssue[];
}

/** Request para iniciar auditoría. */
export interface StartAuditRequest {
  repoId: string;
  branch?: string;
}

/** Response paginada genérica. */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

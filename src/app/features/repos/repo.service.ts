import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ConnectedRepo,
  ConnectRepoRequest,
  GitHubRepoItem,
} from '../../core/models/audit.models';

/**
 * Servicio para gestión de repositorios conectados.
 */
@Injectable({ providedIn: 'root' })
export class RepoService {
  private readonly http   = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Lista los repos disponibles en GitHub del usuario. */
  listGitHubRepos(): Observable<GitHubRepoItem[]> {
    return this.http.get<GitHubRepoItem[]>(`${this.apiUrl}/github/repos`);
  }

  /** Lista los repos ya conectados en AuditFlow. */
  listConnectedRepos(): Observable<ConnectedRepo[]> {
    return this.http.get<ConnectedRepo[]>(`${this.apiUrl}/repos`);
  }

  /** Conecta un nuevo repo. */
  connectRepo(request: ConnectRepoRequest): Observable<ConnectedRepo> {
    return this.http.post<ConnectedRepo>(`${this.apiUrl}/repos`, request);
  }

  /** Desconecta un repo. */
  disconnectRepo(repoId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/repos/${repoId}`);
  }
}

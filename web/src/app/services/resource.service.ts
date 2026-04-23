import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ResourceCategory, ResourceEntityType, ResourceLinkRequest, ResourceResponse } from '../models/resource.model';

@Injectable({ providedIn: 'root' })
export class ResourceService {
  private readonly base = `${environment.apiGateway}/milestone/api/resources`;

  constructor(private readonly http: HttpClient) {}

  list(entityType: ResourceEntityType, entityId: number): Observable<ResourceResponse[]> {
    const params = new HttpParams()
      .set('entityType', entityType)
      .set('entityId', entityId);
    return this.http.get<ResourceResponse[]>(this.base, { params });
  }

  createLink(req: ResourceLinkRequest): Observable<ResourceResponse> {
    return this.http.post<ResourceResponse>(`${this.base}/links`, req);
  }

  uploadFile(entityType: ResourceEntityType, entityId: number, category: ResourceCategory, label: string, file: File): Observable<ResourceResponse> {
    const form = new FormData();
    form.append('entityType', entityType);
    form.append('entityId', String(entityId));
    form.append('category', category);
    form.append('label', label);
    form.append('file', file);
    return this.http.post<ResourceResponse>(`${this.base}/files`, form);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

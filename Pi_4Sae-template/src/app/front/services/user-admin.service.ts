import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type UserRole = 'ADMIN' | 'USER';

export interface ManagedUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly baseUrl = environment.production
    ? `${environment.prolanceGatewayUrl}/users/admin/users`
    : '/users/admin/users';

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ManagedUser[]> {
    return this.http.get<ManagedUser[]>(this.baseUrl);
  }

  create(payload: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    enabled: boolean;
  }): Observable<ManagedUser> {
    return this.http.post<ManagedUser>(this.baseUrl, payload);
  }

  update(id: number, payload: Partial<{
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    enabled: boolean;
  }>): Observable<ManagedUser> {
    return this.http.put<ManagedUser>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface DiscoverableFreelancer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
  skills?: string | null;
  portfolioUrl?: string | null;
}

interface UserApiResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
  skills?: string | null;
  portfolioUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UserDiscoveryService {
  private readonly base = `${environment.apiGateway}/user/api/users/public`;

  constructor(private readonly http: HttpClient) {}

  listFreelancers(): Observable<DiscoverableFreelancer[]> {
    return this.http.get<UserApiResponse[]>(`${this.base}/freelancers`).pipe(
      map((users) => (users ?? []).map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture ?? null,
        skills: user.skills ?? null,
        portfolioUrl: user.portfolioUrl ?? null,
      })))
    );
  }
}

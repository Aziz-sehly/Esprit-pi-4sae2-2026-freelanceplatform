import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Check for stored user session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(email: string, password: string): Observable<User> {
    // Mock login - in production, this would call an API
    const mockUser: User = {
      id: '1',
      email: email,
      firstName: 'John',
      lastName: 'Doe',
      userType: 'freelancer',
      profileImage: 'https://i.pravatar.cc/150?img=12',
      createdAt: new Date()
    };

    return of(mockUser).pipe(
      delay(1000),
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  register(userData: Partial<User>): Observable<User> {
    const newUser: User = {
      id: Math.random().toString(36).substring(7),
      email: userData.email!,
      firstName: userData.firstName!,
      lastName: userData.lastName!,
      userType: userData.userType!,
      createdAt: new Date()
    };

    return of(newUser).pipe(
      delay(1000),
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}

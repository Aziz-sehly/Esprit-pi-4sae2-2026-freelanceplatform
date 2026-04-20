import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  AuthService,
  UserResponse,
} from '../../front/services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
})
export class AdminUsersComponent implements OnInit {
  users: UserResponse[] = [];
  loading = false;
  creating = false;
  savingUserId: number | null = null;
  alertMessage: string | null = null;
  alertType: 'success' | 'error' | null = null;

  draft: AdminCreateUserRequest = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'CLIENT',
    phoneNumber: '',
    skills: '',
    portfolioUrl: '',
    companyName: '',
    isVerified: true,
    isActive: true,
  };

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.authService.getAllUsersAdmin().subscribe({
      next: (users) => {
        this.users = users ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showAlert('Failed to load users', 'error');
      },
    });
  }

  createUser(): void {
    if (!this.draft.email || !this.draft.password || !this.draft.firstName || !this.draft.lastName) {
      this.showAlert('Email, password, first name and last name are required', 'error');
      return;
    }
    this.creating = true;
    this.authService.createUserAdmin(this.draft).subscribe({
      next: (u) => {
        this.users = [u, ...this.users];
        this.creating = false;
        this.draft = {
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'CLIENT',
          phoneNumber: '',
          skills: '',
          portfolioUrl: '',
          companyName: '',
          isVerified: true,
          isActive: true,
        };
        this.showAlert('User created successfully', 'success');
      },
      error: (err) => {
        this.creating = false;
        this.showAlert(err?.error?.message || 'Failed to create user', 'error');
      },
    });
  }

  saveUser(u: UserResponse): void {
    if (!u.id) return;
    const payload: AdminUpdateUserRequest = {
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      phoneNumber: u.phoneNumber || '',
      bio: u.bio || '',
      profilePicture: u.profilePicture || '',
      skills: u.skills || '',
      portfolioUrl: u.portfolioUrl || '',
      companyName: u.companyName || '',
      isVerified: !!u.isVerified,
      isActive: !!u.isActive,
    };
    this.savingUserId = u.id;
    this.authService.updateUserAdmin(u.id, payload).subscribe({
      next: (updated) => {
        this.users = this.users.map((x) => (x.id === updated.id ? updated : x));
        this.savingUserId = null;
        this.showAlert(`User #${u.id} updated`, 'success');
      },
      error: (err) => {
        this.savingUserId = null;
        this.showAlert(err?.error?.message || `Failed to update user #${u.id}`, 'error');
      },
    });
  }

  toggleVerified(u: UserResponse): void {
    if (!u.id) return;
    const next = !u.isVerified;
    this.savingUserId = u.id;
    this.authService.setUserVerifiedAdmin(u.id, next).subscribe({
      next: (updated) => {
        this.users = this.users.map((x) => (x.id === updated.id ? updated : x));
        this.savingUserId = null;
        this.showAlert(`User #${u.id} verification updated`, 'success');
      },
      error: (err) => {
        this.savingUserId = null;
        this.showAlert(err?.error?.message || `Failed to verify user #${u.id}`, 'error');
      },
    });
  }

  deleteUser(u: UserResponse): void {
    if (!u.id) return;
    const me = this.authService.getCurrentUser();
    if (me?.id === u.id) {
      this.showAlert('You cannot delete your own admin account', 'error');
      return;
    }
    if (!confirm(`Delete user #${u.id} (${u.email})?`)) return;
    this.savingUserId = u.id;
    this.authService.deleteUserAdmin(u.id).subscribe({
      next: () => {
        this.users = this.users.filter((x) => x.id !== u.id);
        this.savingUserId = null;
        this.showAlert(`User #${u.id} deleted`, 'success');
      },
      error: (err) => {
        this.savingUserId = null;
        this.showAlert(err?.error?.message || `Failed to delete user #${u.id}`, 'error');
      },
    });
  }

  private showAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => {
      this.alertMessage = null;
      this.alertType = null;
    }, 3000);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagedUser, UserAdminService, UserRole } from '../../front/services/user-admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wrap">
      <h1>User Management</h1>

      <form class="create-form" (ngSubmit)="createUser()">
        <input [(ngModel)]="draft.username" name="username" placeholder="Username" required />
        <input [(ngModel)]="draft.email" name="email" type="email" placeholder="Email" required />
        <input [(ngModel)]="draft.password" name="password" type="password" placeholder="Password" required />
        <input [(ngModel)]="draft.firstName" name="firstName" placeholder="First name" />
        <input [(ngModel)]="draft.lastName" name="lastName" placeholder="Last name" />
        <select [(ngModel)]="draft.role" name="role">
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <label class="checkbox"><input type="checkbox" [(ngModel)]="draft.enabled" name="enabled" /> enabled</label>
        <button type="submit">Create</button>
      </form>

      <p class="alert" *ngIf="alert">{{ alert }}</p>

      <div class="table">
        <div class="row header">
          <div>ID</div><div>Username</div><div>Email</div><div>Name</div><div>Role</div><div>Enabled</div><div>Actions</div>
        </div>
        <div class="row" *ngFor="let u of users">
          <div>{{ u.id }}</div>
          <div><input [(ngModel)]="u.username" /></div>
          <div><input [(ngModel)]="u.email" /></div>
          <div><input [(ngModel)]="u.firstName" placeholder="First" /> <input [(ngModel)]="u.lastName" placeholder="Last" /></div>
          <div>
            <select [(ngModel)]="u.role">
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div><input type="checkbox" [(ngModel)]="u.enabled" /></div>
          <div class="actions">
            <button
              type="button"
              (click)="updateUser(u)"
              [disabled]="updating && updatingUserId === u.id"
            >
              {{ updating && updatingUserId === u.id ? 'Updating...' : 'Update' }}
            </button>
            <button type="button" class="danger" (click)="deleteUser(u)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wrap { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .create-form {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: .5rem;
      margin-bottom: 1rem;
    }
    input, select, button { padding: .5rem .65rem; border-radius: 8px; border: 1px solid #d1d5db; box-sizing: border-box; }
    .checkbox { display: flex; align-items: center; gap: .35rem; }
    .table { border: 1px solid #e5e7eb; border-radius: 12px; overflow-x: auto; }
    .row {
      display: grid;
      grid-template-columns: 70px 1.2fr 1.7fr 1.5fr 120px 100px 170px;
      gap: .5rem;
      padding: .5rem;
      align-items: center;
      min-width: 1100px;
    }
    .row > div { min-width: 0; }
    .row input, .row select { width: 100%; }
    .header { background: #f8fafc; font-weight: 700; }
    .actions { display: flex; gap: .4rem; flex-wrap: wrap; }
    button { cursor: pointer; }
    .danger { background: #ef4444; color: #fff; border-color: #ef4444; }
    .alert { color: #065f46; }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: ManagedUser[] = [];
  alert = '';
  updating = false;
  updatingUserId: number | null = null;
  draft: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    enabled: boolean;
  } = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'USER',
    enabled: true
  };

  constructor(private readonly userAdminService: UserAdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userAdminService.list().subscribe({
      next: (users) => (this.users = users),
      error: () => (this.alert = 'Failed to load users')
    });
  }

  createUser(): void {
    this.userAdminService.create(this.draft).subscribe({
      next: () => {
        this.alert = 'User created';
        this.draft = { username: '', email: '', password: '', firstName: '', lastName: '', role: 'USER', enabled: true };
        this.loadUsers();
      },
      error: () => (this.alert = 'Create failed')
    });
  }

  updateUser(u: ManagedUser): void {
    if (!u?.id) return;
    this.updating = true;
    this.updatingUserId = u.id;
    this.userAdminService.update(u.id, {
      username: u.username,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      enabled: u.enabled
    }).subscribe({
      next: () => (this.alert = `User #${u.id} updated`),
      error: () => (this.alert = `Update failed for #${u.id}`),
      complete: () => {
        this.updating = false;
        this.updatingUserId = null;
      }
    });
  }

  deleteUser(u: ManagedUser): void {
    this.userAdminService.delete(u.id).subscribe({
      next: () => {
        this.alert = `User #${u.id} deleted`;
        this.users = this.users.filter(x => x.id !== u.id);
      },
      error: () => (this.alert = `Delete failed for #${u.id}`)
    });
  }
}

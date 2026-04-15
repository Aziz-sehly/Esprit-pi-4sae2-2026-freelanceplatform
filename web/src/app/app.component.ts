import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, pairwise, startWith } from 'rxjs';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { AppNotification } from './models/notification.model';
import { User } from './models/models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatListModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private audioContext: AudioContext | null = null;
  currentRoute = this.router.url;

  private readonly guestNavItems = [
    { label: 'Jobs', link: '/jobs' },
    { label: 'Messages', link: '/messages' },
  ];

  constructor(
    public readonly authService: AuthService,
    public readonly notificationService: NotificationService
  ) {
    this.authService.restoreSession().subscribe();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        this.currentRoute = (event as NavigationEnd).urlAfterRedirects;
      });

    this.notificationService.notifications$
      .pipe(
        startWith([]),
        pairwise(),
        filter(([previous, current]) => current.length > previous.length),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(([, current]) => {
        const latest = current[0];
        this.playNotificationSound();
        this.snackBar.open(latest.message, 'Open', {
          duration: 4500,
          panelClass: ['notification-snackbar'],
        }).onAction().subscribe(() => this.openNotification(latest));
      });
  }

  get unreadCount(): number {
    return this.notificationService.unreadCount;
  }

  get authDebug(): string {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return 'guest';
    }

    return `${user.userType}#${user.id}`;
  }

  get navItems(): Array<{ label: string; link: string }> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return this.guestNavItems;
    }

    if (user.userType === 'client') {
      return [
        { label: 'My contracts', link: '/client/contracts' },
        { label: 'Jobs', link: '/jobs' },
      ];
    }

    if (user.userType === 'freelancer') {
      return [
        { label: 'My contracts', link: '/freelancer/contracts' },
        { label: 'Jobs', link: '/jobs' },
      ];
    }

    return this.guestNavItems;
  }

  logout(): void {
    this.authService.logout();
  }

  useClientPersona(): void {
    this.authService.usePersona('client');
    void this.router.navigateByUrl('/client/contracts');
  }

  useFreelancerPersona(): void {
    this.authService.usePersona('freelancer');
    void this.router.navigateByUrl('/freelancer/contracts');
  }

  markNotificationsRead(): void {
    this.notificationService.markAllRead();
  }

  openNotification(notification: AppNotification): void {
    const target = this.resolveNotificationTarget(notification);
    void this.router.navigate(target.commands, target.extras);
  }

  private resolveNotificationTarget(notification: AppNotification): { commands: unknown[]; extras?: { queryParams?: Record<string, unknown> } } {
    const currentUser = this.authService.getCurrentUser();
    const rolePrefix = this.getContractBaseRoute(currentUser);

    if (!notification.contractId) {
      return { commands: [rolePrefix] };
    }

    if (notification.type.startsWith('DISPUTE_')) {
      return { commands: [rolePrefix, notification.contractId, 'disputes'] };
    }

    if (notification.type.startsWith('PAYMENT_')) {
      return {
        commands: [rolePrefix, notification.contractId, 'workspace'],
        extras: { queryParams: { tab: 'payments' } },
      };
    }

    if (notification.type === 'CONTRACT_CALL_STARTED') {
      return { commands: [rolePrefix, notification.contractId, 'activity'] };
    }

    if (notification.type.startsWith('MILESTONE_')) {
      return {
        commands: [rolePrefix, notification.contractId, 'workspace'],
        extras: {
          queryParams: {
            tab: 'milestones',
            milestoneId: notification.milestoneId,
          },
        },
      };
    }

    return { commands: [rolePrefix, notification.contractId, 'activity'] };
  }

  private getContractBaseRoute(user: User | null): string {
    if (user?.userType === 'freelancer') {
      return '/freelancer/contracts';
    }

    return '/client/contracts';
  }

  private playNotificationSound(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      return;
    }

    this.audioContext ??= new AudioContextCtor();

    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const startTime = this.audioContext.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(1320, startTime + 0.18);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.16, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.34);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.34);
  }
}

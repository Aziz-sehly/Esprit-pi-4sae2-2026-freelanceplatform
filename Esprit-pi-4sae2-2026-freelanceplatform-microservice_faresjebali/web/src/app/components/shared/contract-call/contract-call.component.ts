import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MessageSenderRole } from '../../../models/chat.model';
import { ContractChatService } from '../../../services/contract-chat.service';

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiApi;
  }
}

interface JitsiApi {
  dispose(): void;
  executeCommand?(command: string, ...args: unknown[]): void;
}

@Component({
  selector: 'app-contract-call',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './contract-call.component.html',
  styleUrls: ['./contract-call.component.scss'],
})
export class ContractCallComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) contractId!: number;
  @Input({ required: true }) displayName!: string;
  @Input({ required: true }) senderId!: number;
  @Input({ required: true }) senderRole!: MessageSenderRole;
  @Input() receiverName = 'Participant';
  @Input() accentClass: 'client' | 'freelancer' = 'client';

  @ViewChild('meetingHost') private readonly meetingHost?: ElementRef<HTMLDivElement>;

  open = false;
  confirmStart = false;
  initializing = false;
  error = '';
  private api: JitsiApi | null = null;
  private viewReady = false;
  private announced = false;

  constructor(private readonly chatService: ContractChatService) {}

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.open) {
      this.mountMeeting();
    }
  }

  async openCall(): Promise<void> {
    this.open = true;
    this.confirmStart = true;
    this.error = '';
  }

  async confirmCallStart(): Promise<void> {
    this.confirmStart = false;
    if (!this.announced && this.contractId && this.senderId && this.displayName) {
      this.announced = true;
      this.chatService.announceCall(this.contractId, this.senderId, this.senderRole, this.displayName).subscribe({
        error: () => {
          this.announced = false;
        },
      });
    }
    if (this.viewReady) {
      await this.mountMeeting();
    }
  }

  closeCall(): void {
    this.open = false;
    this.confirmStart = false;
    this.disposeMeeting();
  }

  ngOnDestroy(): void {
    this.disposeMeeting();
  }

  private async mountMeeting(): Promise<void> {
    if (!this.meetingHost || !this.contractId || !this.displayName || this.api || this.initializing) {
      return;
    }

    this.initializing = true;
    try {
      await this.ensureJitsiScript();
      const JitsiApiCtor = window.JitsiMeetExternalAPI;
      if (!JitsiApiCtor) {
        throw new Error('Video meeting library is unavailable.');
      }

      this.api = new JitsiApiCtor('meet.jit.si', {
        roomName: `academic-contract-${this.contractId}`,
        parentNode: this.meetingHost.nativeElement,
        width: '100%',
        height: '100%',
        userInfo: {
          displayName: this.displayName,
        },
        configOverwrite: {
          prejoinPageEnabled: true,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          MOBILE_APP_PROMO: false,
          TILE_VIEW_MAX_COLUMNS: 2,
        },
      });

      this.api.executeCommand?.('toggleTileView');
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Call could not be initialized.';
    } finally {
      this.initializing = false;
    }
  }

  private disposeMeeting(): void {
    this.api?.dispose();
    this.api = null;
    if (this.meetingHost?.nativeElement) {
      this.meetingHost.nativeElement.innerHTML = '';
    }
  }

  private ensureJitsiScript(): Promise<void> {
    if (window.JitsiMeetExternalAPI) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-jitsi-external-api="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Jitsi script failed to load.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.dataset['jitsiExternalApi'] = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Jitsi script failed to load.'));
      document.body.appendChild(script);
    });
  }
}

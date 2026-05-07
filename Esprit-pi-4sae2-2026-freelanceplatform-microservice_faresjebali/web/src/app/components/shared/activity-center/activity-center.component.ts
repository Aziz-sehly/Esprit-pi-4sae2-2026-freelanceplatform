import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { forkJoin } from 'rxjs';
import { ChatMessageResponse } from '../../../models/chat.model';
import { ContractResponse } from '../../../models/contract.model';
import { DisputeResponse } from '../../../models/dispute.model';
import { MilestoneResponse } from '../../../models/milestone.model';
import { PaymentResponse } from '../../../models/payment.model';
import { ResourceResponse } from '../../../models/resource.model';
import { ContractChatService } from '../../../services/contract-chat.service';
import { DisputeService } from '../../../services/dispute.service';
import { MilestoneService } from '../../../services/milestone.service';
import { PaymentService } from '../../../services/payment.service';
import { ResourceService } from '../../../services/resource.service';

type ActivityTone = 'neutral' | 'success' | 'warn' | 'info';

interface ActivityItem {
  id: string;
  date: string;
  title: string;
  description: string;
  category: string;
  tone: ActivityTone;
}

@Component({
  selector: 'app-activity-center',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
  ],
  templateUrl: './activity-center.component.html',
  styleUrls: ['./activity-center.component.scss'],
})
export class ActivityCenterComponent implements OnChanges {
  @Input({ required: true }) contract!: ContractResponse;
  @Input() accentClass: 'client' | 'freelancer' = 'client';
  @Input() backLink = '/';
  @Input() backLabel = 'Back';

  loading = false;
  error = '';
  items: ActivityItem[] = [];

  constructor(
    private readonly milestoneService: MilestoneService,
    private readonly paymentService: PaymentService,
    private readonly disputeService: DisputeService,
    private readonly resourceService: ResourceService,
    private readonly chatService: ContractChatService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contract'] && this.contract?.id) {
      this.load();
    }
  }

  load(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      milestones: this.milestoneService.listByContractId(this.contract.id),
      payments: this.paymentService.listByContractId(this.contract.id),
      disputes: this.disputeService.list(this.contract.id),
      contractResources: this.resourceService.list('CONTRACT', this.contract.id),
      chatMessages: this.chatService.history(this.contract.id),
    }).subscribe({
      next: ({ milestones, payments, disputes, contractResources, chatMessages }) => {
        this.loading = false;
        this.items = this.buildItems(
          milestones ?? [],
          payments ?? [],
          disputes ?? [],
          contractResources ?? [],
          chatMessages ?? []
        );
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Activity timeline could not be loaded.';
      },
    });
  }

  trackById(_index: number, item: ActivityItem): string {
    return item.id;
  }

  private buildItems(
    milestones: MilestoneResponse[],
    payments: PaymentResponse[],
    disputes: DisputeResponse[],
    contractResources: ResourceResponse[],
    chatMessages: ChatMessageResponse[]
  ): ActivityItem[] {
    const items: ActivityItem[] = [
      {
        id: `contract-created-${this.contract.id}`,
        date: this.contract.createdAt,
        title: 'Contract created',
        description: `${this.contract.clientName} created the contract for ${this.contract.freelancerName}.`,
        category: 'Contract',
        tone: 'neutral',
      },
      {
        id: `contract-status-${this.contract.id}`,
        date: this.contract.respondedAt || this.contract.updatedAt,
        title: `Contract ${this.contract.status.toLowerCase().replaceAll('_', ' ')}`,
        description: `Current contract status is ${this.contract.status}.`,
        category: 'Contract',
        tone: this.contract.status === 'ACTIVE' || this.contract.status === 'COMPLETED' ? 'success' : 'info',
      },
      ...contractResources.map((resource) => ({
        id: `resource-${resource.id}`,
        date: resource.createdAt,
        title: `Contract resource added`,
        description: `${resource.label} was attached as a ${resource.resourceType.toLowerCase()} resource.`,
        category: 'Resources',
        tone: 'info' as ActivityTone,
      })),
      ...milestones.flatMap((milestone) => this.milestoneActivities(milestone)),
      ...payments.map((payment) => ({
        id: `payment-${payment.id}`,
        date: payment.releasedAt || payment.refundedAt || payment.createdAt,
        title: `Payment ${payment.status.toLowerCase().replaceAll('_', ' ')}`,
        description: `Payment #${payment.id} for milestone #${payment.milestoneId ?? 'N/A'} is ${payment.status.toLowerCase().replaceAll('_', ' ')}.`,
        category: 'Payments',
        tone: (payment.status === 'RELEASED' ? 'success' : payment.status.includes('REFUND') || payment.status === 'FAILED' ? 'warn' : 'info') as ActivityTone,
      })),
      ...disputes.map((dispute) => ({
        id: `dispute-${dispute.id}`,
        date: dispute.updatedAt,
        title: `Dispute ${dispute.status.toLowerCase().replaceAll('_', ' ')}`,
        description: `${dispute.openedByName} opened "${dispute.title}" (${dispute.reason.toLowerCase().replaceAll('_', ' ')}).`,
        category: 'Disputes',
        tone: (dispute.status === 'RESOLVED' ? 'success' : dispute.status === 'REJECTED' ? 'neutral' : 'warn') as ActivityTone,
      })),
      ...chatMessages
        .filter((message) => !!message.attachmentLabel || !!message.content)
        .map((message) => ({
          id: `chat-${message.id}`,
          date: message.sentAt,
          title: message.attachmentLabel === 'Join video call' ? 'Video call started' : 'Chat update',
          description:
            message.attachmentLabel === 'Join video call'
              ? `${message.senderName} started a live contract call.`
              : `${message.senderName}: ${message.content ?? message.attachmentLabel ?? 'Shared an update.'}`,
          category: message.attachmentLabel === 'Join video call' ? 'Calls' : 'Chat',
          tone: (message.attachmentLabel === 'Join video call' ? 'info' : 'neutral') as ActivityTone,
        })),
    ];

    return items
      .filter((item) => !!item.date)
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  }

  private milestoneActivities(milestone: MilestoneResponse): ActivityItem[] {
    const items: ActivityItem[] = [
      {
        id: `milestone-created-${milestone.id}`,
        date: milestone.createdAt,
        title: 'Milestone created',
        description: `${milestone.title} was added with a value of ${milestone.amount}.`,
        category: 'Milestones',
        tone: 'neutral',
      },
    ];

    if (milestone.submittedAt) {
      items.push({
        id: `milestone-submitted-${milestone.id}`,
        date: milestone.submittedAt,
        title: 'Milestone submitted',
        description: `${milestone.title} was submitted for review.`,
        category: 'Milestones',
        tone: 'info',
      });
    }

    if (milestone.lastFeedback && milestone.status === 'REVISION_REQUESTED') {
      items.push({
        id: `milestone-revision-${milestone.id}`,
        date: milestone.statusUpdatedAt || milestone.createdAt,
        title: 'Revision requested',
        description: milestone.lastFeedback,
        category: 'Milestones',
        tone: 'warn',
      });
    }

    if (milestone.clientApprovedAt) {
      items.push({
        id: `milestone-approved-${milestone.id}`,
        date: milestone.clientApprovedAt,
        title: 'Milestone approved',
        description: `${milestone.title} was approved by the client.`,
        category: 'Milestones',
        tone: 'success',
      });
    }

    if (milestone.fundedAt) {
      items.push({
        id: `milestone-funded-${milestone.id}`,
        date: milestone.fundedAt,
        title: 'Milestone funded',
        description: `${milestone.title} moved into the funded state.`,
        category: 'Payments',
        tone: 'info',
      });
    }

    if (milestone.paidAt) {
      items.push({
        id: `milestone-paid-${milestone.id}`,
        date: milestone.paidAt,
        title: 'Milestone paid',
        description: `${milestone.title} was fully paid out.`,
        category: 'Payments',
        tone: 'success',
      });
    }

    return items;
  }
}

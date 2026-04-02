import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  FreelancerProposalStats,
  FreelancerStatsDTO,
  ProjectProposal,
  ProposalApi,
  ProposalStatus,
  RankedProposalDTO,
  CounterOfferRequest,
  Status,
  CounterOffer
} from '../models/models';
import { ProjectService } from './project.service';

export interface CoverLetterRequest {
  freelancerSkills:    string;
  projectTitle:        string;
  projectDescription:  string;
  projectCategory:     string;
  projectBudgetMin:    number;
  projectBudgetMax:    number;
  projectDuration:     string;
}

export interface CoverLetterResponse {
  coverLetter: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectProposalService {

  private readonly baseUrl        = 'http://localhost:8765/proposal';
  private readonly projectBaseUrl = 'http://localhost:8765/project';

  constructor(
    private readonly http: HttpClient,
    private readonly projectService: ProjectService
  ) {}

  // ── AI COVER LETTER ───────────────────────────────────────────────────────
  generateCoverLetter(req: CoverLetterRequest): Observable<CoverLetterResponse> {
    return this.http.post<CoverLetterResponse>(
      `${this.baseUrl}/ai-cover-letter`,
      req
    ).pipe(
      catchError((err) => {
        console.warn('AI cover letter failed:', err?.message ?? err);
        return of({ coverLetter: '' });
      })
    );
  }

  // ── NOTIFY CLIENT ─────────────────────────────────────────────────────────
  notifyClient(data: {
    projectId:      number;
    proposedBudget: number;
    deliveryDays:   number;
    coverLetter:    string;
  }): Observable<string> {
    return this.http.post(
      `${this.projectBaseUrl}/notify/new-proposal`,
      data,
      { responseType: 'text' }
    ).pipe(
      catchError((err) => {
        console.warn('Email notification failed (non-blocking):', err?.message ?? err);
        return of('failed');
      })
    );
  }

  // ── DTO → UI ──────────────────────────────────────────────────────────────
private dtoToProposal(dto: any): ProjectProposal {
  const raw = dto ?? {};
  const deliveryDays = Number(raw.deliveryDays ?? raw.delivery_days ?? 0);

  return {
    id:                Number(raw.id),
    projectId:         Number(raw.projectId ?? raw.project_id ?? 0),
    freelancerId:      Number(raw.freelancerId ?? raw.freelancer_id ?? 0),
    coverLetter:       String(raw.coverLetter ?? raw.cover_letter ?? ''),
    proposedBudget:    Number(raw.proposedPrice ?? raw.proposed_price ?? 0),
    estimatedDuration: deliveryDays ? `${deliveryDays} day(s)` : (raw.estimatedDuration ?? ''),
    status:            this.normalizeStatus(raw.status),
    submittedAt:       raw.createdAt ? new Date(raw.createdAt) : new Date(),
    expiresAt:         raw.expiresAt ? new Date(raw.expiresAt) : undefined,
    deliveryDays:      deliveryDays || undefined,
    isInvited:         Boolean(raw.isInvited ?? raw.is_invited),
    revisionsOffered:  Number(raw.revisionsOffered ?? raw.revisions_offered ?? 0),
    // Champs de contre-offre
    counterOfferPrice: raw.counterOfferPrice ?? raw.counter_offer_price ?? undefined,
    counterOfferMessage: raw.counterOfferMessage ?? raw.counter_offer_message ?? undefined,
    counterOfferAt: raw.counterOfferAt ? new Date(raw.counterOfferAt) : 
                    (raw.counter_offer_at ? new Date(raw.counter_offer_at) : undefined)
  };
}

  private normalizeCounterOfferStatus(value: any): 'PENDING' | 'ACCEPTED' | 'REJECTED' {
    const v = String(value ?? '').toUpperCase();
    if (v === 'PENDING' || v === 'ACCEPTED' || v === 'REJECTED') {
      return v as any;
    }
    return 'PENDING';
  }

  private normalizeStatus(value: any): ProposalStatus {
    const v = String(value ?? '').toUpperCase();
    if (['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED', 'NEGOTIATING'].includes(v))
      return v as ProposalStatus;
    return 'PENDING';
  }

  // ── UI → payload API ──────────────────────────────────────────────────────
  // Mettre à jour l'interface du payload
private toPayload(p: Partial<ProjectProposal>): ProposalApi | Partial<ProposalApi> {
  const deliveryDays =
    p.deliveryDays ?? ((typeof p.estimatedDuration === 'string'
      ? parseInt(p.estimatedDuration, 10) : 0) || 0);
  return {
    projectId:        p.projectId!,
    freelancerId:     p.freelancerId!,
    proposedPrice:    p.proposedBudget ?? (p as any).proposedPrice ?? 0,
    deliveryDays:     Number(deliveryDays) || 0,
    coverLetter:      p.coverLetter ?? '',
    status:           p.status ?? 'PENDING',
    isInvited:        p.isInvited ?? false,
    revisionsOffered: p.revisionsOffered ?? 0  // Ajouter cette ligne
  };
}
  // ── CRUD ──────────────────────────────────────────────────────────────────
  getByProject(projectId: number, sort?: 'priceDesc' | 'durationDesc'): Observable<ProjectProposal[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetProposalsByProject/${projectId}`).pipe(
      map((list) => (Array.isArray(list) ? list : []).map((dto) => this.dtoToProposal(dto))),
      map((items) => {
        if (sort === 'priceDesc')
          return [...items].sort((a, b) => b.proposedBudget - a.proposedBudget);
        if (sort === 'durationDesc')
          return [...items].sort((a, b) => (b.deliveryDays ?? 0) - (a.deliveryDays ?? 0));
        return items;
      }),
      catchError(() => of([]))
    );
  }

  getByFreelancer(freelancerId: number): Observable<ProjectProposal[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetProposalsByFreelancer/${freelancerId}`).pipe(
      map((list) => (Array.isArray(list) ? list : []).map((dto) => this.dtoToProposal(dto))),
      catchError(() => of([]))
    );
  }

  getAllProposals(): Observable<ProjectProposal[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetAllProposals`).pipe(
      map((list) => (Array.isArray(list) ? list : []).map((dto) => this.dtoToProposal(dto))),
      catchError(() => of([]))
    );
  }

  getProposalsForClient(clientId: number): Observable<ProjectProposal[]> {
    return this.projectService.getByClient(clientId, 1, 500).pipe(
      switchMap((res) => {
        const projectIds = res.items.map((p) => p.id);
        if (projectIds.length === 0) return of([]);
        return this.http.get<any[]>(`${this.baseUrl}/GetAllProposals`).pipe(
          map((list) => (Array.isArray(list) ? list : []).map((dto) => this.dtoToProposal(dto))),
          map((all) => all.filter((p) => projectIds.includes(p.projectId)))
        );
      }),
      catchError(() => of([]))
    );
  }

  getById(id: number): Observable<ProjectProposal | undefined> {
    return this.http.get<any>(`${this.baseUrl}/GetProposal/${id}`).pipe(
      map((dto) => this.dtoToProposal(dto)),
      catchError(() => of(undefined))
    );
  }

  create(input: Omit<ProjectProposal, 'id' | 'status' | 'submittedAt'> & { revisionsOffered?: number }): Observable<ProjectProposal> {
  const payload = this.toPayload(input) as ProposalApi;
  return this.http.post<any>(`${this.baseUrl}/AddProposal`, payload).pipe(
    map((dto) => this.dtoToProposal(dto)),
    catchError((err) => {
      console.error('AddProposal error:', err);
      throw err;
    })
  );
}

  update(id: number, patch: Partial<ProjectProposal>): Observable<ProjectProposal | undefined> {
    return this.getById(id).pipe(
      switchMap((existing) => {
        if (!existing) return of(undefined);
        const payload = this.toPayload({ ...existing, ...patch }) as ProposalApi;
        payload.id = id;
        return this.http.put<any>(`${this.baseUrl}/UpdateProposal/${id}`, payload).pipe(
          map((dto) => this.dtoToProposal(dto)),
          catchError(() => of(undefined))
        );
      })
    );
  }

  delete(id: number): Observable<boolean> {
    return this.http.delete<void>(`${this.baseUrl}/DeleteProposal/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  accept(proposalId: number): Observable<ProjectProposal | undefined> {
    return this.update(proposalId, { status: 'ACCEPTED' }).pipe(
      switchMap((proposal) => {
        if (!proposal) return of(undefined);
        return this.projectService.update(proposal.projectId, { status: Status.ARCHIVED }).pipe(
          map(() => proposal),
          catchError(() => of(proposal))
        );
      })
    );
  }

  reject(proposalId: number): Observable<ProjectProposal | undefined> {
    return this.update(proposalId, { status: 'REJECTED' });
  }

  cancel(proposalId: number): Observable<ProjectProposal | undefined> {
    return this.update(proposalId, { status: 'REJECTED' });
  }

  withdraw(proposalId: number): Observable<ProjectProposal | undefined> {
    return this.update(proposalId, { status: 'WITHDRAWN' });
  }

  hide(proposalId: number): Observable<ProjectProposal | undefined> {
    return this.update(proposalId, { hiddenByClient: true } as Partial<ProjectProposal>);
  }

  getFreelancerStats(freelancerId: number): Observable<FreelancerProposalStats> {
    return this.getByFreelancer(freelancerId).pipe(
      map((my) => {
        const accepted = my.filter((p) => p.status === 'ACCEPTED').length;
        const total    = my.length;
        return {
          freelancerId,
          totalProposals:    total,
          acceptedProposals: accepted,
          acceptanceRate:    total ? accepted / total : 0
        };
      }),
      catchError(() => of({
        freelancerId,
        totalProposals: 0,
        acceptedProposals: 0,
        acceptanceRate: 0
      }))
    );
  }

  // ========================= NOUVEAUX ENDPOINTS =========================

  getFreelancerStatsDetailed(freelancerId: number): Observable<FreelancerStatsDTO> {
    return this.http.get<FreelancerStatsDTO>(`${this.baseUrl}/stats/freelancer/${freelancerId}`).pipe(
      catchError((err) => {
        console.error('Error fetching freelancer stats:', err);
        return of({
          freelancerId: freelancerId,
          totalProposals: 0,
          acceptedProposals: 0,
          rejectedProposals: 0,
          pendingProposals: 0,
          acceptanceRate: 0,
          avgProposedPrice: 0,
          avgDeliveryDays: 0,
          avgResponseTimeHours: 0
        } as FreelancerStatsDTO);
      })
    );
  }

  getRankedProposals(projectId: number): Observable<RankedProposalDTO[]> {
    return this.http.get<RankedProposalDTO[]>(`${this.baseUrl}/ranked/${projectId}`).pipe(
      map((rankedList) => {
        if (!rankedList) return [];
        return rankedList.map(item => ({
          ...item,
          proposal: this.dtoToProposal(item.proposal)
        }));
      }),
      catchError((err) => {
        console.error('Error fetching ranked proposals:', err);
        return of([]);
      })
    );
  }

  makeCounterOffer(id: number, request: CounterOfferRequest): Observable<ProjectProposal> {
    return this.http.post<ProjectProposal>(`${this.baseUrl}/${id}/counter-offer`, request).pipe(
      map((dto) => this.dtoToProposal(dto)),
      catchError((err) => {
        console.error('Error making counter-offer:', err);
        throw err;
      })
    );
  }

  acceptCounterOffer(id: number): Observable<ProjectProposal> {
    return this.http.put<ProjectProposal>(`${this.baseUrl}/${id}/counter-offer/accept`, {}).pipe(
      map((dto) => this.dtoToProposal(dto)),
      catchError((err) => {
        console.error('Error accepting counter-offer:', err);
        throw err;
      })
    );
  }

  rejectCounterOffer(id: number): Observable<ProjectProposal> {
    return this.http.put<ProjectProposal>(`${this.baseUrl}/${id}/counter-offer/reject`, {}).pipe(
      map((dto) => this.dtoToProposal(dto)),
      catchError((err) => {
        console.error('Error rejecting counter-offer:', err);
        throw err;
      })
    );
  }
  
}

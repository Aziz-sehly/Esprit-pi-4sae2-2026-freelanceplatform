import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Proposal } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ProposalService {
  private mockProposals: Proposal[] = [
    {
      id: '1',
      jobId: '1',
      freelancerId: 'f1',
      coverLetter: 'I am very interested in this position. I have 5+ years of experience with React and Node.js...',
      proposedRate: 4500,
      estimatedDuration: '2 months',
      status: 'pending',
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      freelancerInfo: {
        name: 'Sarah Johnson',
        title: 'Full Stack Developer',
        rating: 4.9,
        totalJobs: 47,
        profileImage: 'https://i.pravatar.cc/150?img=5'
      }
    }
  ];

  submitProposal(proposal: Partial<Proposal>): Observable<Proposal> {
    const newProposal: Proposal = {
      ...(proposal as Proposal),
      id: Math.random().toString(36).substring(7),
      status: 'pending',
      submittedAt: new Date()
    };

    this.mockProposals.push(newProposal);
    return of(newProposal).pipe(delay(500));
  }

  getProposalsByJob(jobId: string): Observable<Proposal[]> {
    const proposals = this.mockProposals.filter(p => p.jobId === jobId);
    return of(proposals).pipe(delay(300));
  }

  getProposalsByFreelancer(freelancerId: string): Observable<Proposal[]> {
    const proposals = this.mockProposals.filter(p => p.freelancerId === freelancerId);
    return of(proposals).pipe(delay(300));
  }

  updateProposalStatus(proposalId: string, status: Proposal['status']): Observable<Proposal> {
    const proposal = this.mockProposals.find(p => p.id === proposalId);
    if (proposal) {
      proposal.status = status;
    }
    return of(proposal!).pipe(delay(300));
  }
}

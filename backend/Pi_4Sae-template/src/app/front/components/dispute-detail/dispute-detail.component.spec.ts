import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { DisputeDetailComponent } from './dispute-detail.component';
import { DisputeService } from '../../services/dispute.service';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message.service';
import {
  Dispute,
  DisputeDetailsResponse,
  DisputeInsightsResponse,
  Evidence
} from '../../models/communication';

describe('DisputeDetailComponent', () => {
  let disputeServiceSpy: jasmine.SpyObj<DisputeService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;

  const mockDispute = (): Dispute => ({
    id: 1,
    contractId: 42,
    raisedByUserId: 5,
    disputeType: 'OTHER',
    reason: 'Test reason',
    status: 'OPEN',
    createdAt: '2025-01-01T10:00:00Z',
    deadlineAt: '2025-01-08T10:00:00Z'
  });

  const mockDetails = (): DisputeDetailsResponse => ({
    dispute: mockDispute(),
    relatedMessages: []
  });

  const mockInsights = (): DisputeInsightsResponse => ({
    slaBreachProbability: 0.25,
    escalationScore: 0.4,
    duplicateMaxSimilarity: 0.1,
    duplicateCandidates: [],
    evidenceStrength: [{ evidenceId: 10, score: 0.85, label: 'STRONG' }],
    raisedByTrust: { posteriorMean: 0.55, confidence: 0.4, resolvedSamples: 2 }
  });

  const mockEvidence = (): Evidence[] => [
    {
      id: 10,
      disputeId: 1,
      uploaderUserId: 5,
      fileUrl: '/messages/attachments/x.png',
      fileName: 'x.png',
      category: 'OTHER',
      createdAt: '2025-01-02T10:00:00Z'
    }
  ];

  beforeEach(() => {
    disputeServiceSpy = jasmine.createSpyObj<DisputeService>('DisputeService', [
      'getDetails',
      'listEvidence',
      'listAudit',
      'getInsights'
    ]);
    disputeServiceSpy.getDetails.and.returnValue(of(mockDetails()));
    disputeServiceSpy.listEvidence.and.returnValue(of(mockEvidence()));
    disputeServiceSpy.listAudit.and.returnValue(of([]));
    disputeServiceSpy.getInsights.and.returnValue(of(mockInsights()));

    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'hasRole',
      'getCurrentUser',
      'getPublicUser',
      'getNumericUserId'
    ]);
    authServiceSpy.getPublicUser.and.returnValue(of({ id: 5, username: 'raiser' }));
    authServiceSpy.getNumericUserId.and.returnValue(99);

    messageServiceSpy = jasmine.createSpyObj<MessageService>('MessageService', ['uploadFile']);
  });

  async function configureModule(isAdmin: boolean): Promise<void> {
    await TestBed.resetTestingModule();
    authServiceSpy.hasRole.and.returnValue(isAdmin);
    authServiceSpy.getCurrentUser.and.returnValue(null);

    TestBed.configureTestingModule({
      imports: [DisputeDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? '1' : null)
              },
              queryParamMap: {
                get: () => null
              }
            }
          }
        },
        { provide: DisputeService, useValue: disputeServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MessageService, useValue: messageServiceSpy }
      ]
    });
    await TestBed.compileComponents();
  }

  it('admin: charge les insights et affiche la carte Advanced Insights', async () => {
    await configureModule(true);
    const fixture = TestBed.createComponent(DisputeDetailComponent);
    fixture.detectChanges();

    expect(disputeServiceSpy.getInsights).toHaveBeenCalledWith(1);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.insights-card')).toBeTruthy();
    expect(el.textContent).toContain('Advanced Insights');
    expect(el.textContent).toContain('Evidence strength index');
    fixture.destroy();
  });

  it('non-admin: ne charge pas les insights et masque la carte', async () => {
    await configureModule(false);
    const fixture = TestBed.createComponent(DisputeDetailComponent);
    fixture.detectChanges();

    expect(disputeServiceSpy.getInsights).not.toHaveBeenCalled();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.insights-card')).toBeNull();
    fixture.destroy();
  });

  it('jumpToEvidence: scroll, surbrillance puis retrait après délai', fakeAsync(() => {
    TestBed.resetTestingModule();
    authServiceSpy.hasRole.and.returnValue(true);
    authServiceSpy.getCurrentUser.and.returnValue(null);
    TestBed.configureTestingModule({
      imports: [DisputeDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (key: string) => (key === 'id' ? '1' : null) },
              queryParamMap: { get: () => null }
            }
          }
        },
        { provide: DisputeService, useValue: disputeServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MessageService, useValue: messageServiceSpy }
      ]
    });

    const fixture = TestBed.createComponent(DisputeDetailComponent);
    const scrollIntoView = jasmine.createSpy('scrollIntoView');
    const fakeEl = document.createElement('div');
    fakeEl.id = 'evidence-card-10';
    (fakeEl as HTMLElement).scrollIntoView = scrollIntoView;
    spyOn(document, 'getElementById').and.returnValue(fakeEl);

    fixture.detectChanges();
    expect(fixture.componentInstance.highlightedEvidenceId).toBeNull();

    fixture.componentInstance.jumpToEvidence(10);

    expect(document.getElementById).toHaveBeenCalledWith('evidence-card-10');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(fixture.componentInstance.highlightedEvidenceId).toBe(10);

    tick(2200);
    expect(fixture.componentInstance.highlightedEvidenceId).toBeNull();
    fixture.destroy();
  }));

  it('clic sur une puce Evidence strength appelle jumpToEvidence', async () => {
    await configureModule(true);
    const fixture = TestBed.createComponent(DisputeDetailComponent);
    const cmp = fixture.componentInstance;
    spyOn(cmp, 'jumpToEvidence');

    fixture.detectChanges();

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button.chip-link');
    expect(buttons.length).toBeGreaterThan(0);
    (buttons[0] as HTMLButtonElement).click();

    expect(cmp.jumpToEvidence).toHaveBeenCalledWith(10);
    fixture.destroy();
  });

  it('evidenceLabelDescription: libellés STRONG / WEAK', async () => {
    await configureModule(false);
    const fixture = TestBed.createComponent(DisputeDetailComponent);
    expect(fixture.componentInstance.evidenceLabelDescription('STRONG')).toBe('Clear and actionable proof');
    expect(fixture.componentInstance.evidenceLabelDescription('WEAK')).toBe('Limited proof quality');
    fixture.destroy();
  });
});

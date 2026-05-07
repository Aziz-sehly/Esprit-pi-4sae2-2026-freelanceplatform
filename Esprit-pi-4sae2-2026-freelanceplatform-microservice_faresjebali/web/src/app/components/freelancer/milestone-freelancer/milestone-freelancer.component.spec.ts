import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MilestoneFreelancerComponent } from './milestone-freelancer.component';

describe('MilestoneFreelancerComponent', () => {
  let component: MilestoneFreelancerComponent;
  let fixture: ComponentFixture<MilestoneFreelancerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MilestoneFreelancerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MilestoneFreelancerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

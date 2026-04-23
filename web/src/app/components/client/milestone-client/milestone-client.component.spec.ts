import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MilestoneClientComponent } from './milestone-client.component';

describe('MilestoneClientComponent', () => {
  let component: MilestoneClientComponent;
  let fixture: ComponentFixture<MilestoneClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MilestoneClientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MilestoneClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

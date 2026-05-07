import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentClientComponent } from './payment-client.component';

describe('PaymentClientComponent', () => {
  let component: PaymentClientComponent;
  let fixture: ComponentFixture<PaymentClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentClientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

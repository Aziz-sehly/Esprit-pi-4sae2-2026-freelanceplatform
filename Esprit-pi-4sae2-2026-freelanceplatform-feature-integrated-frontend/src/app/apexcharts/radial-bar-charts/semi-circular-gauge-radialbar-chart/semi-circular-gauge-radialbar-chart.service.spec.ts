import { TestBed } from '@angular/core/testing';

import { SemiCircularGaugeRadialbarChartService } from './semi-circular-gauge-radialbar-chart.service';

describe('SemiCircularGaugeRadialbarChartService', () => {
  let service: SemiCircularGaugeRadialbarChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SemiCircularGaugeRadialbarChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

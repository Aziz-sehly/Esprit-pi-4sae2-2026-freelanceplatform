import { TestBed } from '@angular/core/testing';

import { StrockedCircularGaugeRadialbarChartService } from './strocked-circular-gauge-radialbar-chart.service';

describe('StrockedCircularGaugeRadialbarChartService', () => {
  let service: StrockedCircularGaugeRadialbarChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StrockedCircularGaugeRadialbarChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

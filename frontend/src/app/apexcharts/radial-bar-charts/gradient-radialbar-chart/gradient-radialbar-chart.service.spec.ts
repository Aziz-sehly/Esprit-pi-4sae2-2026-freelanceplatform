import { TestBed } from '@angular/core/testing';

import { GradientRadialbarChartService } from './gradient-radialbar-chart.service';

describe('GradientRadialbarChartService', () => {
  let service: GradientRadialbarChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GradientRadialbarChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

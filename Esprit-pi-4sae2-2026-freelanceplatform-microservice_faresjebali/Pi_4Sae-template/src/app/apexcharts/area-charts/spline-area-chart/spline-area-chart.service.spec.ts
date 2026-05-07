import { TestBed } from '@angular/core/testing';

import { SplineAreaChartService } from './spline-area-chart.service';

describe('SplineAreaChartService', () => {
  let service: SplineAreaChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SplineAreaChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

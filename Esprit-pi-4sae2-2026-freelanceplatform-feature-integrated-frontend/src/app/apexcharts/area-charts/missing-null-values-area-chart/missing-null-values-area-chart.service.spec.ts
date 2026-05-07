import { TestBed } from '@angular/core/testing';

import { MissingNullValuesAreaChartService } from './missing-null-values-area-chart.service';

describe('MissingNullValuesAreaChartService', () => {
  let service: MissingNullValuesAreaChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MissingNullValuesAreaChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

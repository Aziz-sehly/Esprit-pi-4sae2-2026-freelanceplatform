import { TestBed } from '@angular/core/testing';

import { NegativeValuesAreaChartService } from './negative-values-area-chart.service';

describe('NegativeValuesAreaChartService', () => {
  let service: NegativeValuesAreaChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NegativeValuesAreaChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

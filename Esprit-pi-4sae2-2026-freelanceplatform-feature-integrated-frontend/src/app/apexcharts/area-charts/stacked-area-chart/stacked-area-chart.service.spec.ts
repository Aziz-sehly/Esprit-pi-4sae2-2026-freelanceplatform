import { TestBed } from '@angular/core/testing';

import { StackedAreaChartService } from './stacked-area-chart.service';

describe('StackedAreaChartService', () => {
  let service: StackedAreaChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StackedAreaChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

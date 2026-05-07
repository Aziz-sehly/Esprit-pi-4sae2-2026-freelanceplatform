import { TestBed } from '@angular/core/testing';

import { BasicAreaChartService } from './basic-area-chart.service';

describe('BasicAreaChartService', () => {
  let service: BasicAreaChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BasicAreaChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

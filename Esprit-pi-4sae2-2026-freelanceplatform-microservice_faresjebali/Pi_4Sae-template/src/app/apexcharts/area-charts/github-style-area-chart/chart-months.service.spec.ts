import { TestBed } from '@angular/core/testing';

import { ChartMonthsService } from './chart-months.service';

describe('ChartMonthsService', () => {
  let service: ChartMonthsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChartMonthsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { ChartYearsService } from './chart-years.service';

describe('ChartYearsService', () => {
  let service: ChartYearsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChartYearsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { MultipleRadialbarChartService } from './multiple-radialbar-chart.service';

describe('MultipleRadialbarChartService', () => {
  let service: MultipleRadialbarChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MultipleRadialbarChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

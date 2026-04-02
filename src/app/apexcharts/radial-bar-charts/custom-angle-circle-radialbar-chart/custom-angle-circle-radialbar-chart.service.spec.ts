import { TestBed } from '@angular/core/testing';

import { CustomAngleCircleRadialbarChartService } from './custom-angle-circle-radialbar-chart.service';

describe('CustomAngleCircleRadialbarChartService', () => {
  let service: CustomAngleCircleRadialbarChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomAngleCircleRadialbarChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

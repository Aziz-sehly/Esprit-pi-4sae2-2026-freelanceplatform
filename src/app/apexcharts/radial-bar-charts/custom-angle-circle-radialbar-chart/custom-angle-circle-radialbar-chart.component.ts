import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CustomAngleCircleRadialbarChartService } from './custom-angle-circle-radialbar-chart.service';

@Component({
    selector: 'app-custom-angle-circle-radialbar-chart',
    imports: [MatCardModule],
    templateUrl: './custom-angle-circle-radialbar-chart.component.html',
    styleUrl: './custom-angle-circle-radialbar-chart.component.scss'
})
export class CustomAngleCircleRadialbarChartComponent {

    constructor(
        private customAngleCircleRadialbarChartService: CustomAngleCircleRadialbarChartService
    ) {}

    ngOnInit(): void {
        this.customAngleCircleRadialbarChartService.loadChart();
    }

}
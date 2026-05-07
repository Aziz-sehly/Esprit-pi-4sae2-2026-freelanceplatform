import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { StackedAreaChartService } from './stacked-area-chart.service';

@Component({
    selector: 'app-stacked-area-chart',
    imports: [MatCardModule],
    templateUrl: './stacked-area-chart.component.html',
    styleUrl: './stacked-area-chart.component.scss'
})
export class StackedAreaChartComponent {

    constructor(
        private stackedAreaChartService: StackedAreaChartService
    ) {}

    ngOnInit(): void {
        this.stackedAreaChartService.loadChart();
    }

}
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ChartMonthsService } from './chart-months.service';
import { ChartYearsService } from './chart-years.service';

@Component({
    selector: 'app-github-style-area-chart',
    imports: [MatCardModule],
    templateUrl: './github-style-area-chart.component.html',
    styleUrl: './github-style-area-chart.component.scss'
})
export class GithubStyleAreaChartComponent {

    constructor(
        private chartMonthsService: ChartMonthsService,
        private chartYearsService: ChartYearsService
    ) {}

    ngOnInit(): void {
        this.chartMonthsService.loadChart();
        this.chartYearsService.loadChart();
    }

}
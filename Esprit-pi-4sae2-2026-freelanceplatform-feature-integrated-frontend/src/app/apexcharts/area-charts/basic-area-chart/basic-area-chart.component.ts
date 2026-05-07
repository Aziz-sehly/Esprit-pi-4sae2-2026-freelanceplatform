import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { BasicAreaChartService } from './basic-area-chart.service';

@Component({
    selector: 'app-basic-area-chart',
    imports: [MatCardModule],
    templateUrl: './basic-area-chart.component.html',
    styleUrl: './basic-area-chart.component.scss'
})
export class BasicAreaChartComponent {

    constructor(
        private basicAreaChartService: BasicAreaChartService
    ) {}

    ngOnInit(): void {
        this.basicAreaChartService.loadChart();
    }

}
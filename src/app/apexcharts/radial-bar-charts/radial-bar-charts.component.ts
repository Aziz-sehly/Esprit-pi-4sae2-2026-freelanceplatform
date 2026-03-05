import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BasicRadialbarChartComponent } from './basic-radialbar-chart/basic-radialbar-chart.component';
import { MultipleRadialbarChartComponent } from './multiple-radialbar-chart/multiple-radialbar-chart.component';
import { GradientRadialbarChartComponent } from './gradient-radialbar-chart/gradient-radialbar-chart.component';

@Component({
    selector: 'app-radial-bar-charts',
    imports: [RouterLink, BasicRadialbarChartComponent, MultipleRadialbarChartComponent, GradientRadialbarChartComponent],
    templateUrl: './radial-bar-charts.component.html',
    styleUrl: './radial-bar-charts.component.scss'
})
export class RadialBarChartsComponent {}
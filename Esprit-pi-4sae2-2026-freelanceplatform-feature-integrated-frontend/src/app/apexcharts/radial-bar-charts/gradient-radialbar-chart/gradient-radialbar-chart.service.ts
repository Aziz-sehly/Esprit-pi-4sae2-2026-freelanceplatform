import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class GradientRadialbarChartService {

    private isBrowser: boolean;

    constructor(@Inject(PLATFORM_ID) private platformId: any) {
        this.isBrowser = isPlatformBrowser(this.platformId);
    }

    async loadChart(): Promise<void> {
        if (this.isBrowser) {
            try {
                // Dynamically import ApexCharts
                const ApexCharts = (await import('apexcharts')).default;

                // Define chart options
                const options = {
                    series: [75],
                    chart: {
                        height: 350,
                        type: "radialBar",
                        toolbar: {
                            show: true
                        }
                    },
                    plotOptions: {
                        radialBar: {
                            startAngle: -135,
                            endAngle: 225,
                            hollow: {
                                margin: 0,
                                size: "70%",
                                background: "#fff",
                                image: undefined,
                                position: "front",
                                dropShadow: {
                                    enabled: true,
                                    top: 3,
                                    left: 0,
                                    blur: 4,
                                    opacity: 0.24
                                }
                            },
                            track: {
                                background: "#fff",
                                strokeWidth: "67%",
                                margin: 0, // margin is in pixels
                                dropShadow: {
                                    enabled: true,
                                    top: -3,
                                    left: 0,
                                    blur: 4,
                                    opacity: 0.35
                                }
                            },
                            dataLabels: {
                                show: true,
                                name: {
                                    offsetY: -10,
                                    show: true,
                                    color: "#888",
                                    fontSize: "17px"
                                },
                                value: {
                                    formatter: function(val:any) {
                                        return parseInt(val.toString(), 10).toString();
                                    },
                                    color: "#111",
                                    fontSize: "36px",
                                    show: true
                                }
                            }
                        }
                    },
                    fill: {
                        type: "gradient",
                        gradient: {
                            shade: "dark",
                            type: "horizontal",
                            shadeIntensity: 0.5,
                            gradientToColors: ["#ABE5A1"],
                            inverseColors: true,
                            opacityFrom: 1,
                            opacityTo: 1,
                            // stops: [0, 100]
                        }
                    },
                    stroke: {
                        lineCap: "round"
                    },
                    labels: ["Percent"]
                };

                // Initialize and render the chart
                const chart = new ApexCharts(document.querySelector('#gradient_radialbar_chart'), options);
                chart.render();
            } catch (error) {
                console.error('Error loading ApexCharts:', error);
            }
        }
    }

}
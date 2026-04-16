import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class SplineAreaChartService {

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
                    series: [
                        {
                            name: "Daxa",
                            data: [31, 40, 28, 51, 42, 109, 100]
                        },
                        {
                            name: "Social",
                            data: [11, 32, 45, 32, 34, 52, 41]
                        }
                    ],
                    chart: {
                        height: 350,
                        type: "area",
                        toolbar: {
                            show: true
                        }
                    },
                    dataLabels: {
                        enabled: false
                    },
                    stroke: {
                        curve: "smooth"
                    },
                    colors: [
                        "#796df6", "#0f79f3"
                    ],
                    xaxis: {
                        type: "datetime",
                        categories: [
                            "2018-09-19T00:00:00.000Z",
                            "2018-09-19T01:30:00.000Z",
                            "2018-09-19T02:30:00.000Z",
                            "2018-09-19T03:30:00.000Z",
                            "2018-09-19T04:30:00.000Z",
                            "2018-09-19T05:30:00.000Z",
                            "2018-09-19T06:30:00.000Z"
                        ],
                        axisBorder: {
                            show: false,
                            color: '#e0e0e0'
                        },
                        axisTicks: {
                            show: true,
                            color: '#e0e0e0'
                        },
                        labels: {
                            show: true,
                            style: {
                                colors: "#919aa3",
                                fontSize: "14px"
                            }
                        }
                    },
                    tooltip: {
                        x: {
                            format: "dd/MM/yy HH:mm"
                        }
                    },
                    yaxis: {
                        labels: {
                            show: true,
                            style: {
                                colors: "#919aa3",
                                fontSize: "14px"
                            }
                        },
                        axisBorder: {
                            show: false
                        }
                    },
                    legend: {
                        show: true,
                        fontSize: '14px',
                        labels: {
                            colors: "#919aa3"
                        },
                        itemMargin: {
                            horizontal: 10,
                            vertical: 0
                        }
                    },
                    grid: {
                        show: true,
                        strokeDashArray: 5,
                        borderColor: "#e0e0e0"
                    }
                };

                // Initialize and render the chart
                const chart = new ApexCharts(document.querySelector('#spline_area_chart'), options);
                chart.render();
            } catch (error) {
                console.error('Error loading ApexCharts:', error);
            }
        }
    }

}
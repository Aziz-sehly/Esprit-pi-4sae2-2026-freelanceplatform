import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class StackedAreaChartService {

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
                            name: "South",
                            data: [31, 40, 28, 51, 42, 109, 100]
                        },
                        {
                            name: "North",
                            data: [31, 40, 28, 51, 42, 109, 100]
                        },
                        {
                            name: "Central",
                            data: [31, 40, 28, 51, 42, 109, 100]
                        }
                    ],
                    chart: {
                        type: "area",
                        height: 350,
                        stacked: true,
                        events: {
                            selection: function(chart : any, e : any) {
                                console.log(new Date(e.xaxis.min));
                            }
                        },
                        toolbar: {
                            show: true
                        }
                    },
                    colors: [
                        "#796df6", "#0f79f3", "#00cae3"
                    ],
                    dataLabels: {
                        enabled: false
                    },
                    fill: {
                        type: "gradient",
                        gradient: {
                            opacityFrom: 0.6,
                            opacityTo: 0.8
                        }
                    },
                    legend: {
                        show: true,
                        position: "top",
                        fontSize: "14px",
                        horizontalAlign: "left",
                        labels: {
                            colors: "#919aa3"
                        },
                        itemMargin: {
                            horizontal: 10,
                            vertical: 0
                        }
                    },
                    labels: [
                        "13 Nov 2024",
                        "14 Nov 2024",
                        "15 Nov 2024",
                        "16 Nov 2024",
                        "17 Nov 2024",
                        "20 Nov 2024",
                        "21 Nov 2024"
                    ],
                    xaxis: {
                        type: "datetime",
                        axisBorder: {
                            show: false,
                            color: '#e0e0e0'
                        },
                        axisTicks: {
                            show: false,
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
                    grid: {
                        show: true,
                        strokeDashArray: 5,
                        borderColor: "#e0e0e0"
                    }
                };

                // Initialize and render the chart
                const chart = new ApexCharts(document.querySelector('#stacked_area_chart'), options);
                chart.render();
            } catch (error) {
                console.error('Error loading ApexCharts:', error);
            }
        }
    }

}
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class BasicAreaChartService {

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
                            name: "STOCK ABC",
                            data: [
                                8107.85,
                                8128.0,
                                8122.9,
                                8165.5,
                                8340.7,
                                8423.7,
                                8423.5,
                                8514.3,
                                8481.85,
                                8487.7,
                                8506.9,
                                8626.2,
                                8668.95,
                                8602.3,
                                8607.55,
                                8512.9,
                                8496.25,
                                8600.65,
                                8881.1,
                                9340.85
                            ]
                        }
                    ],
                    chart: {
                        type: "area",
                        height: 350,
                        zoom: {
                            enabled: false
                        },
                        toolbar: {
                            show: true
                        }
                    },
                    dataLabels: {
                        enabled: false
                    },
                    colors: [
                        "#0f79f3"
                    ],
                    stroke: {
                        curve: "straight"
                    },
                    title: {
                        text: "Fundamental Analysis of Stocks",
                        align: "left",
                        offsetX: -9,
                        style: {
                            fontWeight: '500',
                            fontSize: '15px',
                            color: '#475569'
                        }
                    },
                    subtitle: {
                        text: "Price Movements",
                        align: "left",
                        offsetX: -9,
                        style: {
                            fontWeight: 'normal',
                            fontSize: '14px',
                            color: '#919aa3'
                        }
                    },
                    labels: [
                        "13 Nov 2024",
                        "14 Nov 2024",
                        "15 Nov 2024",
                        "16 Nov 2024",
                        "17 Nov 2024",
                        "20 Nov 2024",
                        "21 Nov 2024",
                        "22 Nov 2024",
                        "23 Nov 2024",
                        "24 Nov 2024",
                        "27 Nov 2024",
                        "28 Nov 2024",
                        "29 Nov 2024",
                        "30 Nov 2024",
                        "01 Dec 2024",
                        "04 Dec 2024",
                        "05 Dec 2024",
                        "06 Dec 2024",
                        "07 Dec 2024",
                        "08 Dec 2024"
                    ],
                    xaxis: {
                        type: "datetime",
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
                    grid: {
                        show: true,
                        strokeDashArray: 5,
                        borderColor: "#e0e0e0"
                    },
                    yaxis: {
                        opposite: true,
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
                    }
                };

                // Initialize and render the chart
                const chart = new ApexCharts(document.querySelector('#basic_area_chart'), options);
                chart.render();
            } catch (error) {
                console.error('Error loading ApexCharts:', error);
            }
        }
    }

}
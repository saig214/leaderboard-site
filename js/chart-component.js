// Flexible Chart Component - Handles various chart types and configurations
class ChartComponent {
  constructor(chartsManager) {
    this.chartsManager = chartsManager;
    this.chartTypes = {
      line: this.createLineChart.bind(this),
      bar: this.createBarChart.bind(this),
      scatter: this.createScatterChart.bind(this),
      area: this.createAreaChart.bind(this),
      radar: this.createRadarChart.bind(this)
    };
  }

  createChart(chartType, config) {
    if (!this.chartTypes[chartType]) {
      console.error(`Chart type '${chartType}' not supported`);
      return null;
    }

    return this.chartTypes[chartType](config);
  }

  createLineChart(config) {
    const {
      canvasId,
      labels,
      datasets,
      title,
      xAxisTitle = 'X Axis',
      yAxisTitle = 'Y Axis',
      reverseYAxis = false,
      showLegend = true,
      tension = 0.1,
      pointRadius = 4,
      pointHoverRadius = 6
    } = config;

    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    this.chartsManager.destroyChart(canvasId);

    const processedDatasets = datasets.map(dataset => ({
      ...dataset,
      tension: dataset.tension || tension,
      pointRadius: dataset.pointRadius || pointRadius,
      pointHoverRadius: dataset.pointHoverRadius || pointHoverRadius,
      fill: dataset.fill !== undefined ? dataset.fill : false
    }));

    const chartConfig = {
      type: 'line',
      data: {
        labels: labels,
        datasets: processedDatasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: showLegend },
          title: {
            display: !!title,
            text: title
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: xAxisTitle
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: yAxisTitle
            },
            reverse: reverseYAxis
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };

    this.chartsManager.charts[canvasId] = new Chart(ctx, chartConfig);
    return this.chartsManager.charts[canvasId];
  }

  createBarChart(config) {
    const {
      canvasId,
      labels,
      datasets,
      title,
      xAxisTitle = 'X Axis',
      yAxisTitle = 'Y Axis',
      reverseYAxis = false,
      showLegend = true,
      barThickness = 'flex'
    } = config;

    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    this.chartsManager.destroyChart(canvasId);

    const processedDatasets = datasets.map(dataset => ({
      ...dataset,
      barThickness: dataset.barThickness || barThickness
    }));

    const chartConfig = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: processedDatasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: showLegend },
          title: {
            display: !!title,
            text: title
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: xAxisTitle
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: yAxisTitle
            },
            reverse: reverseYAxis
          }
        }
      }
    };

    this.chartsManager.charts[canvasId] = new Chart(ctx, chartConfig);
    return this.chartsManager.charts[canvasId];
  }

  createScatterChart(config) {
    const {
      canvasId,
      datasets,
      title,
      xAxisTitle = 'X Axis',
      yAxisTitle = 'Y Axis',
      reverseYAxis = false,
      showLegend = true,
      pointRadius = 6,
      pointHoverRadius = 8
    } = config;

    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    this.chartsManager.destroyChart(canvasId);

    const processedDatasets = datasets.map(dataset => ({
      ...dataset,
      pointRadius: dataset.pointRadius || pointRadius,
      pointHoverRadius: dataset.pointHoverRadius || pointHoverRadius
    }));

    const chartConfig = {
      type: 'scatter',
      data: {
        datasets: processedDatasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: showLegend },
          title: {
            display: !!title,
            text: title
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: xAxisTitle
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: yAxisTitle
            },
            reverse: reverseYAxis
          }
        }
      }
    };

    this.chartsManager.charts[canvasId] = new Chart(ctx, chartConfig);
    return this.chartsManager.charts[canvasId];
  }

  createAreaChart(config) {
    const {
      canvasId,
      labels,
      datasets,
      title,
      xAxisTitle = 'X Axis',
      yAxisTitle = 'Y Axis',
      reverseYAxis = false,
      showLegend = true,
      tension = 0.4
    } = config;

    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    this.chartsManager.destroyChart(canvasId);

    const processedDatasets = datasets.map(dataset => ({
      ...dataset,
      tension: dataset.tension || tension,
      fill: true
    }));

    const chartConfig = {
      type: 'line',
      data: {
        labels: labels,
        datasets: processedDatasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: showLegend },
          title: {
            display: !!title,
            text: title
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: xAxisTitle
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: yAxisTitle
            },
            reverse: reverseYAxis
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };

    this.chartsManager.charts[canvasId] = new Chart(ctx, chartConfig);
    return this.chartsManager.charts[canvasId];
  }

  createRadarChart(config) {
    const {
      canvasId,
      labels,
      datasets,
      title,
      showLegend = true
    } = config;

    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    this.chartsManager.destroyChart(canvasId);

    const chartConfig = {
      type: 'radar',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: showLegend },
          title: {
            display: !!title,
            text: title
          }
        },
        scales: {
          r: {
            beginAtZero: true
          }
        }
      }
    };

    this.chartsManager.charts[canvasId] = new Chart(ctx, chartConfig);
    return this.chartsManager.charts[canvasId];
  }

  // Utility method to create performance comparison charts
  createPerformanceComparisonChart(canvasId, playerData, gameType, game) {
    const labels = playerData.map(p => p.name);
    const data = playerData.map(p => game.hasTime ? p.metrics.time : p.metrics.guesses);

    const config = {
      canvasId,
      labels,
      datasets: [{
        label: `${gameType.charAt(0).toUpperCase() + gameType.slice(1)} Performance`,
        data,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(6, 182, 212, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
          'rgb(6, 182, 212)'
        ],
        borderWidth: 2
      }],
      title: `${gameType.charAt(0).toUpperCase() + gameType.slice(1)} Latest Performance Comparison`,
      xAxisTitle: 'Players',
      yAxisTitle: game.hasTime ? 'Time (seconds)' : 'Guesses',
      reverseYAxis: game.hasTime
    };

    return this.createBarChart(config);
  }

  // Utility method to create trend analysis charts
  createTrendChart(canvasId, dataPoints, title, metricLabel) {
    const labels = dataPoints.map(p => p.label);
    const data = dataPoints.map(p => p.value);

    const config = {
      canvasId,
      labels,
      datasets: [{
        label: metricLabel,
        data,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3
      }],
      title,
      xAxisTitle: 'Time Period',
      yAxisTitle: metricLabel,
      reverseYAxis: false
    };

    return this.createAreaChart(config);
  }
}

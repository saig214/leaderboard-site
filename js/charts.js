// Charts and Visualizations Module
class ChartsManager {
  constructor(dataManager) {
    this.charts = {};
    this.dataManager = dataManager;
  }

  createPlayerComparisonChart(players, gameId, containerId) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return;

    // Get real performance data for these players in this game
    const gameStats = this.dataManager.processedData.gameStats[gameId];
    const game = this.dataManager.rawData.games[gameId];

    if (!gameStats || !game) return;

    const playerData = players.map(player => {
      const playerStats = gameStats.leaderboard.find(entry =>
        entry.playerId === player.playerId
      );
      if (playerStats) {
        return game.hasTime ? playerStats.metrics.time : playerStats.metrics.guesses;
      }
      return 0;
    });

    const playerNames = players.map(player => player.name);

    const data = {
      labels: playerNames,
      datasets: [{
        label: `${gameId.charAt(0).toUpperCase() + gameId.slice(1)} Performance`,
        data: playerData,
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
      }]
    };

    this.charts[containerId] = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: `${gameId.charAt(0).toUpperCase() + gameId.slice(1)} Performance Comparison`
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Time (seconds)'
            }
          }
        }
      }
    });
  }

  createGameTrendChart(gameId, containerId) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return;

    // Sample trend data
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = {
      labels: labels,
      datasets: [{
        label: 'Average Time',
        data: [45, 42, 38, 35, 32, 29],
        fill: false,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1
      }]
    };

    this.charts[containerId] = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: `${gameId.charAt(0).toUpperCase() + gameId.slice(1)} Performance Trend`
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Time (seconds)'
            }
          }
        }
      }
    });
  }

  createPlayerProgressChart(playerId, containerId) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return;

    // Get real player progress data
    const playerEntries = this.dataManager.rawData.entries
      .filter(entry => entry.playerId === playerId)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-10); // Last 10 games for progress tracking

    if (playerEntries.length === 0) return;

    const playerName = this.dataManager.rawData.players[playerId];
    const labels = playerEntries.map((entry, index) => `Game ${index + 1}`);
    const performanceData = playerEntries.map(entry => {
      const game = this.dataManager.rawData.games[entry.game];
      return game.hasTime ? entry.metrics.time : entry.metrics.guesses;
    });

    const data = {
      labels: labels,
      datasets: [{
        label: `${playerName}'s Performance`,
        data: performanceData,
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgb(16, 185, 129)',
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(16, 185, 129)',
        tension: 0.4
      }]
    };

    this.charts[containerId] = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Player Progress Over Time'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Time (seconds)'
            }
          }
        }
      }
    });
  }

  createGameDistributionChart(containerId) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return;

    // Get real game distribution data
    const gameStats = this.dataManager.processedData.gameStats;
    const gameNames = Object.keys(gameStats).map(gameId => gameId.charAt(0).toUpperCase() + gameId.slice(1));
    const gameCounts = Object.values(gameStats).map(stats => stats.totalPlays);

    const data = {
      labels: gameNames,
      datasets: [{
        data: gameCounts,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',  // Blue
          'rgba(16, 185, 129, 0.8)',  // Green
          'rgba(245, 158, 11, 0.8)',  // Yellow
          'rgba(239, 68, 68, 0.8)',   // Red
          'rgba(139, 92, 246, 0.8)',  // Purple
          'rgba(6, 182, 212, 0.8)'    // Cyan
        ],
        borderWidth: 2
      }]
    };

    this.charts[containerId] = new Chart(ctx, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          },
          title: {
            display: true,
            text: 'Games Distribution'
          }
        }
      }
    });
  }

  destroyChart(containerId) {
    if (this.charts[containerId]) {
      this.charts[containerId].destroy();
      delete this.charts[containerId];
    }
  }

  destroyAllCharts() {
    Object.keys(this.charts).forEach(containerId => {
      this.destroyChart(containerId);
    });
  }
}

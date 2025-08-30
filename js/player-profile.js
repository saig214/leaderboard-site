// Player Profile UI Module - Handles player profile rendering and interactions
class PlayerProfileUI {
  constructor(dataManager, chartsManager) {
    this.dataManager = dataManager;
    this.chartsManager = chartsManager;
    this.currentPlayerId = null;
    this.chartComponents = {};
  }

  render() {
    const players = this.dataManager.rawData.players;

    return `
      <div class="fade-in">
        <h2 class="text-2xl font-bold mb-6">Player Profiles</h2>

        <!-- Player Selection -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label for="player-select" class="block text-sm font-medium text-gray-700 mb-2">
            Select Player:
          </label>
          <select id="player-select" class="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Choose a player...</option>
            ${Object.entries(players).map(([playerId, playerName]) => `
              <option value="${playerId}">${playerName}</option>
            `).join('')}
          </select>
        </div>

        <!-- Player Profile Content -->
        <div id="player-profile-content">
          <div class="text-center py-12">
            <i class="fas fa-user text-4xl text-gray-300 mb-4"></i>
            <p class="text-gray-500">Select a player to view their detailed profile</p>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const playerSelect = document.getElementById('player-select');
    if (playerSelect) {
      playerSelect.addEventListener('change', (e) => {
        const playerId = e.target.value;
        if (playerId) {
          this.currentPlayerId = playerId;
          this.renderPlayerProfile(playerId);
        } else {
          this.showEmptyState();
        }
      });
    }
  }

  showEmptyState() {
    document.getElementById('player-profile-content').innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-user text-4xl text-gray-300 mb-4"></i>
        <p class="text-gray-500">Select a player to view their detailed profile</p>
      </div>
    `;
  }

  renderPlayerProfile(playerId) {
    const playerName = this.dataManager.rawData.players[playerId];
    const playerStats = this.dataManager.processedData.playerStats[playerId];

    if (!playerStats) {
      this.showNoDataState();
      return;
    }

    // Group entries by game
    const playerEntries = this.dataManager.rawData.entries.filter(entry => entry.playerId === playerId);
    const gamesByType = {};
    playerEntries.forEach(entry => {
      if (!gamesByType[entry.game]) {
        gamesByType[entry.game] = [];
      }
      gamesByType[entry.game].push(entry);
    });

    const content = `
      <div class="space-y-6">
        <!-- Player Overview -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-xl font-semibold mb-4">${playerName}'s Overview</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">${playerStats.totalGames}</div>
              <div class="text-sm text-gray-600">Games Played</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">${Math.round(playerStats.totalTime)}s</div>
              <div class="text-sm text-gray-600">Total Time</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">${playerStats.favoriteGame || 'N/A'}</div>
              <div class="text-sm text-gray-600">Favorite Game</div>
            </div>
          </div>
        </div>

        <!-- Game-specific Performance Cards -->
        <div id="game-performance-cards" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          ${Object.keys(gamesByType).map(gameType => this.createGamePerformanceCard(playerId, gameType, gamesByType[gameType])).join('')}
        </div>

        <!-- Additional Metrics Section -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-lg font-semibold mb-4">Performance Trends</h3>
          <div id="performance-trends-chart" class="mb-4">
            <canvas id="trends-chart-${playerId}" width="400" height="200"></canvas>
          </div>
        </div>
      </div>
    `;

    document.getElementById('player-profile-content').innerHTML = content;

    // Initialize charts for each game
    Object.keys(gamesByType).forEach(gameType => {
      this.createGameChart(playerId, gameType);
    });

    // Create overall performance trends chart
    this.createPerformanceTrendsChart(playerId);
  }

  createGamePerformanceCard(playerId, gameType, entries) {
    const game = this.dataManager.rawData.games[gameType];
    const sortedEntries = entries.sort((a, b) => a.gameNum - b.gameNum);

    // Calculate metrics
    const metrics = sortedEntries.map(e => game.hasTime ? e.metrics.time : e.metrics.guesses);
    const avgMetric = metrics.reduce((a, b) => a + b, 0) / metrics.length;
    const bestMetric = game.hasTime ? Math.min(...metrics) : Math.min(...metrics);
    const latestMetric = metrics[metrics.length - 1];

    // Calculate improvement trend
    const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2));
    const secondHalf = metrics.slice(Math.floor(metrics.length / 2));
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trend = game.hasTime ? (firstHalfAvg - secondHalfAvg) : (secondHalfAvg - firstHalfAvg);
    const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat';
    const trendColor = trendDirection === 'up' ? 'text-green-600' : trendDirection === 'down' ? 'text-red-600' : 'text-gray-600';
    const trendIcon = trendDirection === 'up' ? 'fas fa-arrow-up' : trendDirection === 'down' ? 'fas fa-arrow-down' : 'fas fa-minus';

    return `
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h4 class="text-lg font-semibold mb-4 capitalize">${gameType} Performance</h4>

        <!-- Game Stats -->
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="text-center">
            <div class="text-lg font-semibold text-blue-600">${entries.length}</div>
            <div class="text-xs text-gray-600">Games</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-green-600">${Math.round(avgMetric)}${game.hasTime ? 's' : ''}</div>
            <div class="text-xs text-gray-600">Avg ${game.hasTime ? 'Time' : 'Guesses'}</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-purple-600">${bestMetric}${game.hasTime ? 's' : ''}</div>
            <div class="text-xs text-gray-600">Best ${game.hasTime ? 'Time' : 'Guesses'}</div>
          </div>
        </div>

        <!-- Trend Indicator -->
        <div class="flex items-center justify-center mb-4">
          <i class="${trendIcon} ${trendColor} mr-2"></i>
          <span class="text-sm ${trendColor}">
            ${trendDirection === 'up' ? 'Improving' : trendDirection === 'down' ? 'Declining' : 'Stable'}
            ${Math.abs(trend) > 0 ? `(${Math.round(Math.abs(trend) * 10) / 10}${game.hasTime ? 's' : ''})` : ''}
          </span>
        </div>

        <!-- Performance Chart -->
        <div class="chart-container">
          <canvas id="chart-${playerId}-${gameType}" width="300" height="200"></canvas>
        </div>
      </div>
    `;
  }

  createGameChart(playerId, gameType) {
    const canvasId = `chart-${playerId}-${gameType}`;
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const playerEntries = this.dataManager.rawData.entries
      .filter(entry => entry.playerId === playerId && entry.game === gameType)
      .sort((a, b) => a.gameNum - b.gameNum);

    const game = this.dataManager.rawData.games[gameType];
    const labels = playerEntries.map(entry => `Game ${entry.gameNum}`);
    const data = playerEntries.map(entry => game.hasTime ? entry.metrics.time : entry.metrics.guesses);

    // Destroy existing chart
    this.chartsManager.destroyChart(canvasId);

    const chartConfig = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `${gameType.charAt(0).toUpperCase() + gameType.slice(1)} ${game.hasTime ? 'Time' : 'Guesses'}`,
          data: data,
          borderColor: this.getGameColor(gameType),
          backgroundColor: this.getGameColor(gameType, 0.1),
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: false }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: game.hasTime ? 'Time (seconds)' : 'Guesses'
            },
            reverse: game.hasTime
          },
          x: {
            title: { display: true, text: 'Game Number' }
          }
        }
      }
    };

    this.chartsManager.charts[canvasId] = new Chart(ctx, chartConfig);
  }

  createPerformanceTrendsChart(playerId) {
    const canvasId = `trends-chart-${playerId}`;
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const playerEntries = this.dataManager.rawData.entries
      .filter(entry => entry.playerId === playerId)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-20); // Last 20 games for trends

    if (playerEntries.length === 0) return;

    const dates = playerEntries.map(entry => new Date(entry.date).toLocaleDateString());
    const performanceData = playerEntries.map(entry => {
      const game = this.dataManager.rawData.games[entry.game];
      return game.hasTime ? entry.metrics.time : entry.metrics.guesses;
    });

    this.chartsManager.destroyChart(canvasId);

    const chartConfig = {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Performance Over Time',
          data: performanceData,
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: false }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: { display: true, text: 'Performance Metric' }
          },
          x: {
            title: { display: true, text: 'Date' }
          }
        }
      }
    };

    this.chartsManager.charts[canvasId] = new Chart(ctx, chartConfig);
  }

  getGameColor(gameType, alpha = 1) {
    const colors = {
      pinpoint: `rgba(59, 130, 246, ${alpha})`,    // Blue
      zip: `rgba(16, 185, 129, ${alpha})`,         // Green
      tango: `rgba(245, 158, 11, ${alpha})`,       // Yellow
      queens: `rgba(239, 68, 68, ${alpha})`,       // Red
      crossclimb: `rgba(139, 92, 246, ${alpha})`,  // Purple
      minisudoku: `rgba(6, 182, 212, ${alpha})`    // Cyan
    };
    return colors[gameType] || `rgba(156, 163, 175, ${alpha})`; // Gray fallback
  }

  showNoDataState() {
    document.getElementById('player-profile-content').innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-4xl text-yellow-300 mb-4"></i>
        <p class="text-gray-500">No performance data available for this player</p>
      </div>
    `;
  }

  destroy() {
    // Clean up charts when switching away from profile view
    Object.keys(this.chartsManager.charts).forEach(chartId => {
      if (chartId.includes('chart-') || chartId.includes('trends-chart-')) {
        this.chartsManager.destroyChart(chartId);
      }
    });
  }
}

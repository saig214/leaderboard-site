// Metrics Display Component - Handles display of player statistics and metrics
class MetricsDisplay {
  constructor(dataManager) {
    this.dataManager = dataManager;
  }

  // Create overview stats for a player
  createPlayerOverview(playerId) {
    const playerStats = this.dataManager.processedData.playerStats[playerId];
    if (!playerStats) return '';

    const playerName = this.dataManager.rawData.players[playerId];

    return `
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-semibold mb-4">${playerName}'s Overview</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${this.createStatCard('Games Played', playerStats.totalGames, 'blue')}
          ${this.createStatCard('Total Time', `${Math.round(playerStats.totalTime)}s`, 'green')}
          ${this.createStatCard('Favorite Game', playerStats.favoriteGame || 'N/A', 'purple')}
          ${this.createStatCard('Current Streak', playerStats.currentStreak, 'orange')}
        </div>
      </div>
    `;
  }

  // Create game-specific performance card
  createGamePerformanceCard(playerId, gameType, entries) {
    const game = this.dataManager.rawData.games[gameType];
    const sortedEntries = entries.sort((a, b) => a.gameNum - b.gameNum);

    // Calculate comprehensive metrics
    const metrics = sortedEntries.map(e => game.hasTime ? e.metrics.time : e.metrics.guesses);
    const avgMetric = metrics.reduce((a, b) => a + b, 0) / metrics.length;
    const bestMetric = game.hasTime ? Math.min(...metrics) : Math.min(...metrics);
    const worstMetric = game.hasTime ? Math.max(...metrics) : Math.max(...metrics);
    const latestMetric = metrics[metrics.length - 1];
    const improvement = this.calculateImprovement(metrics, game);

    // Calculate consistency (standard deviation)
    const consistency = this.calculateConsistency(metrics);

    return `
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h4 class="text-lg font-semibold mb-4 capitalize">${gameType} Performance</h4>

        <!-- Primary Stats -->
        <div class="grid grid-cols-3 gap-4 mb-4">
          ${this.createStatCard(entries.length, 'Games', 'blue', 'text-sm')}
          ${this.createStatCard(`${Math.round(avgMetric)}${game.hasTime ? 's' : ''}`, `Avg ${game.hasTime ? 'Time' : 'Guesses'}`, 'green', 'text-sm')}
          ${this.createStatCard(`${bestMetric}${game.hasTime ? 's' : ''}`, `Best ${game.hasTime ? 'Time' : 'Guesses'}`, 'purple', 'text-sm')}
        </div>

        <!-- Secondary Stats -->
        <div class="grid grid-cols-3 gap-4 mb-4">
          ${this.createStatCard(`${worstMetric}${game.hasTime ? 's' : ''}`, `Worst ${game.hasTime ? 'Time' : 'Guesses'}`, 'red', 'text-sm')}
          ${this.createStatCard(`${latestMetric}${game.hasTime ? 's' : ''}`, `Latest ${game.hasTime ? 'Time' : 'Guesses'}`, 'gray', 'text-sm')}
          ${this.createStatCard(`${consistency}${game.hasTime ? 's' : ''}`, 'Consistency', 'indigo', 'text-sm')}
        </div>

        <!-- Trend Indicator -->
        <div class="flex items-center justify-center mb-4">
          ${this.createTrendIndicator(improvement, game)}
        </div>
      </div>
    `;
  }

  // Create a stat card component
  createStatCard(value, label, color, valueSize = 'text-lg', labelSize = 'text-xs') {
    const colorClasses = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      red: 'text-red-600',
      gray: 'text-gray-600',
      indigo: 'text-indigo-600'
    };

    return `
      <div class="text-center">
        <div class="${valueSize} font-semibold ${colorClasses[color] || 'text-gray-600'}">${value}</div>
        <div class="${labelSize} text-gray-600">${label}</div>
      </div>
    `;
  }

  // Create trend indicator
  createTrendIndicator(improvement, game) {
    const { direction, value, color, icon } = improvement;

    return `
      <i class="${icon} ${color} mr-2"></i>
      <span class="text-sm ${color}">
        ${direction === 'up' ? 'Improving' : direction === 'down' ? 'Declining' : 'Stable'}
        ${value > 0 ? `(${Math.round(value * 10) / 10}${game.hasTime ? 's' : ''})` : ''}
      </span>
    `;
  }

  // Calculate improvement trend
  calculateImprovement(metrics, game) {
    if (metrics.length < 2) {
      return { direction: 'flat', value: 0, color: 'text-gray-600', icon: 'fas fa-minus' };
    }

    const midpoint = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, midpoint);
    const secondHalf = metrics.slice(midpoint);

    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const difference = game.hasTime ? (firstHalfAvg - secondHalfAvg) : (secondHalfAvg - firstHalfAvg);

    if (Math.abs(difference) < 0.1) {
      return { direction: 'flat', value: 0, color: 'text-gray-600', icon: 'fas fa-minus' };
    }

    const direction = difference > 0 ? 'up' : 'down';
    const color = direction === 'up' ? 'text-green-600' : 'text-red-600';
    const icon = direction === 'up' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';

    return { direction, value: Math.abs(difference), color, icon };
  }

  // Calculate consistency (standard deviation)
  calculateConsistency(metrics) {
    if (metrics.length < 2) return 0;

    const mean = metrics.reduce((a, b) => a + b, 0) / metrics.length;
    const squaredDifferences = metrics.map(value => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((a, b) => a + b, 0) / squaredDifferences.length;

    return Math.round(Math.sqrt(variance) * 10) / 10;
  }

  // Create comparison table for multiple players
  createComparisonTable(players, gameType) {
    const game = this.dataManager.rawData.games[gameType];
    if (!game) return '';

    const headers = ['Player', 'Games', 'Avg', 'Best', 'Latest', 'Trend'];

    return `
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold mb-4 capitalize">${gameType} Comparison</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full table-auto">
            <thead>
              <tr class="bg-gray-50">
                ${headers.map(header => `<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${players.map(playerId => this.createComparisonRow(playerId, gameType)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Create a row for the comparison table
  createComparisonRow(playerId, gameType) {
    const playerName = this.dataManager.rawData.players[playerId];
    const playerStats = this.dataManager.processedData.playerStats[playerId];
    const entries = this.dataManager.rawData.entries.filter(entry =>
      entry.playerId === playerId && entry.game === gameType
    );

    if (entries.length === 0) {
      return `
        <tr>
          <td class="px-4 py-2 text-sm text-gray-900">${playerName}</td>
          <td colspan="5" class="px-4 py-2 text-sm text-gray-500">No data</td>
        </tr>
      `;
    }

    const game = this.dataManager.rawData.games[gameType];
    const sortedEntries = entries.sort((a, b) => a.gameNum - b.gameNum);
    const metrics = sortedEntries.map(e => game.hasTime ? e.metrics.time : e.metrics.guesses);

    const avgMetric = Math.round(metrics.reduce((a, b) => a + b, 0) / metrics.length * 10) / 10;
    const bestMetric = game.hasTime ? Math.min(...metrics) : Math.min(...metrics);
    const latestMetric = metrics[metrics.length - 1];
    const improvement = this.calculateImprovement(metrics, game);

    const trendHtml = `
      <i class="${improvement.icon} ${improvement.color}"></i>
      <span class="${improvement.color} text-xs">
        ${improvement.direction === 'up' ? '+' : improvement.direction === 'down' ? '-' : ''}
        ${improvement.value > 0 ? Math.round(improvement.value * 10) / 10 : ''}
      </span>
    `;

    return `
      <tr>
        <td class="px-4 py-2 text-sm font-medium text-gray-900">${playerName}</td>
        <td class="px-4 py-2 text-sm text-gray-900">${entries.length}</td>
        <td class="px-4 py-2 text-sm text-gray-900">${avgMetric}${game.hasTime ? 's' : ''}</td>
        <td class="px-4 py-2 text-sm text-gray-900">${bestMetric}${game.hasTime ? 's' : ''}</td>
        <td class="px-4 py-2 text-sm text-gray-900">${latestMetric}${game.hasTime ? 's' : ''}</td>
        <td class="px-4 py-2 text-sm text-gray-900">${trendHtml}</td>
      </tr>
    `;
  }

  // Create performance summary cards
  createPerformanceSummary(playerId) {
    const playerStats = this.dataManager.processedData.playerStats[playerId];
    if (!playerStats) return '';

    const playerEntries = this.dataManager.rawData.entries.filter(entry => entry.playerId === playerId);
    const gamePerformance = {};

    // Group by game and calculate performance
    playerEntries.forEach(entry => {
      const gameType = entry.game;
      if (!gamePerformance[gameType]) {
        gamePerformance[gameType] = [];
      }
      const game = this.dataManager.rawData.games[gameType];
      const metric = game.hasTime ? entry.metrics.time : entry.metrics.guesses;
      gamePerformance[gameType].push(metric);
    });

    // Calculate overall performance score
    const gameScores = Object.entries(gamePerformance).map(([gameType, metrics]) => {
      const game = this.dataManager.rawData.games[gameType];
      const avgMetric = metrics.reduce((a, b) => a + b, 0) / metrics.length;
      // Normalize score (lower is better for time, higher for guesses)
      const score = game.hasTime ? (100 - Math.min(avgMetric, 100)) : Math.min(avgMetric * 10, 100);
      return { game: gameType, score: Math.round(score), metrics };
    });

    const overallScore = gameScores.length > 0
      ? Math.round(gameScores.reduce((sum, game) => sum + game.score, 0) / gameScores.length)
      : 0;

    return `
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">Performance Summary</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">${overallScore}</div>
            <div class="text-sm text-gray-600">Overall Score</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">${Object.keys(gamePerformance).length}</div>
            <div class="text-sm text-gray-600">Games Played</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">${Math.round(playerStats.totalTime / playerStats.totalGames)}s</div>
            <div class="text-sm text-gray-600">Avg Time/Game</div>
          </div>
        </div>
      </div>
    `;
  }
}

// Player Comparison Module
class ComparisonUI {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.selectedPlayers = new Set(Object.keys(dataManager.rawData.players)); // Select all by default
    this.activeGame = 'zip'; // Default active game
    this.chartType = 'progression'; // 'progression' or 'comparison'
  }

  render() {
    const games = Object.keys(this.dataManager.rawData.games);
    const players = Object.entries(this.dataManager.rawData.players);

    return `
      <div class="fade-in">
        <h2 class="text-2xl font-bold mb-6 flex items-center">
          <i class="fas fa-users mr-3 text-blue-600"></i>
          Game-by-Game Stats
        </h2>

        <!-- Game Tabs -->
        <div class="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div class="border-b border-gray-200">
            <nav class="flex overflow-x-auto">
              ${games.map(gameId => `
                <button class="game-tab flex-1 px-4 py-3 text-center font-medium transition-colors duration-200 ${
                  this.activeGame === gameId
                    ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }" data-game="${gameId}">
                  <div class="flex items-center justify-center space-x-2">
                    <span class="text-lg">${this.dataManager.getGameIcon(gameId)}</span>
                    <span class="capitalize">${gameId}</span>
                  </div>
                </button>
              `).join('')}
            </nav>
          </div>

          <div class="p-6">
            <h3 class="text-lg font-semibold capitalize mb-4">${this.activeGame} Analysis</h3>

            <!-- Zoom Controls removed -->

            <!-- Chart Area(s) -->
            ${this.activeGame === 'zip' ? `
              <div class="space-y-6">
                <div class="chart-container">
                  <canvas id="zip-time-chart"></canvas>
                </div>
                <div class="chart-container">
                  <canvas id="zip-backtracks-chart"></canvas>
                </div>
              </div>
            ` : `
              <div class="chart-container">
                <canvas id="game-analysis-chart"></canvas>
              </div>
            `}

            <!-- Stats Summary -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div class="stats-card bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-sm text-gray-600">Total Games</div>
                    <div class="text-2xl font-bold text-gray-900" id="total-games">-</div>
                  </div>
                  <div class="text-2xl text-blue-500">
                    <i class="fas fa-gamepad"></i>
                  </div>
                </div>
              </div>
              <div class="stats-card bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-sm text-gray-600">Best</div>
                    <div class="text-2xl font-bold text-gray-900" id="best-metric">-</div>
                  </div>
                  <div class="text-2xl text-green-500">
                    <i class="fas fa-trophy"></i>
                  </div>
                </div>
              </div>
              <div class="stats-card bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-sm text-gray-600">Avg</div>
                    <div class="text-2xl font-bold text-gray-900" id="avg-metric">-</div>
                  </div>
                  <div class="text-2xl text-purple-500">
                    <i class="fas fa-clock"></i>
                  </div>
                </div>
              </div>
              <div class="stats-card bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-sm text-gray-600">Worst</div>
                    <div class="text-2xl font-bold text-gray-900" id="worst-metric">-</div>
                  </div>
                  <div class="text-2xl text-red-500">
                    <i class="fas fa-thumbs-down"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  updateSelectedPlayers() {
    const checkboxes = document.querySelectorAll('.player-checkbox');
    this.selectedPlayers.clear();
    checkboxes.forEach(checkbox => {
      if (checkbox.checked) {
        this.selectedPlayers.add(checkbox.value);
      }
    });
  }

  getGameData(gameId) {
    const gameEntries = this.dataManager.rawData.entries
      .filter(entry => entry.game === gameId)
      .sort((a, b) => a.gameNum - b.gameNum);

    return gameEntries;
  }

  getPlayerGameData(gameId, playerId) {
    return this.dataManager.rawData.entries
      .filter(entry => entry.game === gameId && entry.playerId === playerId)
      .sort((a, b) => a.gameNum - b.gameNum);
  }

  updateStatsSummary(gameId) {
    const gameData = this.getGameData(gameId);
    const game = this.dataManager.rawData.games[gameId];

    // Total games
    document.getElementById('total-games').textContent = gameData.length;

    if (gameData.length === 0) {
      document.getElementById('best-metric').textContent = '-';
      document.getElementById('avg-metric').textContent = '-';
      document.getElementById('worst-metric').textContent = '-';
      return;
    }

    const metricKey = game.hasTime ? 'time' : (game.hasGuesses ? 'guesses' : null);
    if (!metricKey) {
      document.getElementById('best-metric').textContent = '-';
      document.getElementById('avg-metric').textContent = '-';
      document.getElementById('worst-metric').textContent = '-';
      return;
    }

    const values = gameData
      .map(e => e.metrics && e.metrics[metricKey])
      .filter(v => typeof v === 'number');

    if (values.length === 0) {
      document.getElementById('best-metric').textContent = '-';
      document.getElementById('avg-metric').textContent = '-';
      document.getElementById('worst-metric').textContent = '-';
      return;
    }

    const best = Math.min(...values);
    const worst = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    if (metricKey === 'time') {
      document.getElementById('best-metric').textContent = `${best}s`;
      document.getElementById('avg-metric').textContent = `${Math.round(avg)}s`;
      document.getElementById('worst-metric').textContent = `${worst}s`;
    } else {
      document.getElementById('best-metric').textContent = `${best} guesses`;
      document.getElementById('avg-metric').textContent = `${Math.round(avg)} guesses`;
      document.getElementById('worst-metric').textContent = `${worst} guesses`;
    }
  }
}

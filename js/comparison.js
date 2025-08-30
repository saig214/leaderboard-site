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
            <nav class="flex">
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
                  <canvas id="zip-time-chart" width="800" height="350"></canvas>
                </div>
                <div class="chart-container">
                  <canvas id="zip-backtracks-chart" width="800" height="350"></canvas>
                </div>
              </div>
            ` : `
              <div class="chart-container">
                <canvas id="game-analysis-chart" width="800" height="400"></canvas>
              </div>
            `}

            <!-- Stats Summary -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
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
                    <div class="text-sm text-gray-600">Best Time</div>
                    <div class="text-2xl font-bold text-gray-900" id="best-time">-</div>
                  </div>
                  <div class="text-2xl text-green-500">
                    <i class="fas fa-trophy"></i>
                  </div>
                </div>
              </div>
              <div class="stats-card bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-sm text-gray-600">Avg Time</div>
                    <div class="text-2xl font-bold text-gray-900" id="avg-time">-</div>
                  </div>
                  <div class="text-2xl text-purple-500">
                    <i class="fas fa-clock"></i>
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
      document.getElementById('best-time').textContent = '-';
      document.getElementById('avg-time').textContent = '-';
      return;
    }

    if (game.hasTime) {
      const times = gameData.map(entry => entry.metrics.time);
      const bestTime = Math.min(...times);
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      document.getElementById('best-time').textContent = `${bestTime}s`;
      document.getElementById('avg-time').textContent = `${Math.round(avgTime)}s`;
    } else if (game.hasGuesses) {
      const guesses = gameData.map(entry => entry.metrics.guesses);
      const bestGuesses = Math.min(...guesses);
      const avgGuesses = guesses.reduce((a, b) => a + b, 0) / guesses.length;

      document.getElementById('best-time').textContent = `${bestGuesses} guesses`;
      document.getElementById('avg-time').textContent = `${Math.round(avgGuesses)} guesses`;
    }
  }
}

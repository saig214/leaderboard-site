// LinkedIn Games Leaderboard - Main Application
class LinkedInLeaderboard {
  constructor() {
    this.data = null;
    this.dataManager = null;
    this.leaderboardUI = null;
    this.comparisonUI = null;
    this.chartsManager = null;
    this.playerProfileUI = null;
    this.currentView = 'leaderboard';
    this.currentTimeRange = 'allTime';

    this.init();
  }

  async init() {
    try {
      await this.loadData();
      this.initializeModules();
      this.setupEventListeners();
      this.renderView();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to load game data. Please check your data file.');
    }
  }

  loadData() {
    // Load data directly from embedded script tag
    const dataScript = document.getElementById('game-data');
    if (!dataScript) {
      throw new Error('Could not find game-data script element. Make sure the HTML file contains the embedded JSON data.');
    }

    const rawContent = dataScript.textContent;
    if (!rawContent || rawContent.trim() === '') {
      throw new Error('Game data script element is empty. Check if JSON data is properly embedded.');
    }

    try {
      // Clean the content and parse JSON
      const cleanContent = rawContent.trim();
      this.data = JSON.parse(cleanContent);
      console.log('✅ Data loaded successfully:', {
        players: Object.keys(this.data.players || {}).length,
        games: Object.keys(this.data.games || {}).length,
        entries: (this.data.entries || []).length
      });
    } catch (jsonError) {
      console.error('❌ JSON parsing failed:', jsonError.message);
      console.error('Raw content length:', rawContent.length);
      console.error('First 200 chars:', rawContent.substring(0, 200));
      console.error('Last 200 chars:', rawContent.substring(rawContent.length - 200));

      // Try to identify common issues
      if (rawContent.includes('<!--')) {
        console.warn('⚠️  Found HTML comments in JSON - they should be removed');
      }
      if (!rawContent.trim().startsWith('{')) {
        console.warn('⚠️  JSON should start with {');
      }
      if (!rawContent.trim().endsWith('}')) {
        console.warn('⚠️  JSON should end with }');
      }

      throw new Error('Failed to parse game data JSON: ' + jsonError.message);
    }
  }

  initializeModules() {
    this.dataManager = new DataManager(this.data);
    this.leaderboardUI = new LeaderboardUI(this.dataManager, this);
    this.comparisonUI = new ComparisonUI(this.dataManager);
    this.chartsManager = new ChartsManager(this.dataManager);
    this.playerProfileUI = new PlayerProfileUI(this.dataManager, this.chartsManager);

    // Expose instances for inline handlers and debugging
    window.leaderboardUI = this.leaderboardUI;
    window.app = this;
  }

  setupEventListeners() {
    // Navigation buttons
    document.getElementById('leaderboard-btn').addEventListener('click', () => this.switchView('leaderboard'));
    document.getElementById('comparison-btn').addEventListener('click', () => this.switchView('comparison'));
    document.getElementById('profile-btn').addEventListener('click', () => this.switchView('profile'));

    // Time range filters
    document.querySelectorAll('.time-range-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentTimeRange = e.target.dataset.range;
        this.updateTimeRangeButtons();
        this.renderView();
      });
    });


  }

  switchView(view) {
    this.currentView = view;
    this.updateNavButtons();
    this.renderView();
  }

  updateNavButtons() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.getElementById(`${this.currentView}-btn`).classList.add('active');
  }

  updateTimeRangeButtons() {
    document.querySelectorAll('.time-range-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.range === this.currentTimeRange) {
        btn.classList.add('active');
      }
    });
  }

  renderView() {
    const content = document.getElementById('content');

    // Avoid opacity changes to reduce perceived stutter

    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      switch (this.currentView) {
        case 'leaderboard':
          // No charts in leaderboard view, so no need to destroy anything
          content.innerHTML = this.leaderboardUI.render(this.currentTimeRange);
          this.setupTimeRangeListeners();
          break;
        case 'comparison':
          // Destroy only comparison chart before recreating
          this.chartsManager.destroyChart('comparison-chart');
          content.innerHTML = this.comparisonUI.render();
          this.setupComparisonListeners();
          break;
        case 'profile':
          // Destroy charts from other views
          this.chartsManager.destroyChart('comparison-chart');
          content.innerHTML = this.playerProfileUI.render();
          this.playerProfileUI.setupEventListeners();
          break;
        default:
          // No charts in leaderboard view
          content.innerHTML = this.leaderboardUI.render(this.currentTimeRange);
          this.setupTimeRangeListeners();
      }

      // Done rendering
    });
  }

  setupTimeRangeListeners() {
    document.querySelectorAll('.time-range-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const newRange = e.target.closest('.time-range-btn').dataset.range;
        this.currentTimeRange = newRange;
        this.renderView();
      });
    });

    // Handle metric switching buttons
    document.querySelectorAll('.metric-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const gameId = e.currentTarget.dataset.game;
        const metric = e.currentTarget.dataset.metric;
        this.leaderboardUI.updateMetric(gameId, metric);
      });
    });

    // Handle quick date buttons
    document.querySelectorAll('.quick-date-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const onclick = e.currentTarget.getAttribute('onclick');
        if (onclick && onclick.includes('updateSelectedDate')) {
          // Extract the date from the onclick attribute
          const dateMatch = onclick.match(/'([^']+)'/);
          if (dateMatch && dateMatch[1]) {
            this.leaderboardUI.updateSelectedDate(dateMatch[1]);
          }
        }
      });
    });

    // Handle game tab buttons
    document.querySelectorAll('.game-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const gameId = e.currentTarget.dataset.game;
        this.leaderboardUI.switchGameTab(gameId);
      });
    });

    // Handle performance toggle buttons
    document.querySelectorAll('.performance-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const performance = e.currentTarget.dataset.performance;
        const showWorst = performance === 'worst';
        this.leaderboardUI.togglePerformanceView(showWorst);
      });
    });

    // Make the leaderboard UI available globally for date selector
    window.leaderboardUI = this.leaderboardUI;
    window.app = this;
  }

  setupComparisonListeners() {
    // Game tab switching
    document.querySelectorAll('.game-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const gameId = e.currentTarget.dataset.game;
        this.comparisonUI.activeGame = gameId;
        this.updateComparisonView();
      });
    });

    // No player selection or comparison chart type controls

    // Initialize the chart
    this.updateComparisonChart();
  }

  updateComparisonView() {
    // Update tab appearance
    document.querySelectorAll('.game-tab').forEach(tab => {
      const gameId = tab.dataset.game;
      const isActive = gameId === this.comparisonUI.activeGame;

      tab.classList.toggle('bg-blue-500', isActive);
      tab.classList.toggle('text-white', isActive);
      tab.classList.toggle('border-b-2', isActive);
      tab.classList.toggle('border-blue-500', isActive);
      tab.classList.toggle('text-gray-600', !isActive);
      tab.classList.toggle('hover:text-gray-900', !isActive);
      tab.classList.toggle('hover:bg-gray-50', !isActive);
    });

    // Update player selection appearance
    document.querySelectorAll('.player-select-card').forEach(card => {
      const checkbox = card.querySelector('.player-checkbox');
      const avatar = card.querySelector('.player-avatar');
      const isSelected = checkbox.checked;

      card.classList.toggle('border-green-400', isSelected);
      card.classList.toggle('bg-green-50', isSelected);
      card.classList.toggle('border-gray-200', !isSelected);
      card.classList.toggle('hover:border-blue-400', !isSelected);
      card.classList.toggle('hover:bg-blue-50', !isSelected);

      avatar.classList.toggle('bg-gradient-to-br', true);
      avatar.classList.toggle('from-green-500', isSelected);
      avatar.classList.toggle('to-emerald-600', isSelected);
      avatar.classList.toggle('from-blue-500', !isSelected);
      avatar.classList.toggle('to-purple-600', !isSelected);
    });

    // Update player count display
    const playerCountDisplay = document.querySelector('.text-sm.text-gray-600');
    if (playerCountDisplay) {
      const count = this.comparisonUI.selectedPlayers.size;
      if (count === 0) {
        playerCountDisplay.textContent = 'Select players to start analyzing';
      } else {
        playerCountDisplay.textContent = `${count} player${count > 1 ? 's' : ''} selected`;
      }
    }

    // Update game title
    const gameTitle = document.querySelector('h3.capitalize');
    if (gameTitle) {
      gameTitle.textContent = `${this.comparisonUI.activeGame} Analysis`;
    }

    // Update stats and chart
    this.comparisonUI.updateStatsSummary(this.comparisonUI.activeGame);
    this.updateComparisonChart();
  }

  updateComparisonChart() {
    const gameId = this.comparisonUI.activeGame;
    const selectedPlayers = Array.from(this.comparisonUI.selectedPlayers);

    if (gameId === 'zip') {
      this.createProgressionChart(gameId, selectedPlayers, 'time', 'zip-time-chart');
      this.createProgressionChart(gameId, selectedPlayers, 'backtracks', 'zip-backtracks-chart');
    } else {
      this.createProgressionChart(gameId, selectedPlayers, null, 'game-analysis-chart');
    }
  }

  createProgressionChart(gameId, selectedPlayers, metric = null, canvasId = 'game-analysis-chart') {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Destroy existing chart
    this.chartsManager.destroyChart(canvasId);

    const game = this.dataManager.rawData.games[gameId];
    if (!game) return;

    // Prepare datasets for each selected player
    const datasets = [];
    const colors = [
      { border: 'rgb(59, 130, 246)', background: 'rgba(59, 130, 246, 0.1)' },
      { border: 'rgb(16, 185, 129)', background: 'rgba(16, 185, 129, 0.1)' },
      { border: 'rgb(245, 158, 11)', background: 'rgba(245, 158, 11, 0.1)' },
      { border: 'rgb(239, 68, 68)', background: 'rgba(239, 68, 68, 0.1)' },
      { border: 'rgb(139, 92, 246)', background: 'rgba(139, 92, 246, 0.1)' },
      { border: 'rgb(6, 182, 212)', background: 'rgba(6, 182, 212, 0.1)' }
    ];

    selectedPlayers.forEach((playerId, index) => {
      const playerData = this.comparisonUI.getPlayerGameData(gameId, playerId);
      const playerName = this.dataManager.getPlayerDisplayName(playerId);

      const metricKey = metric || (game.hasTime ? 'time' : (game.hasGuesses ? 'guesses' : 'time'));
      const data = playerData
        .filter(entry => entry.metrics && entry.metrics[metricKey] !== undefined)
        .map(entry => ({ x: entry.gameNum, y: entry.metrics[metricKey] }));

      if (data.length > 0) {
        datasets.push({
          label: playerName,
          data: data,
          borderColor: colors[index % colors.length].border,
          backgroundColor: colors[index % colors.length].background,
          borderWidth: 2,
          fill: false,
          tension: 0.35,
          cubicInterpolationMode: 'monotone',
          pointRadius: 3,
          pointHoverRadius: 5
        });
      }
    });

    let metricLabel = 'Value';
    if (metric === 'time' || (!metric && game.hasTime)) metricLabel = 'Time (seconds)';
    else if (metric === 'guesses' || (!metric && game.hasGuesses)) metricLabel = 'Guesses';
    else if (metric === 'backtracks') metricLabel = 'Backtracks';

    this.chartsManager.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: `${gameId.charAt(0).toUpperCase() + gameId.slice(1)} ${metric === 'backtracks' ? 'Backtracks' : 'Performance'} Progression`,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'xy'
            },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: 'xy'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: 'Game Number'
            },
            ticks: {
              stepSize: 1
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: metricLabel
            },
            reverse: false
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }

  createComparisonChart(gameId, selectedPlayers) {
    const ctx = document.getElementById('game-analysis-chart');
    if (!ctx) return;

    // Destroy existing chart
    this.chartsManager.destroyChart('game-analysis-chart');

    const game = this.dataManager.rawData.games[gameId];
    if (!game) return;

    // Get latest performance for each player
    const labels = [];
    const data = [];

    selectedPlayers.forEach(playerId => {
      const playerData = this.comparisonUI.getPlayerGameData(gameId, playerId);
      const playerName = this.dataManager.getPlayerDisplayName(playerId);

      if (playerData.length > 0) {
        // Get the most recent entry for comparison
        const latestEntry = playerData[playerData.length - 1];
        const metric = game.hasTime ? latestEntry.metrics.time : latestEntry.metrics.guesses;

        labels.push(playerName);
        data.push(metric);
      }
    });

    const metricLabel = game.hasTime ? 'Latest Time (seconds)' : 'Latest Guesses';

    this.chartsManager.charts['game-analysis-chart'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: metricLabel,
          data: data,
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
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: `${gameId.charAt(0).toUpperCase() + gameId.slice(1)} Latest Performance Comparison`,
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: metricLabel
            },
            reverse: game.hasTime // Lower is better for time-based games
          }
        }
      }
    });
  }













  showError(message) {
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> ${message}
      </div>
    `;
  }


}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LinkedInLeaderboard();
});

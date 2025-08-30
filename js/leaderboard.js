// Leaderboard UI Module
class LeaderboardUI {
  constructor(dataManager, app = null) {
    this.dataManager = dataManager;
    this.currentMetric = {}; // Store current metric for each game
    this.selectedDate = new Date().toISOString().split('T')[0]; // Default to today
    this.activeGameTab = 'all'; // 'all' or specific game ID
    this.showWorstPerformers = false; // Toggle for top vs worst performers
    this.app = app; // Reference to main app for re-rendering
  }

  render(timeRange = 'allTime') {
    this.currentTimeRange = timeRange; // Store current time range
    let filteredEntries;

    if (timeRange === 'daily') {
      // For daily view, filter by selected date
      filteredEntries = this.dataManager.rawData.entries.filter(entry => entry.date === this.selectedDate);
    } else if (timeRange === 'allTime') {
      // For all-time view, show all entries
      filteredEntries = this.dataManager.rawData.entries;
    } else {
      // Use the processed time ranges for weekly and other filters
      filteredEntries = this.dataManager.processedData.timeRanges[timeRange] || this.dataManager.rawData.entries;
    }

    const gameStats = this.computeFilteredGameStats(filteredEntries);

    return `
      <div class="fade-in">
        <div class="mb-6">
          <h2 class="text-2xl font-bold mb-4">Game Leaderboards</h2>
          <div class="flex flex-wrap gap-2 mb-4">
            <button class="time-range-btn px-4 py-2 rounded-lg transition-colors ${timeRange === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}" data-range="daily">
              <i class="fas fa-calendar-day mr-2"></i>Daily
            </button>
            <button class="time-range-btn px-4 py-2 rounded-lg transition-colors ${timeRange === 'allTime' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}" data-range="allTime">
              <i class="fas fa-calendar-alt mr-2"></i>All Time
            </button>
          </div>

          <!-- Performance Toggle -->
          <div class="flex items-center gap-4 mb-6">
            <span class="text-sm font-medium text-gray-700">Show:</span>
            <div class="performance-toggle-container">
              <button class="performance-toggle-btn ${!this.showWorstPerformers ? 'active' : ''}" data-performance="top">
                <i class="fas fa-trophy mr-1"></i>Top Performances
              </button>
              <button class="performance-toggle-btn ${this.showWorstPerformers ? 'active' : ''}" data-performance="worst">
                <i class="fas fa-thumbs-down mr-1"></i>Worst Performances
              </button>
            </div>

          </div>

          ${timeRange === 'daily' ? this.renderDateSelector() : ''}
        </div>

        <!-- Game Tabs -->
        <div class="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div class="border-b border-gray-200">
            <nav class="flex overflow-x-auto">
              <button class="game-tab-btn px-4 py-3 text-center font-medium transition-colors duration-200 whitespace-nowrap ${
                this.activeGameTab === 'all'
                  ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }" data-game="all" onclick="window.leaderboardUI.switchGameTab('all')">
                <div class="flex items-center space-x-2">
                  <span class="text-lg"><i class="fas fa-th-large"></i></span>
                  <span>All Games</span>
                </div>
              </button>
              ${Object.keys(gameStats).map(gameId => `
                <button class="game-tab-btn px-4 py-3 text-center font-medium transition-colors duration-200 whitespace-nowrap ${
                  this.activeGameTab === gameId
                    ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }" data-game="${gameId}" onclick="window.leaderboardUI.switchGameTab('${gameId}')">
                  <div class="flex items-center space-x-2">
                    <span class="text-lg">${this.dataManager.getGameIcon(gameId)}</span>
                    <span class="capitalize">${gameId}</span>
                  </div>
                </button>
              `).join('')}
            </nav>
          </div>

          <div class="p-6">
            ${this.activeGameTab === 'all'
              ? `<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  ${Object.entries(gameStats).map(([gameId, entries]) =>
                    this.renderGameCard(gameId, entries)
                  ).join('')}
                </div>`
              : this.renderSingleGameView(this.activeGameTab, gameStats[this.activeGameTab])
            }
          </div>
        </div>


      </div>
    `;
  }

  computeFilteredGameStats(entries) {
    const gameStats = {};

    // Group entries by game
    entries.forEach(entry => {
      if (!gameStats[entry.game]) {
        gameStats[entry.game] = [];
      }
      gameStats[entry.game].push(entry);
    });

    // For allTime view, get best performance per player per game
    if (this.currentTimeRange === 'allTime') {
      Object.keys(gameStats).forEach(gameId => {
        const game = this.dataManager.rawData.games[gameId];
        if (!game) return;

        const currentMetric = this.currentMetric[gameId] || this.getDefaultMetric(game);

        // Group by player and get their best/worst performance based on toggle
        const playerPerformances = {};
        gameStats[gameId].forEach(entry => {
          const playerId = entry.playerId;
          if (!playerPerformances[playerId]) {
            playerPerformances[playerId] = entry;
          } else {
            const currentValue = this.getMetricValue(playerPerformances[playerId], currentMetric);
            const newValue = this.getMetricValue(entry, currentMetric);

            // For time/guesses/backtracks, lower is better for top, higher is worse for worst
            const shouldUpdate = this.showWorstPerformers
              ? (newValue > currentValue) // Get highest (worst) value for worst performers
              : (newValue < currentValue); // Get lowest (best) value for top performers

            if (shouldUpdate) {
              playerPerformances[playerId] = entry;
            }
          }
        });

        // Convert back to array and sort
        gameStats[gameId] = Object.values(playerPerformances);
        gameStats[gameId].sort((a, b) => {
          const aValue = this.getMetricValue(a, currentMetric);
          const bValue = this.getMetricValue(b, currentMetric);
          // For worst performers, we already have the worst performance per player,
          // so we sort descending (highest to lowest). For top performers, sort ascending.
          return this.showWorstPerformers ? bValue - aValue : aValue - bValue;
        });
      });
    } else {
      // For other time ranges, sort normally
      Object.keys(gameStats).forEach(gameId => {
        const game = this.dataManager.rawData.games[gameId];
        if (!game) return;

        const currentMetric = this.currentMetric[gameId] || this.getDefaultMetric(game);

        gameStats[gameId].sort((a, b) => {
          const aValue = this.getMetricValue(a, currentMetric);
          const bValue = this.getMetricValue(b, currentMetric);

          // For time and guesses, lower is better (ascending order)
          // For backtracks, lower is better too
          // Reverse sort for worst performers (higher values = worse performance)
          return this.showWorstPerformers ? bValue - aValue : aValue - bValue;
        });
      });
    }

    return gameStats;
  }

  getDefaultMetric(game) {
    if (game.hasTime) return 'time';
    if (game.hasGuesses) return 'guesses';
    if (game.hasBacktracks) return 'backtracks';
    return 'time'; // fallback
  }

  getMetricValue(entry, metric) {
    return entry.metrics[metric] || 0;
  }

  formatBestMetric(gameId, entries, game) {
    if (entries.length === 0) return 'N/A';

    const currentMetric = this.currentMetric[gameId] || this.getDefaultMetric(game);
    const bestEntry = entries[0]; // Already sorted by performance
    const value = this.getMetricValue(bestEntry, currentMetric);

    if (currentMetric === 'time') {
      return this.dataManager.formatTime(value);
    } else if (currentMetric === 'guesses') {
      return `${value} guesses`;
    } else if (currentMetric === 'backtracks') {
      return `${value} backtracks`;
    }

    return value.toString();
  }

  renderGameCard(gameId, entries) {
    const game = this.dataManager.rawData.games[gameId];
    const icon = this.dataManager.getGameIcon(gameId);

    if (entries.length === 0) {
      return `
        <div class="game-card bg-gray-50 rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
          <div class="text-center">
            <div class="text-3xl mb-2 opacity-50">${icon}</div>
            <h3 class="text-lg font-bold capitalize text-gray-600 mb-2">${gameId}</h3>
            <p class="text-gray-500 text-sm">No data available</p>
          </div>
        </div>
      `;
    }

    // Show top/worst 5 players by default, or all if fewer than 8 total
    const maxToShow = this.showWorstPerformers ? 5 : 10; // Show fewer for worst performers
    const showAll = entries.length <= (this.showWorstPerformers ? 8 : 15);
    const playersToShow = showAll ? entries : entries.slice(0, maxToShow);

    return `
      <div class="game-card bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
        <div class="border-b border-gray-100 pb-4 mb-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="text-3xl">${icon}</div>
              <div>
                              <h3 class="text-xl font-bold capitalize text-gray-800">${gameId}</h3>
              <p class="text-sm text-gray-600">${this.currentTimeRange === 'allTime' ? `${entries.length} personal ${this.showWorstPerformers ? 'worsts' : 'bests'}` : `${entries.length} entries`}</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-gray-600">${this.showWorstPerformers ? 'Worst Performance' : 'Best Performance'}</div>
              <div class="text-xl font-bold ${this.showWorstPerformers ? 'text-orange-600' : 'text-blue-600'}">
                ${this.formatBestMetric(gameId, playersToShow, game)}
              </div>
            </div>
          </div>
        </div>

        ${this.renderMetricSelector(gameId, game)}

        <div class="space-y-3">
          ${playersToShow.map((entry, index) => this.renderLeaderboardEntry(entry, index, game)).join('')}
        </div>

        ${!showAll ? `
          <div class="mt-4 text-center">
            <button class="show-more-btn px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                    onclick="this.closest('.game-card').querySelector('.full-list').classList.remove('hidden'); this.style.display='none'">
              <i class="fas fa-chevron-down mr-2"></i>Show ${entries.length - maxToShow} More Players
            </button>
          </div>

          <div class="full-list hidden space-y-3 mt-4">
            ${entries.slice(maxToShow).map((entry, index) => this.renderLeaderboardEntry(entry, index + maxToShow, game)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  togglePerformanceView(showWorst = null) {
    if (showWorst !== null) {
      this.showWorstPerformers = showWorst;
    } else {
      this.showWorstPerformers = !this.showWorstPerformers;
    }
    // Re-render the leaderboard
    if (this.app) {
      this.app.renderView();
    }
  }

  renderLeaderboardEntry(entry, rank, game) {
    const playerName = this.dataManager.rawData.players[entry.playerId];
    const initials = this.dataManager.getPlayerInitials(entry.playerId);
    const isTopThree = rank < 3;

    return `
      <div class="leaderboard-entry flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 ${isTopThree ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''}">
        <div class="flex items-center space-x-3">
          <div class="rank-badge flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${this.getRankStyle(rank)}">
            ${rank + 1}
          </div>
          <div class="player-avatar w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-500 to-purple-600">
            ${initials}
          </div>
          <div>
            <div class="font-medium text-gray-900">${this.dataManager.getPlayerDisplayName(entry.playerId)}</div>
            <div class="text-sm text-gray-500">${entry.date}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="metric-display font-bold text-lg ${this.getMetricColor(game)}">
            ${this.dataManager.formatMetric(entry.metrics, game)}
          </div>
          ${entry.metrics.backtracks !== undefined ? `
            <div class="text-sm text-gray-500">
              ${entry.metrics.backtracks} backtrack${entry.metrics.backtracks !== 1 ? 's' : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderRecentActivity() {
    const recentEntries = this.dataManager.processedData.recentActivity.slice(0, 10);

    if (recentEntries.length === 0) {
      return '<p class="text-gray-500 text-center py-8">No recent activity</p>';
    }

    return recentEntries.map(entry => {
      const playerName = this.dataManager.rawData.players[entry.playerId];
      const game = this.dataManager.rawData.games[entry.game];
      const icon = this.dataManager.getGameIcon(entry.game);

      return `
        <div class="activity-item flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
          <div class="flex items-center space-x-4">
            <div class="text-2xl">${icon}</div>
            <div class="player-avatar w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-green-500 to-blue-600">
              ${this.dataManager.getPlayerInitials(entry.playerId)}
            </div>
            <div>
              <div class="font-medium text-gray-900">${playerName}</div>
              <div class="text-sm text-gray-600">
                played <span class="font-medium capitalize">${entry.game}</span>
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="metric-display font-bold text-lg text-blue-600">
              ${this.dataManager.formatMetric(entry.metrics, game)}
            </div>
            <div class="text-sm text-gray-500">${this.formatDate(entry.date)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  getRankStyle(rank) {
    const styles = [
      'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white', // 1st
      'bg-gradient-to-br from-gray-300 to-gray-500 text-white',    // 2nd
      'bg-gradient-to-br from-red-500 to-red-700 text-white',     // 3rd - bright red, very visible
      'bg-gradient-to-br from-blue-400 to-blue-600 text-white',   // 4th
      'bg-gradient-to-br from-purple-400 to-purple-600 text-white'  // 5th+
    ];
    return styles[rank] || 'bg-gradient-to-br from-gray-400 to-gray-600 text-white';
  }

  getMetricColor(game) {
    if (game.hasTime) {
      return 'text-green-600';
    } else if (game.hasGuesses) {
      return 'text-purple-600';
    }
    return 'text-blue-600';
  }

  renderDateSelector() {
    const availableDates = [...new Set(this.dataManager.rawData.entries.map(entry => entry.date))]
      .sort((a, b) => new Date(a) - new Date(b)); // Sort ascending for better UX

    const currentIndex = availableDates.indexOf(this.selectedDate);
    const currentEntries = this.dataManager.rawData.entries.filter(entry => entry.date === this.selectedDate);

    return `
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-blue-800">
            <i class="fas fa-calendar-day mr-2"></i>Daily View
          </h3>
          <div class="text-sm text-blue-600">
            ${currentEntries.length} entries on ${this.formatDateForSelector(this.selectedDate)}
          </div>
        </div>

        <!-- Horizontal Date Scroller -->
        <div class="relative">
          <div class="overflow-x-auto scrollbar-hide pb-2" id="date-scroller" data-selected-date="${this.selectedDate}">
            <div class="flex space-x-2 px-2">
              ${availableDates.map((date, index) => {
                const isSelected = date === this.selectedDate;
                const dateObj = new Date(date);
                const isToday = date === new Date().toISOString().split('T')[0];
                const isYesterday = date === new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const entriesCount = this.dataManager.rawData.entries.filter(entry => entry.date === date).length;

                let label = '';
                let icon = 'fas fa-calendar';

                if (isToday) {
                  label = 'Today';
                  icon = 'fas fa-sun';
                } else if (isYesterday) {
                  label = 'Yesterday';
                  icon = 'fas fa-moon';
                } else {
                  label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }

                return `
                  <button class="date-pill flex-shrink-0 px-3 py-2 rounded-lg border transition-all duration-200 relative ${
                    isSelected
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }"
                          onclick="window.leaderboardUI.updateSelectedDate('${date}')"
                          title="${dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - ${entriesCount} entries"
                          data-date="${date}">
                    <div class="flex flex-col items-center space-y-1">
                      <div class="flex items-center space-x-1">
                        <i class="${icon} text-xs"></i>
                        <span class="font-medium text-sm">${label}</span>
                      </div>
                      ${entriesCount > 0 ? `<span class="text-xs opacity-75">${entriesCount}</span>` : ''}
                    </div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Scroll indicators -->
          <div class="absolute left-0 top-0 bottom-2 w-6 bg-gradient-to-r from-blue-50 to-transparent pointer-events-none z-10"></div>
          <div class="absolute right-0 top-0 bottom-2 w-6 bg-gradient-to-l from-blue-50 to-transparent pointer-events-none z-10"></div>
        </div>

        <!-- Navigation hints -->
        <div class="flex justify-center mt-2 text-xs text-gray-500">
          <span>← Scroll to see more dates →</span>
        </div>
      </div>
    `;
  }

  // Auto-scroll to selected date after rendering
  scrollToSelectedDate() {
    setTimeout(() => {
      const scroller = document.getElementById('date-scroller');
      const selectedButton = scroller?.querySelector(`[data-date="${this.selectedDate}"]`);
      if (selectedButton && scroller) {
        const buttonRect = selectedButton.getBoundingClientRect();
        const scrollerRect = scroller.getBoundingClientRect();
        const scrollLeft = scroller.scrollLeft + (buttonRect.left - scrollerRect.left) - (scrollerRect.width / 2) + (buttonRect.width / 2);
        scroller.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }, 100);
  }
  }



  renderSingleGameView(gameId, entries) {
    if (!entries || entries.length === 0) {
      return `<div class="text-center text-gray-500 py-8">
        <i class="fas fa-gamepad text-4xl mb-4"></i>
        <p>No entries found for ${gameId}</p>
      </div>`;
    }

    const game = this.dataManager.rawData.games[gameId];
    const topPlayers = entries.slice(0, 20); // Show top 20 for single game view

    return `
      <div class="space-y-4">
        <!-- Game Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-3">
            <div class="text-4xl">${this.dataManager.getGameIcon(gameId)}</div>
            <div>
              <h3 class="text-2xl font-bold capitalize text-gray-800">${gameId}</h3>
              <p class="text-gray-600">${this.currentTimeRange === 'allTime' ? `${entries.length} personal ${this.showWorstPerformers ? 'worsts' : 'bests'}` : `${entries.length} total entries`}</p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-medium text-gray-600">${this.showWorstPerformers ? 'Worst Performance' : 'Best Performance'}</div>
            <div class="text-2xl font-bold ${this.showWorstPerformers ? 'text-orange-600' : 'text-blue-600'}">
              ${this.formatBestMetric(gameId, playersToShow, game)}
            </div>
          </div>
        </div>

        <!-- Metric Selector -->
        ${this.renderMetricSelector(gameId, game)}

        <!-- Players List -->
        <div class="bg-gray-50 rounded-lg overflow-hidden">
          <div class="max-h-96 overflow-y-auto">
            ${topPlayers.map((entry, index) => `
              <div class="border-b border-gray-200 last:border-b-0">
                ${this.renderLeaderboardEntry(entry, index, game)}
              </div>
            `).join('')}
          </div>
        </div>

        ${entries.length > 20 ? `
          <div class="text-center text-gray-500 text-sm">
            Showing top 20 of ${entries.length} entries
          </div>
        ` : ''}
      </div>
    `;
  }

  switchGameTab(gameId) {
    this.activeGameTab = gameId;
    // Re-render the view with the new active tab
    if (this.app) {
      this.app.renderView();
    } else if (window.app) {
      window.app.renderView();
    }
  }

  updateSelectedDate(dateString) {
    this.selectedDate = dateString;
    // Re-render the view with the new date
    if (this.app) {
      this.app.renderView();
    } else if (window.app) {
      window.app.renderView();
    }
    // Auto-scroll to the selected date
    this.scrollToSelectedDate();
  }

  formatDateForSelector(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  renderMetricSelector(gameId, game) {
    if (!game.hasTime && !game.hasGuesses && !game.hasBacktracks) {
      return ''; // No metrics to switch
    }

    const metrics = [];
    if (game.hasTime) metrics.push('time');
    if (game.hasGuesses) metrics.push('guesses');
    if (game.hasBacktracks) metrics.push('backtracks');

    if (metrics.length <= 1) return ''; // Only one metric, no need for selector

    const currentMetric = this.currentMetric[gameId] || metrics[0];

    return `
      <div class="flex items-center space-x-2 mb-3">
        <span class="text-sm text-gray-600">Metric:</span>
        <div class="flex bg-gray-100 rounded-lg p-1">
          ${metrics.map(metric => `
            <button class="metric-btn px-3 py-1 text-xs rounded-md transition-colors ${
              currentMetric === metric ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }" data-game="${gameId}" data-metric="${metric}" onclick="window.leaderboardUI.updateMetric('${gameId}', '${metric}')">
              ${metric.charAt(0).toUpperCase() + metric.slice(1)}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  updateMetric(gameId, metric) {
    this.currentMetric[gameId] = metric;
    if (this.app) {
      this.app.renderView();
    } else if (window.app) {
      window.app.renderView();
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  }
}

window.leaderboardUI = null; // Will be set later

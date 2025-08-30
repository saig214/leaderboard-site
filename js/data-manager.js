// Data Manager - Handles data processing and computations
class DataManager {
  constructor(data) {
    this.rawData = data;
    this.processedData = this.processData();
  }

  processData() {
    return {
      gameStats: this.computeGameStats(),
      playerStats: this.computePlayerStats(),
      recentActivity: this.getRecentActivity(),
      timeRanges: this.computeTimeRangeStats()
    };
  }

  computeGameStats() {
    const gameStats = {};

    // Initialize stats for each game
    Object.keys(this.rawData.games).forEach(gameId => {
      gameStats[gameId] = {
        totalPlays: 0,
        uniquePlayers: new Set(),
        bestTime: null,
        avgTime: 0,
        leaderboard: [],
        recentEntries: []
      };
    });

    // Process all entries
    this.rawData.entries.forEach(entry => {
      const gameStat = gameStats[entry.game];
      if (!gameStat) return;

      gameStat.totalPlays++;
      gameStat.uniquePlayers.add(entry.playerId);

      // Handle time-based games
      if (entry.metrics.time !== undefined) {
        if (!gameStat.bestTime || entry.metrics.time < gameStat.bestTime) {
          gameStat.bestTime = entry.metrics.time;
        }
        gameStat.avgTime = ((gameStat.avgTime * (gameStat.totalPlays - 1)) + entry.metrics.time) / gameStat.totalPlays;
      }

      // Add to recent entries (last 5 per game)
      gameStat.recentEntries.unshift(entry);
      if (gameStat.recentEntries.length > 5) {
        gameStat.recentEntries.pop();
      }
    });

    // Create leaderboards
    Object.keys(gameStats).forEach(gameId => {
      const game = this.rawData.games[gameId];
      const entries = this.rawData.entries.filter(e => e.game === gameId);

      // Sort by performance
      const sortedEntries = entries.sort((a, b) => {
        if (game.hasTime) {
          return a.metrics.time - b.metrics.time;
        } else if (game.hasGuesses) {
          return a.metrics.guesses - b.metrics.guesses;
        }
        return 0;
      });

      gameStats[gameId].leaderboard = sortedEntries.slice(0, 10); // Top 10
      gameStats[gameId].uniquePlayers = gameStats[gameId].uniquePlayers.size;
    });

    return gameStats;
  }

  computePlayerStats() {
    const playerStats = {};

    // Initialize all players
    Object.keys(this.rawData.players).forEach(playerId => {
      playerStats[playerId] = {
        totalGames: 0,
        gamesByType: {},
        bestTimes: {},
        avgTimes: {},
        currentStreak: 0,
        longestStreak: 0,
        favoriteGame: null,
        totalTime: 0,
        achievements: []
      };
    });

    // Process entries
    this.rawData.entries.forEach(entry => {
      const stats = playerStats[entry.playerId];
      stats.totalGames++;

      // Track games by type
      if (!stats.gamesByType[entry.game]) {
        stats.gamesByType[entry.game] = 0;
      }
      stats.gamesByType[entry.game]++;

      // Handle time metrics
      if (entry.metrics.time !== undefined) {
        stats.totalTime += entry.metrics.time;

        if (!stats.bestTimes[entry.game] || entry.metrics.time < stats.bestTimes[entry.game]) {
          stats.bestTimes[entry.game] = entry.metrics.time;
        }

        if (!stats.avgTimes[entry.game]) {
          stats.avgTimes[entry.game] = { total: 0, count: 0 };
        }
        stats.avgTimes[entry.game].total += entry.metrics.time;
        stats.avgTimes[entry.game].count++;
      }
    });

    // Calculate averages and find favorite games
    Object.keys(playerStats).forEach(playerId => {
      const stats = playerStats[playerId];

      // Calculate averages
      Object.keys(stats.avgTimes).forEach(game => {
        stats.avgTimes[game].average = stats.avgTimes[game].total / stats.avgTimes[game].count;
      });

      // Find favorite game
      let maxGames = 0;
      Object.entries(stats.gamesByType).forEach(([game, count]) => {
        if (count > maxGames) {
          maxGames = count;
          stats.favoriteGame = game;
        }
      });


    });

    return playerStats;
  }

  getRecentActivity(limit = 15) {
    return this.rawData.entries
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }

  // Game number to date mapping based on reference points
  // Reference: Aug 30, 2025
  gameNumberToDate(gameName, gameNum) {
    // Reference points for Aug 30, 2025
    const referenceDate = new Date('2025-08-30');
    const referenceGameNumbers = {
      'zip': 166,
      'queens': 487,
      'tango': 327,
      'pinpoint': 487,
      'minisudoku': 19,
      'crossclimb': 487
    };

    const gameKey = gameName.toLowerCase();
    const referenceGameNum = referenceGameNumbers[gameKey];

    if (!referenceGameNum) {
      // If game not in reference, use zip as fallback
      return referenceDate.toISOString().split('T')[0];
    }

    // Calculate days difference: 1 game per day
    const daysDifference = gameNum - referenceGameNum;

    // Calculate the actual date
    const gameDate = new Date(referenceDate);
    gameDate.setDate(gameDate.getDate() + daysDifference);

    return gameDate.toISOString().split('T')[0];
  }

  computeTimeRangeStats() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    return {
      daily: this.rawData.entries.filter(entry => entry.date === today),
      allTime: this.rawData.entries
    };
  }

  getGameIcon(gameId) {
    const icons = {
      zip: '🏁',
      tango: '🎯',
      queens: '👑',
      crossclimb: '🪜',
      minisudoku: '🔢',
      pinpoint: '🎯'
    };
    return icons[gameId] || '🎮';
  }

  formatTime(seconds) {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }

  formatMetric(metrics, game) {
    if (game.hasTime && metrics.time !== undefined) {
      return this.formatTime(metrics.time);
    } else if (game.hasGuesses && metrics.guesses !== undefined) {
      return `${metrics.guesses} guesses`;
    } else if (game.hasTime && game.hasBacktracks && metrics.time !== undefined && metrics.backtracks !== undefined) {
      return `${this.formatTime(metrics.time)} (${metrics.backtracks} backtracks)`;
    }
    return 'N/A';
  }

  getPlayerDisplayName(playerId) {
    const name = this.rawData.players[playerId];
    // Define nicknames for specific players
    const nicknames = {
      "jayasuriyanalagarsamy": "Jaya",
      "hariharasubramaniyank": "Hari",
      "sanjaysrinivasan": "Sanjay",
      "abilashashok": "Abilash",
      "prasannasairamg": "Sai",
      "sivaranjaniiramamurthy": "Siva"
    };

    if (nicknames[playerId]) {
      return nicknames[playerId];
    }

    // Default: return first name
    return name.split(' ')[0];
  }

  getPlayerInitials(playerId) {
    const name = this.rawData.players[playerId];
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 3);
  }
}

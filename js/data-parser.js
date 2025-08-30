// Data Parser Module - For parsing LinkedIn messages
class DataParser {
  constructor() {
    this.parsedData = {
      players: {},
      games: {},
      entries: []
    };
  }

  parseBatch(messages) {
    console.log('Parsing batch of', messages.length, 'messages');
    this.parsedData = {
      players: {},
      games: {},
      entries: []
    };

    messages.forEach((message, index) => {
      try {
        const entry = this.parseSingleMessage(message.trim());
        if (entry) {
          this.parsedData.entries.push(entry);

          // Add player if not exists
          if (!this.parsedData.players[entry.playerId]) {
            this.parsedData.players[entry.playerId] = this.extractPlayerName(message);
          }

          // Add game if not exists
          if (!this.parsedData.games[entry.game]) {
            this.parsedData.games[entry.game] = this.inferGameConfig(entry.game);
          }
        }
      } catch (error) {
        console.warn(`Failed to parse message ${index + 1}:`, error);
      }
    });

    return this.parsedData;
  }

  parseSingleMessage(message) {
    // Skip empty messages or system messages
    if (!message || message.trim().length === 0) return null;

    // Extract player name from message header pattern
    const playerMatch = message.match(/^([^\n]+?)\s+sent the following message/);
    if (!playerMatch) return null; // Not a game message

    const playerName = playerMatch[1].trim();

    // Extract game information using regex patterns
    const gamePatterns = {
      zip: /Zip #(\d+)\s*\|\s*([\d:]+)(?:\s*and flawless)?/i,
      tango: /Tango #(\d+)\s*\|\s*([\d:]+)(?:\s*and flawless)?/i,
      queens: /Queens #(\d+)\s*\|\s*([\d:]+)(?:\s*and flawless)?/i,
      minisudoku: /Mini Sudoku #(\d+)\s*\|\s*([\d:]+)(?:\s*and flawless)?/i,
      pinpoint: /Pinpoint #(\d+)(?:\s*\|\s*(\d+)\s*guesses?)?/i,
      crossclimb: /Crossclimb #(\d+)\s*\|\s*([\d:]+)(?:\s*and flawless)?/i
    };

    let gameData = null;

    for (const [gameName, pattern] of Object.entries(gamePatterns)) {
      const match = message.match(pattern);
      if (match) {
        gameData = {
          playerId: this.normalizePlayerId(playerName),
          game: gameName,
          gameNum: parseInt(match[1]),
          metrics: {}
        };

        // Extract metrics based on game type
        if (gameName === 'pinpoint') {
          if (match[2]) {
            gameData.metrics.guesses = parseInt(match[2]);
          } else {
            // Sometimes pinpoint messages don't have guesses
            gameData.metrics.guesses = null;
          }
        } else {
          // Time-based games
          gameData.metrics.time = this.parseTime(match[2]);
        }

        // Extract backtracks for Zip
        if (gameName === 'zip') {
          const backtrackMatch = message.match(/With (\d+) backtracks?/i);
          if (backtrackMatch) {
            gameData.metrics.backtracks = parseInt(backtrackMatch[1]);
          } else if (message.includes('no backtracks')) {
            gameData.metrics.backtracks = 0;
          }
        }

        break;
      }
    }

    if (gameData) {
      // Add date (use current date if not specified)
      gameData.date = this.getCurrentDate();

      console.log('Parsed:', gameData);
      return gameData;
    }

    return null;
  }

  extractPlayerName(message) {
    const playerMatch = message.match(/^([^\n]+?)\s+sent the following message/);
    return playerMatch ? playerMatch[1].trim() : "Unknown Player";
  }

  normalizePlayerId(playerName) {
    // Create a consistent ID from player name
    // Remove special characters and convert to lowercase
    return playerName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
      .replace(/\s+/g, '') // Remove spaces
      .trim();
  }

  parseTime(timeString) {
    // Parse time formats like "0:08", "1:05", "2:28" into seconds
    const parts = timeString.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]);
      const seconds = parseInt(parts[1]);
      return minutes * 60 + seconds;
    }
    return 0;
  }

  getCurrentDate() {
    // Return current date in YYYY-MM-DD format
    return new Date().toISOString().split('T')[0];
  }

  inferGameConfig(gameName) {
    // Infer game configuration based on game name
    const gameConfigs = {
      'zip': { hasTime: true, hasBacktracks: true },
      'tango': { hasTime: true },
      'queens': { hasTime: true },
      'crossclimb': { hasTime: true },
      'minisudoku': { hasTime: true },
      'pinpoint': { hasGuesses: true }
    };

    return gameConfigs[gameName.toLowerCase()] || { hasTime: true };
  }

  exportJSON() {
    return JSON.stringify(this.parsedData, null, 2);
  }

  validateData() {
    const errors = [];

    if (Object.keys(this.parsedData.players).length === 0) {
      errors.push("No players found");
    }

    if (Object.keys(this.parsedData.games).length === 0) {
      errors.push("No games found");
    }

    if (this.parsedData.entries.length === 0) {
      errors.push("No game entries found");
    }

    this.parsedData.entries.forEach((entry, index) => {
      if (!entry.playerId || !entry.game || !entry.date || !entry.metrics) {
        errors.push(`Entry ${index + 1} is missing required fields`);
      }
    });

    return errors;
  }
}
import express from 'express';
import { RequestHandler } from 'express-serve-static-core';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';

// Import game logic, data, types, and config
import { DefaultGameManager } from './gameManager';
import { config as gameConfigConstants } from './config';
import { cards } from './data/cards';
import { enemies } from './data/enemies';
import { buffs } from './data/buffs';
import { GameConfig, GameState, ActionRequest } from './types'; // Added GameState, ActionRequest

// Create an Express application
const app = express();
const port = process.env.PORT || 3001; // Use environment variable or default port

// --- Middleware ---
// Enable CORS for all origins (you might want to restrict this in production)
app.use(cors());

// Add middleware to parse JSON request bodies
app.use(express.json());

// Create an HTTP server
const server = http.createServer(app);

// Create WebSocket server attached to the HTTP server
const wss = new WebSocketServer({ server });

// --- Game Configuration Loading ---
// Construct the full GameConfig object
const gameConfig: GameConfig = {
  // Spread the constants from config.ts
  ...gameConfigConstants,
  // Add card and enemy definitions
  cards: cards,
  enemies: enemies,
  // Add buff definitions (assuming an empty object for now, update if buffs.ts exists)
  buffs: buffs,
};

// --- Instantiate Game Manager ---
const gameManager = new DefaultGameManager(gameConfig);
console.log("Game Manager Initialized.");

// Store active WebSocket connections (mapping playerId to WebSocket instance)
const activeConnections = new Map<string, WebSocket>();
// Store WebSocket instance to playerId mapping for easier cleanup on close
const wsPlayerMap = new Map<WebSocket, string>();

// --- Type Definitions for Route Handlers ---
interface GetStateParams {
  playerId: string;
}

interface ValidateActionBody {
  playerId?: string;
  action?: ActionRequest;
}

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// --- API Endpoints ---

// GET /api/config - Return static game configuration
app.get('/api/config', (req, res) => {
  try {
    res.json(gameConfig);
  } catch (error) {
    console.error("Error fetching /api/config:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/state/:playerId - Return the current game state for a player
// Use type casting to specify the handler type
app.get('/api/state/:playerId', function(req, res) {
  const { playerId } = req.params;
  if (!playerId) {
    return res.status(400).json({ error: "playerId parameter is required" });
  }
  try {
    const state = gameManager.getState(playerId);
    res.json(state);
  } catch (error) {
    console.error(`Error fetching /api/state/${playerId}:`, error);
    res.status(500).json({ error: "Internal Server Error fetching game state" });
  }
} as RequestHandler<GetStateParams>);

// POST /api/validate-action - Validates player actions and broadcasts state updates
// Use type casting to specify the handler type
app.post('/api/validate-action', async function(req, res) {
  const { playerId, action } = req.body as ValidateActionBody;

  if (!playerId || !action) {
    return res.status(400).json({ error: "playerId and action are required in the request body" });
  }

  console.log(`Received action validation request for player ${playerId}:`, action);

  try {
    // Call the actual game manager validation and AWAIT the result
    const validationResult = await gameManager.validateAction(playerId, action);

    // If the action was successful, potentially run enemy turn and broadcast
    if (validationResult.success) {
      // Get the state *after* the player's action has been applied
      let stateAfterPlayerAction = gameManager.getState(playerId);

      // --- Start Step 33: Trigger Enemy Turn and Broadcast After ---
      let finalStateToBroadcast = stateAfterPlayerAction;

      // Check if the player's action ended their turn
      if (stateAfterPlayerAction.turn === 'enemy') {
        console.log(`Player ${playerId}'s action resulted in enemy turn. Running enemy turn...`);
        // Run the enemy turn logic, which modifies the state object directly
        gameManager.runEnemyTurn(stateAfterPlayerAction);
        // The state object is now updated with the results of the enemy turn
        // finalStateToBroadcast already references the modified state object
        console.log(`Enemy turn completed for player ${playerId}. New turn: ${finalStateToBroadcast.turn}, Phase: ${finalStateToBroadcast.phase}`);

        // Check if turn switched back to player after enemy turn
        if (finalStateToBroadcast.turn === 'player' && finalStateToBroadcast.phase === 'fighting') {
            console.log(`Turn switched back to player ${playerId}. Applying player start-of-turn buffs.`);
            gameManager.applyStartOfTurnBuffs(finalStateToBroadcast.player);
            // NOTE: No need to get state again, applyStartOfTurnBuffs modifies the object
        }
      }
      // --- End Step 33 ---

      // Broadcast the final state (either after player action or after enemy turn)
      const ws = activeConnections.get(playerId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        const stateUpdateMessage = {
          type: 'state_update',
          payload: {
            gameState: finalStateToBroadcast, // Use the final state
          },
        };
        ws.send(JSON.stringify(stateUpdateMessage));
        console.log(`Sent state_update to player ${playerId} (Turn: ${finalStateToBroadcast.turn}, Phase: ${finalStateToBroadcast.phase})`);
      } else {
        console.warn(`WebSocket not found or not open for player ${playerId} after action/enemy turn.`);
      }
    }

    // Send the validation result back via HTTP (this doesn't need the game state)
    res.json(validationResult);
  } catch (error) {
    console.error(`Error validating action for player ${playerId}:`, error);
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message || "Internal server error during action validation" });
    } else {
      res.status(500).json({ success: false, message: "An unexpected error occurred during action validation" });
    }
  }
} as RequestHandler);

// --- WebSocket Handling ---
// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');
  let registeredPlayerId: string | null = null; // Keep track of the player ID for this connection

  ws.on('message', (message) => {
    console.log('received: %s', message);
    try {
      const parsedMessage = JSON.parse(message.toString());

      // Handle 'register' message (Step 10)
      if (parsedMessage.type === 'register' && parsedMessage.payload?.playerId) {
        const playerId = parsedMessage.payload.playerId;
        registeredPlayerId = playerId; // Store for cleanup
        console.log(`Registering player ${playerId}`);

        // Check if player is already connected
        if (activeConnections.has(playerId)) {
          console.warn(`Player ${playerId} already connected. Closing previous connection.`);
          activeConnections.get(playerId)?.close(1000, 'New connection established');
          activeConnections.delete(playerId);
          // Find and remove the old ws from wsPlayerMap
          for (const [socket, pId] of wsPlayerMap.entries()) {
              if (pId === playerId) {
                  wsPlayerMap.delete(socket);
                  break;
              }
          }
        }

        // Store the new connection
        activeConnections.set(playerId, ws);
        wsPlayerMap.set(ws, playerId); // Map ws to playerId for easier lookup on close

        // Get initial state and config (uses temporary state if new player)
        const initialState: GameState = gameManager.getState(playerId);
        const configToSend: GameConfig = gameConfig; // Use the already loaded gameConfig

        // Send 'init' message back to the client
        const initMessage = {
          type: 'init',
          payload: {
            gameState: initialState,
            gameConfig: configToSend,
          },
        };
        ws.send(JSON.stringify(initMessage));
        console.log(`Sent 'init' to player ${playerId}`);

      } else {
        console.warn('Received unhandled message format:', parsedMessage);
        // Optionally send an error message back to the client
        // ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid message format' } }));
      }
    } catch (error) {
      console.error('Failed to parse message or invalid message format:', error);
      // Optionally send an error message back to the client
      // ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid message format' } }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Remove connection from maps when client disconnects (Step 10)
    const playerId = wsPlayerMap.get(ws); // Use the reverse map to find playerId
    if (playerId) {
        console.log(`Cleaning up connection for player ${playerId}`);
        activeConnections.delete(playerId);
        wsPlayerMap.delete(ws);
    } else {
        console.log('Disconnected client was not registered.');
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    // Also attempt cleanup on error
    const playerId = wsPlayerMap.get(ws);
    if (playerId) {
        console.log(`Cleaning up errored connection for player ${playerId}`);
        activeConnections.delete(playerId);
        wsPlayerMap.delete(ws);
    }
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Export the server and app for potential future use (e.g., testing)
export { server, app, wss, activeConnections, gameManager }; 
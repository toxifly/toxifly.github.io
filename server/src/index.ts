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
import { GameConfig, GameState, ActionRequest, CardDefinition } from './types';

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

// Define an interface for the actual body structure sent by GamesFun SDK
interface GamesFunActionRequestBody {
  actionName?: string;
  params?: {
    privyId?: string;
    // Include other params if needed, e.g., walletAddress
  };
  // Include other top-level fields if needed, e.g., gameId, requestId
}

// --- Helper Type & Function for Validation ---
// Define the union type for valid action names directly from ActionRequest
type ValidActionType = ActionRequest['type'];

// Create a Set of valid action types for efficient checking
const validActionTypes = new Set<ValidActionType>([
  'autoPlayCard',
  'selectReward',
  'newGame',
  'startBattle'
]);

// Type guard function to check if a string is a valid action type
function isValidActionType(type: string): type is ValidActionType {
  return validActionTypes.has(type as ValidActionType);
}

// Interface for selectReward payload extraction from params
interface SelectRewardParams {
    cardIndex?: number | string; // Allow string temporarily for parsing
    // Add other potential params here if needed by other actions
}
// --- End Helper ---

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
app.post('/api/validate-action', async function(req, res) {
  console.log('Received /api/validate-action request');
  console.log('Actual Request Body:', req.body);

  // --- Updated Extraction Logic ---
  const body = req.body as GamesFunActionRequestBody;
  const playerId = body.params?.privyId;
  const actionName = body.actionName; // Still a string here

  // --- Refined Payload Extraction ---
  let action: ActionRequest | undefined = undefined;
  let payload: any = {}; // Initialize payload

  if (actionName && isValidActionType(actionName)) {
    // Action name is valid, now construct payload based on type
    const actionParams = body.params as any; // Cast params for easier access (use specific interfaces if preferred)

    switch (actionName) {
      case 'selectReward':
        const rawCardIndex = actionParams?.cardIndex;
        if (rawCardIndex !== undefined && !isNaN(Number(rawCardIndex))) {
            payload = { cardIndex: Number(rawCardIndex) };
            console.log(`Extracted payload for 'selectReward':`, payload);
        } else {
            console.error(`Validation Error: Missing or invalid cardIndex for action 'selectReward'. Received:`, rawCardIndex, { body });
            return res.status(400).json({ error: `Missing or invalid cardIndex number for action 'selectReward'.` });
        }
        break;
      // Add cases for other actions needing specific payloads in body.params
      // case 'someOtherAction':
      //   const someData = actionParams?.someData;
      //   if (someData) {
      //     payload = { someData: someData };
      //   } else {
      //      return res.status(400).json({ error: `Missing someData for action 'someOtherAction'.` });
      //   }
      //   break;
      default:
        // For actions like 'startBattle', 'autoPlayCard', 'newGame'
        // where no specific payload is expected from body.params by gameManager.
        payload = {}; // Empty payload is sufficient
        break;
    }
    action = { type: actionName, payload: payload };

  } else if (actionName) {
      // actionName was provided, but it's not a valid one
      console.error(`Validation Error: Invalid actionName '${actionName}' received.`, { body });
      return res.status(400).json({ error: `Invalid actionName: ${actionName}` });
  }
  // --- End Payload Extraction ---


  // --- Use Extracted Values for Validation ---
  if (!playerId) {
    console.error('Validation Error: Missing params.privyId (playerId) in request body.', { body });
    return res.status(400).json({ error: "playerId (in params.privyId) is required in the request body" });
  }
  // Check if action is still undefined (meaning actionName was missing or invalid)
  if (!action) { // This covers the case where actionName was missing OR invalidActionType was hit earlier
    console.error('Validation Error: Missing or invalid actionName in request body.', { body });
    return res.status(400).json({ error: "A valid actionName is required in the request body" });
  }
  // --- End Validation Update ---

  console.log(`Processing action validation for player ${playerId}:`, action); // Log includes payload now

  try {
    // Call the game manager - it now receives a correctly typed action with payload
    const validationResult = await gameManager.validateAction(playerId, action);

    // If the action was successful, potentially run enemy turn and broadcast
    if (validationResult.success && validationResult.message !== "Game Over") { // Don't run enemy turn if game over
      // Get the state *after* the player's action has been applied
      let stateAfterPlayerAction = gameManager.getState(playerId);

      // --- Start Step 33: Trigger Enemy Turn and Broadcast After ---
      let finalStateToBroadcast = stateAfterPlayerAction;

      // Check if the player's action ended their turn
      if (stateAfterPlayerAction.turn === 'enemy' && stateAfterPlayerAction.phase === 'fighting') { // Check phase too
        console.log(`>>> Player ${playerId}'s action resulted in enemy turn. STARTING enemy turn processing...`);

        // Run the enemy turn logic. It handles its own start/end turn buffs.
        console.log(`>>> Calling gameManager.runEnemyTurn for player ${playerId}'s game...`);
        gameManager.runEnemyTurn(stateAfterPlayerAction); // Modifies stateAfterPlayerAction directly
        console.log(`>>> Completed gameManager.runEnemyTurn for player ${playerId}'s game.`);

        // stateAfterPlayerAction now reflects the state *after* the enemy turn
        console.log(`>>> Enemy turn processing completed for player ${playerId}. Post-Enemy Turn State => Turn: ${finalStateToBroadcast.turn}, Phase: ${finalStateToBroadcast.phase}`);

        // Check if turn switched back to player *after* enemy turn completed
        if (finalStateToBroadcast.turn === 'player' && finalStateToBroadcast.phase === 'fighting') {
            console.log(`>>> Turn switched back to player ${playerId}. Resetting energy, applying start-of-turn buffs, and clearing last enemy card.`);
            // *** Clear the enemy card ID before broadcasting player turn state ***
            finalStateToBroadcast.lastEnemyCardPlayedId = null;
            // --- Reset Player Energy ---
            finalStateToBroadcast.player.energy = finalStateToBroadcast.player.maxEnergy;
            console.log(`>>> Player ${playerId} energy reset to ${finalStateToBroadcast.player.energy}`);
            // --- Apply Player Start-of-Turn Buffs ---
            gameManager.applyStartOfTurnBuffs(finalStateToBroadcast.player); // Apply player start-of-turn buffs NOW
            console.log(`>>> Player start-of-turn buffs applied.`);
            // --- Save state after energy reset and buffs ---
            gameManager.setState(playerId, finalStateToBroadcast); // Ensure state is saved before broadcasting
        }
      }
      // --- End Step 33 ---

      // Broadcast the final state (potentially modified by enemy turn and/or player start buffs/energy reset)
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
        console.warn(`WebSocket not found or not open for player ${playerId} after action/turn processing.`);
      }
    } else if (validationResult.success && validationResult.message === "Game Over") {
        // Handle Game Over: broadcast final state if needed
        const finalState = gameManager.getState(playerId);
        const ws = activeConnections.get(playerId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            const stateUpdateMessage = {
                type: 'state_update', // Could be a specific 'gameOver' type
                payload: { gameState: finalState },
            };
            ws.send(JSON.stringify(stateUpdateMessage));
            console.log(`Sent final state_update (Game Over) to player ${playerId}`);
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
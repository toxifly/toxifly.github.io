import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';

// Core Modules
import { DefaultGameManager } from './gameManager';
import { loadGameConfig } from './config/gameConfig'; // Import the config loader
import { registerApiRoutes } from './api/routes'; // Import API routes setup
import { setupWebSocketHandling } from './websocket/connectionHandler'; // Import WebSocket setup

// --- Initialization ---
const app = express();
const port = process.env.PORT || 3001;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Load Game Configuration ---
const gameConfig = loadGameConfig();

// --- Instantiate Game Manager ---
const gameManager = new DefaultGameManager(gameConfig);

// --- Connection Storage ---
// Store active WebSocket connections (mapping playerId to WebSocket instance)
const activeConnections = new Map<string, WebSocket>();
// Store WebSocket instance to playerId mapping for easier cleanup on close
const wsPlayerMap = new Map<WebSocket, string>();


// --- Register API Routes ---
registerApiRoutes(app, gameManager, gameConfig, activeConnections);

// --- Setup WebSocket Handling ---
setupWebSocketHandling(wss, gameManager, gameConfig, activeConnections, wsPlayerMap);

// --- Start Server ---
server.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server listening on port ${port} on host 0.0.0.0`);
});

// --- Exports (Optional) ---
// Keep exports if they are needed for testing or other potential integrations
export { server, app, wss, activeConnections, gameManager, wsPlayerMap }; 
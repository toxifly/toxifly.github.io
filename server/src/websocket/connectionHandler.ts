import { WebSocketServer, WebSocket } from 'ws';
import { DefaultGameManager } from '../gameManager';
import { GameConfig, GameState } from '../types';

/**
 * Sets up WebSocket connection handling and message processing.
 * @param wss The WebSocketServer instance.
 * @param gameManager The game manager instance.
 * @param gameConfig The loaded game configuration.
 * @param activeConnections Map to store active connections (playerId -> WebSocket).
 * @param wsPlayerMap Map to store the reverse mapping (WebSocket -> playerId) for cleanup.
 */
export function setupWebSocketHandling(
    wss: WebSocketServer,
    gameManager: DefaultGameManager,
    gameConfig: GameConfig,
    activeConnections: Map<string, WebSocket>,
    wsPlayerMap: Map<WebSocket, string>
): void {

    wss.on('connection', (ws) => {
        console.log('Client connected via WebSocket');
        let registeredPlayerId: string | null = null;

        ws.on('message', (message) => {
            console.log('WS received: %s', message);
            try {
                const parsedMessage = JSON.parse(message.toString());

                if (parsedMessage.type === 'register' && parsedMessage.payload?.playerId) {
                    const playerId = parsedMessage.payload.playerId;
                    registeredPlayerId = playerId;
                    console.log(`Registering player ${playerId} via WebSocket`);

                    // Handle potential existing connection
                    if (activeConnections.has(playerId)) {
                        console.warn(`Player ${playerId} already connected. Closing previous WS connection.`);
                        activeConnections.get(playerId)?.close(1000, 'New connection established');
                        // No need to manually remove from wsPlayerMap here, the 'close' handler below will do it.
                    }

                    // Store new connection
                    activeConnections.set(playerId, ws);
                    wsPlayerMap.set(ws, playerId);

                    // Get initial state and send 'init'
                    const initialState: GameState = gameManager.getState(playerId);
                    const initMessage = {
                        type: 'init',
                        payload: {
                            gameState: initialState,
                            gameConfig: gameConfig,
                        },
                    };
                    ws.send(JSON.stringify(initMessage));
                    console.log(`Sent 'init' message to player ${playerId}`);

                } else {
                    console.warn('WS received unhandled message format:', parsedMessage);
                    // Optionally send error back: ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid message format' } }));
                }
            } catch (error) {
                console.error('WS failed to parse message or invalid message format:', error);
                // Optionally send error back: ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid message format' } }));
            }
        });

        ws.on('close', () => {
            const playerId = wsPlayerMap.get(ws); // Find player ID using the map
            if (playerId) {
                console.log(`WebSocket connection closed for player ${playerId}. Cleaning up.`);
                // Only delete from activeConnections if the closed socket is the *current* one for that player
                if (activeConnections.get(playerId) === ws) {
                     activeConnections.delete(playerId);
                     console.log(`Removed player ${playerId} from activeConnections.`);
                } else {
                    console.log(`Closed WebSocket was not the primary connection for player ${playerId}. No activeConnection deleted.`);
                }
                wsPlayerMap.delete(ws); // Always remove from the reverse map
            } else {
                console.log('WebSocket client disconnected before registering.');
            }
        });

        ws.on('error', (error) => {
            const playerId = wsPlayerMap.get(ws);
            console.error(`WebSocket error for player ${playerId || 'unregistered'}:`, error);
            // Attempt cleanup similar to 'close'
            if (playerId) {
                 if (activeConnections.get(playerId) === ws) {
                     activeConnections.delete(playerId);
                 }
                wsPlayerMap.delete(ws);
            }
            // Ensure the socket is closed if an error occurred
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.terminate(); // Force close on error
            }
        });
    });

    console.log("WebSocket Handling Setup Complete.");
} 
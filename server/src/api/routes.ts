import express, { Express, RequestHandler } from 'express';
import { WebSocket, WebSocketServer } from 'ws'; // Import WebSocket types
import { DefaultGameManager } from '../gameManager';
import { GameConfig, ActionRequest, GameState } from '../types';

// --- Type Definitions for Route Handlers ---
interface GetStateParams {
    playerId: string;
}

// Define an interface for the actual body structure sent by GamesFun SDK
interface GamesFunActionRequestBody {
    actionName?: string;
    params?: {
        privyId?: string;
        // Include other params if needed, e.g., cardIndex, walletAddress
        cardIndex?: number | string; // Example for selectReward
    };
    // Include other top-level fields if needed, e.g., gameId, requestId
}

// --- Helper Type & Function for Validation ---
type ValidActionType = ActionRequest['type'];
const validActionTypes = new Set<ValidActionType>(['autoPlayCard', 'selectReward', 'newGame', 'startBattle']);

function isValidActionType(type: string): type is ValidActionType {
    return validActionTypes.has(type as ValidActionType);
}

/**
 * Registers API routes with the Express application.
 * @param app The Express application instance.
 * @param gameManager The game manager instance.
 * @param gameConfig The loaded game configuration.
 * @param activeConnections Map of active WebSocket connections (playerId -> WebSocket).
 */
export function registerApiRoutes(
    app: Express,
    gameManager: DefaultGameManager,
    gameConfig: GameConfig,
    activeConnections: Map<string, WebSocket>
): void {

    // --- Health Check ---
    app.get('/healthz', (req, res) => {
        res.status(200).send('OK');
    });

    // --- Basic Test Route ---
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

    // GET /api/state/:playerId - Return current game state
    app.get('/api/state/:playerId', function (req, res) {
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

    // POST /api/validate-action - Validate actions and broadcast state updates
    app.post('/api/validate-action', async function (req, res) {
        console.log('Received /api/validate-action request');
        console.log('Actual Request Body:', req.body);

        const body = req.body as GamesFunActionRequestBody;
        const playerId = body.params?.privyId;
        const actionName = body.actionName; // Still a string here

        let action: ActionRequest | undefined = undefined;
        let payload: any = {};

        if (actionName && isValidActionType(actionName)) {
            const actionParams = body.params as any;

            switch (actionName) {
                case 'selectReward':
                    const rawCardIndex = actionParams?.cardIndex;
                    if (rawCardIndex !== undefined && !isNaN(Number(rawCardIndex))) {
                        payload = { cardIndex: Number(rawCardIndex) };
                    } else {
                        console.error(`Validation Error: Missing or invalid cardIndex for action 'selectReward'. Received:`, rawCardIndex);
                        return res.status(400).json({ error: `Missing or invalid cardIndex number for action 'selectReward'.` });
                    }
                    break;
                default:
                    payload = {};
                    break;
            }
            action = { type: actionName, payload: payload };

        } else if (actionName) {
            console.error(`Validation Error: Invalid actionName '${actionName}' received.`);
            return res.status(400).json({ error: `Invalid actionName: ${actionName}` });
        }

        if (!playerId) {
            console.error('Validation Error: Missing params.privyId (playerId) in request body.');
            return res.status(400).json({ error: "playerId (in params.privyId) is required in the request body" });
        }
        if (!action) {
            console.error('Validation Error: Missing or invalid actionName in request body.');
            return res.status(400).json({ error: "A valid actionName is required in the request body" });
        }

        console.log(`Processing action validation for player ${playerId}:`, action);

        try {
            const validationResult = await gameManager.validateAction(playerId, action);

            // If successful, potentially run enemy turn and broadcast final state
            if (validationResult.success) {
                let stateAfterPlayerAction = gameManager.getState(playerId);
                let finalStateToBroadcast: GameState = stateAfterPlayerAction; // Start with post-player action state

                // Check if enemy turn should run
                if (stateAfterPlayerAction.turn === 'enemy' && stateAfterPlayerAction.phase === 'fighting') {
                    console.log(`>>> Player ${playerId}'s action resulted in enemy turn. Running enemy turn...`);
                    gameManager.runEnemyTurn(stateAfterPlayerAction); // Modifies the state object directly
                    // finalStateToBroadcast is now the state *after* the enemy turn

                    // Check if turn switched back to player *after* enemy turn
                    if (finalStateToBroadcast.turn === 'player' && finalStateToBroadcast.phase === 'fighting') {
                         console.log(`>>> Turn switched back to player ${playerId}. Resetting energy, applying start-of-turn buffs, clearing enemy card.`);
                         finalStateToBroadcast.lastEnemyCardPlayedId = null;
                         finalStateToBroadcast.player.energy = finalStateToBroadcast.player.maxEnergy;
                         gameManager.applyStartOfTurnBuffs(finalStateToBroadcast.player);
                         gameManager.setState(playerId, finalStateToBroadcast); // Save before broadcasting
                    }
                     console.log(`>>> Enemy turn processing complete. Final Turn: ${finalStateToBroadcast.turn}, Phase: ${finalStateToBroadcast.phase}`);
                } else if (stateAfterPlayerAction.phase === 'gameOver') {
                    console.log(`Game Over for player ${playerId}. Broadcasting final state.`);
                    // finalStateToBroadcast is already the game over state
                }

                // Broadcast the final state
                const ws = activeConnections.get(playerId);
                if (ws && ws.readyState === WebSocket.OPEN) {
                    const stateUpdateMessage = {
                        type: 'state_update',
                        payload: { gameState: finalStateToBroadcast },
                    };
                    ws.send(JSON.stringify(stateUpdateMessage));
                    console.log(`Sent state_update to player ${playerId} (Turn: ${finalStateToBroadcast.turn}, Phase: ${finalStateToBroadcast.phase})`);
                } else {
                    console.warn(`WebSocket not found or not open for player ${playerId} after action/turn processing.`);
                }
            }

            // Send HTTP response (doesn't need game state)
            res.json(validationResult);
        } catch (error) {
            console.error(`Error validating action for player ${playerId}:`, error);
            const message = error instanceof Error ? error.message : "An unexpected error occurred";
            res.status(500).json({ success: false, message: `${message} during action validation` });
        }
    } as RequestHandler); // <- Ensure correct RequestHandler type application

    console.log("API Routes Registered.");
} 
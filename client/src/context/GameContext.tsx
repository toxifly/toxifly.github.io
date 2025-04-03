import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';
import { useGamesFun } from '@games-fun/react'; // Assuming this is the correct import path
import type { GameState, GameConfig } from '../../../server/src/types';

// --- Get WebSocket URL from environment variables ---
const wsUrlFromEnv = import.meta.env.VITE_WS_URL;

// Check if required variable is set
if (!wsUrlFromEnv) {
  throw new Error("Missing environment variable: VITE_WS_URL");
}

// Define the shape of the context state
interface GameContextState {
    gameState: GameState | null;
    gameConfig: GameConfig | null;
    isConnected: boolean; // WebSocket connection status
    error: string | null;
    sendMessage: (message: any) => void; // Function to send messages via WebSocket
}

// Create the context with a default value (usually null or an initial state)
const GameContext = createContext<GameContextState | undefined>(undefined);

// Define the props for the provider component
interface GameProviderProps {
    children: ReactNode;
}

// Create the provider component
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const updateStateTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref to hold pending state update timeout

    // Get connection info from GamesFun SDK
    const { connection, isInitializing } = useGamesFun(); // Added isInitializing for better checks

    // WebSocket connection logic (Step 14)
    useEffect(() => {
        // Don't connect if SDK is still initializing or no privyId
        if (!connection?.privyId || isInitializing) {
            console.log("WebSocket: Waiting for connection/privyId...", { hasPrivyId: !!connection?.privyId, isInitializing });
            return;
        }

        const playerId = connection.privyId;
        // Use the WebSocket URL from the environment variable
        const wsUrl = wsUrlFromEnv;
        console.log(`WebSocket: Attempting to connect to ${wsUrl} for player ${playerId}`);
        setError(null); // Clear previous errors on new connection attempt

        const socket = new WebSocket(wsUrl);
        setWs(socket); // Store the WebSocket instance

        socket.onopen = () => {
            console.log(`WebSocket: Connection opened for player ${playerId}`);
            setIsConnected(true);
            setError(null);
            // Register the client with the server
            const registerMessage = {
                type: 'register',
                payload: { playerId },
            };
            socket.send(JSON.stringify(registerMessage));
            console.log(`WebSocket: Sent 'register' message for player ${playerId}`);
        };

        socket.onmessage = (event) => {
            // Clear any pending state update timeout when a new message arrives
            if (updateStateTimeoutRef.current) {
                clearTimeout(updateStateTimeoutRef.current);
                updateStateTimeoutRef.current = null;
            }

            try {
                const message = JSON.parse(event.data);
                console.log('WebSocket: Message received:', message);

                switch (message.type) {
                    case 'init':
                        if (message.payload?.gameState && message.payload?.gameConfig) {
                            // Apply initial state immediately
                            setGameState(message.payload.gameState);
                            setGameConfig(message.payload.gameConfig);
                            setError(null); // Clear errors on successful init
                            console.log('WebSocket: Initial game state and config received.');
                        } else {
                            console.error('WebSocket: Invalid "init" message payload:', message.payload);
                            setError('Received invalid initialization data from server.');
                        }
                        break;
                    case 'state_update':
                        if (message.payload?.gameState) {
                            const incomingGameState: GameState = message.payload.gameState;
                            const currentTurn = gameState?.turn; // Get current turn *before* update
                            const incomingTurn = incomingGameState.turn;
                            const turnChanged = currentTurn && currentTurn !== incomingTurn;

                            console.log(`GameContext: Received state_update. Current Turn: ${currentTurn}, Incoming Turn: ${incomingTurn}. Turn Changed: ${turnChanged}`);

                            const updateAction = () => {
                                console.log('GameContext: Applying state update.');
                                setGameState(incomingGameState);
                                console.log('GameContext: Called setGameState with updated state.');
                                updateStateTimeoutRef.current = null; // Clear ref after execution
                            };

                            if (turnChanged) {
                                console.log('GameContext: Turn changed, applying delay before state update.');
                                // Delay the state update if the turn has changed
                                updateStateTimeoutRef.current = setTimeout(updateAction, 1000); // 1 second delay
                            } else {
                                // Apply state update immediately if turn didn't change
                                updateAction();
                            }
                        } else {
                             console.error('WebSocket: Invalid "state_update" message payload:', message.payload);
                             setError('Received invalid state update from server.');
                        }
                        break;
                    case 'error':
                         console.error('WebSocket: Error message received from server:', message.payload?.message);
                         setError(message.payload?.message || 'Unknown error from server.');
                         break;
                    default:
                        console.warn(`WebSocket: Received unhandled message type "${message.type}"`);
                }
            } catch (e) {
                console.error('WebSocket: Failed to parse message or handle incoming data:', event.data, e);
                setError('Failed to process message from server.');
            }
        };

        socket.onclose = (event) => {
            console.log(`WebSocket: Connection closed for player ${playerId}. Code: ${event.code}, Reason: ${event.reason}`);
            setIsConnected(false);
            setWs(null);
            // Optionally clear state or set an error depending on the close reason
            if (!event.wasClean) {
                 setError('WebSocket connection closed unexpectedly.');
            }
            // Consider adding automatic reconnection logic here if desired
             // Clear any pending timeout on close
            if (updateStateTimeoutRef.current) {
                clearTimeout(updateStateTimeoutRef.current);
                updateStateTimeoutRef.current = null;
            }
        };

        socket.onerror = (errorEvent) => {
            console.error('WebSocket: Error occurred:', errorEvent);
            setError('WebSocket connection error.');
            // onclose will likely be called after this, handling cleanup
        };

        // Cleanup function: close the WebSocket connection when the component unmounts
        // or when the privyId changes (triggering the effect again)
        return () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                console.log(`WebSocket: Closing connection for player ${playerId}`);
                socket.close(1000, 'Client disconnecting'); // 1000 indicates normal closure
            }
            setWs(null);
            setIsConnected(false);
            // Optionally clear game state on disconnect? Depends on requirements.
            // setGameState(null);
            // setGameConfig(null);
             // Clear any pending timeout on unmount/reconnect
            if (updateStateTimeoutRef.current) {
                clearTimeout(updateStateTimeoutRef.current);
                updateStateTimeoutRef.current = null;
            }
        };
    // Depend on privyId and isInitializing to re-run when connection details change
    }, [connection?.privyId, isInitializing, gameState?.turn]); // <-- Add gameState.turn as dependency to access latest turn in handler

    // Updated sendMessage function using the state 'ws'
    const sendMessage = useCallback((message: any) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            console.log("WebSocket: Sending message:", message);
            ws.send(JSON.stringify(message));
        } else {
            console.error("WebSocket: Cannot send message, connection not open. State:", ws?.readyState);
            setError("WebSocket is not connected.");
            // Maybe queue the message or handle the error more gracefully
        }
    }, [ws]); // Dependency is the ws instance itself

    // Value provided by the context
    const value = {
        gameState,
        gameConfig,
        isConnected,
        error,
        sendMessage,
    };

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// Create a custom hook to use the game context
export const useGame = (): GameContextState => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}; 
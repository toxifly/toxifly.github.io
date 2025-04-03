import React, { useEffect, useState, useRef } from 'react';
import { useGame } from './context/GameContext';
import { useGamesFun, useGamesFunActions } from '@games-fun/react'; // Import useGamesFunActions
// Import UI components
import GameUI from './components/GameUI'; // Import the new GameUI component
import RewardScreen from './components/RewardScreen'; // Import RewardScreen
import ActionPanel from './components/ActionPanel'; // Import ActionPanel
import DeckView from './components/DeckView'; // Import DeckView
// Import GameState and CardInstance types (removed CardDefinition, GameConfig)
import type { GameState, CardInstance } from '../../server/src/types';

// Define game actions - Ensure keys match expected function names from the hook
// Add 'startBattle' here
const GAME_ACTIONS = {
    autoPlayCard: 'autoPlayCard',
    endTurn: 'endTurn',
    selectReward: 'selectReward',
    startBattle: 'startBattle', // Added action key
} as const; // Use 'as const' for stricter typing

const Game: React.FC = () => {
    // Get state and connection status from our game context
    const { gameState, gameConfig, isConnected, error: gameError } = useGame();
    // Get SDK status and connection details
    const { isInitializing, connection, error: sdkError } = useGamesFun();
    // Get actions hook to trigger game actions
    const actions = useGamesFunActions(GAME_ACTIONS);

    // --- START Step 1 Logging ---
    // console.log(`Game component re-rendered. Phase: ${gameState?.phase}, Turn: ${gameState?.turn}`); // Less noisy now
    // --- END Step 1 Logging ---

    // State for DeckView visibility
    const [isDeckVisible, setIsDeckVisible] = useState(false);

    // Ref to hold the latest gameState for use in setTimeout callbacks
    const gameStateRef = useRef<GameState | null>(gameState);
    // Use ReturnType<typeof setTimeout> for portability instead of NodeJS.Timeout
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
       gameStateRef.current = gameState;
    }, [gameState]);

    // Effect for automatic card play
    useEffect(() => {
        const cleanupTimeout = () => {
            if (timeoutRef.current) {
                console.log(`Game Effect Cleanup: Clearing previous timeout (ID: ${timeoutRef.current}).`);
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };

        // Log current state relevant to the effect's decision
        // Get the instance object first
        const nextCardInstance = gameState?.player?.nextCard as CardInstance | null; // Use type assertion like before if needed, or optional chaining
        const actualCardId = nextCardInstance?.cardId; // Get the actual ID string
        const instanceIdForLog = nextCardInstance?.instanceId ?? 'null';

        console.log(`Game Effect Triggered: Phase: ${gameState?.phase} Turn: ${gameState?.turn} Next Card Instance ID: ${instanceIdForLog} (Def ID: ${actualCardId ?? 'null'}) Energy: ${gameState?.player?.energy}`);

        if (!gameState || !gameConfig || !actions) {
            console.log("Game Effect: Skipping - Initializing or missing context.");
            return cleanupTimeout;
        }

        const { phase, turn, player } = gameState;
        // Use the extracted ID to get the definition
        const cardDefinition = actualCardId ? gameConfig.cards[actualCardId] : null;

        // Define conditions for auto-play using the correct variables
        const canPlayNextCard =
            phase === 'fighting' &&
            turn === 'player' &&
            !!nextCardInstance && // Check if the instance object exists
            !!actualCardId &&     // Check if we got an ID from it
            !!cardDefinition &&   // Check if the definition was found
            player.energy >= cardDefinition.cost;

        if (canPlayNextCard) {
            if (!timeoutRef.current) {
                cleanupTimeout();

                const newTimeoutId = setTimeout(async () => {
                    const currentTimeoutId = newTimeoutId;
                    const currentState = gameStateRef.current;
                    // Capture the *instance ID* expected for the check inside the timeout
                    const intendedInstanceId = nextCardInstance.instanceId;

                    console.log(`Timeout Fired (ID: ${currentTimeoutId}): Checking conditions again. Ref Phase: ${currentState?.phase}, Ref Turn: ${currentState?.turn}, Ref Next Card Instance: ${currentState?.player?.nextCard?.instanceId ?? 'null'}, Intended Instance: ${intendedInstanceId}`);

                    // Re-check conditions using the instance ID
                    if (
                        currentState?.phase === 'fighting' &&
                        currentState?.turn === 'player' &&
                        currentState?.player?.nextCard?.instanceId === intendedInstanceId && // Compare instance IDs
                        cardDefinition && // Ensure definition is still valid (captured from outer scope)
                        currentState.player.energy >= cardDefinition.cost
                    ) {
                        console.log(`Timeout Action (ID: ${currentTimeoutId}): Conditions still valid. Calling autoPlayCard for Instance ID ${intendedInstanceId} (Def ID: ${actualCardId})`);
                        try {
                            // No payload needed for autoPlayCard based on server logic
                            await actions.autoPlayCard({});
                            console.log(`Timeout Action (ID: ${currentTimeoutId}): autoPlayCard action completed for Instance ID ${intendedInstanceId}.`);
                        } catch (error) {
                            console.error(`Timeout Action (ID: ${currentTimeoutId}): Error calling autoPlayCard action for Instance ID ${intendedInstanceId}:`, error);
                        } finally {
                            if (timeoutRef.current === currentTimeoutId) {
                                timeoutRef.current = null;
                                console.log(`Timeout Action (ID: ${currentTimeoutId}): Marked timeout as completed.`);
                            } else {
                                console.log(`Timeout Action (ID: ${currentTimeoutId}): Timeout ref was already cleared or changed. (Current ref: ${timeoutRef.current})`);
                            }
                        }
                    } else {
                        console.log(`Timeout Aborted (ID: ${currentTimeoutId}): Conditions NO LONGER MET or changed for Instance ID ${intendedInstanceId}.`);
                        console.log(`  - Ref Phase: ${currentState?.phase} (Expected: fighting)`);
                        console.log(`  - Ref Turn: ${currentState?.turn} (Expected: player)`);
                        console.log(`  - Ref Next Card Instance: ${currentState?.player?.nextCard?.instanceId ?? 'null'} (Expected: ${intendedInstanceId})`);
                        // Ensure cardDefinition exists before accessing cost
                        const requiredCost = cardDefinition ? cardDefinition.cost : 'N/A';
                        console.log(`  - Ref Energy: ${currentState?.player?.energy} (Required: ${requiredCost})`);

                        if (timeoutRef.current === currentTimeoutId) {
                            timeoutRef.current = null;
                        }
                    }
                }, gameConfig.CARD_ANIMATION_DELAY_MS + gameConfig.CARD_ANIMATION_DURATION_MS + 200);

                timeoutRef.current = newTimeoutId;
                console.log(`Game Effect: Scheduled timeout ID: ${timeoutRef.current} for card Instance ID ${nextCardInstance.instanceId} (Def ID: ${actualCardId})`);

            } else {
                 console.log(`Game Effect: Conditions MET, but a timeout (${timeoutRef.current}) is already scheduled? Skipping new timeout.`);
            }
        } else {
            console.log(`Game Effect: Conditions NOT MET, Skipping auto-play.`);
            if (phase !== 'fighting') console.log(`  - Reason: Not in 'fighting' phase (Phase: ${phase})`);
            if (turn !== 'player') console.log(`  - Reason: Not player's turn (Turn: ${turn})`);
            // Update logging reasons
            if (!nextCardInstance) console.log(`  - Reason: No next card instance`);
            if (nextCardInstance && !actualCardId) console.log(`  - Reason: Could not extract card ID from instance ${nextCardInstance.instanceId}`);
            if (actualCardId && !cardDefinition) console.log(`  - Reason: Card definition missing for ${actualCardId} (Instance: ${nextCardInstance?.instanceId ?? 'N/A'})`);
            if (cardDefinition && player.energy < cardDefinition.cost) console.log(`  - Reason: Insufficient energy (Have: ${player.energy}, Need: ${cardDefinition.cost}) for card ${cardDefinition.name} (Instance: ${nextCardInstance?.instanceId ?? 'N/A'})`);

            cleanupTimeout();
        }

        return cleanupTimeout;
    }, [gameState, gameConfig, actions]); // Dependencies remain the same

    // --- Loading and Connection Status ---
    if (isInitializing) {
        return <div>Initializing SDK...</div>;
    }

    if (sdkError) {
        return <div>Error connecting to GamesFun SDK: {sdkError.message}</div>;
    }

    if (!connection) {
        // This might mean the user needs to log in via Privy/GamesFun
        return <div>Connecting wallet... Please ensure you are logged in.</div>;
    }

    if (!isConnected) {
        return <div>Connecting to game server...</div>;
    }

    if (gameError) {
        return <div>Error connecting to game server: {gameError}</div>;
    }

    if (!gameState || !gameConfig) {
        // Waiting for the 'init' message from the WebSocket server
        return <div>Loading game state...</div>;
    }

    // --- Render Game UI based on Phase ---
    const renderGameContent = () => {
        switch (gameState?.phase) { // Use optional chaining for gameState here too
            case 'pre_battle':
                // Render the main UI, but action buttons (like Start Battle) will be added separately
                return <GameUI gameState={gameState!} />;
            case 'fighting':
                return <GameUI gameState={gameState!} />; // Use non-null assertion if gameState check passed
            case 'reward':
                // Render RewardScreen component when phase is 'reward'
                return <RewardScreen />;
            case 'gameOver':
                // Render Game Over screen
                return (
                    <div style={{ textAlign: 'center', padding: '20px', border: '1px solid grey', borderRadius: '8px', marginTop: '20px' }}>
                        <h2>Game Over</h2>
                        <p>You reached Floor: {gameState!.floor}</p> {/* Use non-null assertion */}
                        <p>Total Currency Earned: {gameState!.currency || 0}</p> {/* Use non-null assertion */}
                        {/* Optional: New Game Button */}
                        {/* <button
                            onClick={() => {
                                // TODO: Implement server-side 'newGame' action handling
                                // actions.newGame({}); // Example call - requires 'newGame' in GAME_ACTIONS and server support
                                console.log("New Game clicked - requires server implementation");
                            }}
                            style={{ marginTop: '15px', padding: '10px 20px', fontSize: '1em' }}
                        >
                            New Game
                        </button> */}
                    </div>
                );
            default:
                // Handle case where gameState or phase might still be null/undefined briefly
                if (!gameState) return <div>Loading game state...</div>;
                return <div>Unknown game phase: {gameState.phase}</div>;
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {gameState && gameConfig ? ( // Only show Floor/Turn/ActionPanel/DeckView when state is loaded
                <>
                    <p style={{
                        position: 'absolute',
                        top: '-2rem',
                        left: '0',
                        fontSize: '0.8em',
                        color: '#ccc',
                        margin: 0,
                        padding: '5px'
                     }}>
                        Floor: {gameState.floor} | Turn: {gameState.turn}
                    </p>
                    {renderGameContent()}
                    {/* Render ActionPanel, pass gameState, actions, and visibility toggle */}
                    {/* Ensure 'actions' passed here is compatible with ActionPanelProps */}
                    <ActionPanel
                        gameState={gameState}
                        actions={actions}
                        onViewDeck={() => setIsDeckVisible(true)} // Pass function to open deck view
                    />
                    {/* Conditionally render DeckView */}
                    {isDeckVisible && (
                        <DeckView
                            deck={gameState.player.allCards}
                            gameConfig={gameConfig}
                            onClose={() => setIsDeckVisible(false)} // Pass function to close deck view
                        />
                    )}
                </>
            ) : (
                 // Render loading/connecting messages based on earlier checks
                 renderLoadingOrConnectionStatus(isInitializing, sdkError, connection, isConnected, gameError) // You might need to extract the loading logic into a helper function
            )}
            {/* Debug info can be added back if needed */}
            {/* <pre>{JSON.stringify(gameStateRef.current, null, 2)}</pre> */}
        </div>
    );
};

// Helper function to centralize loading/connection status rendering
const renderLoadingOrConnectionStatus = (
    isInitializing: boolean,
    sdkError: Error | null,
    connection: any, // Replace 'any' with the actual type from useGamesFun if available
    isConnected: boolean,
    gameError: string | null
) => {
    if (isInitializing) {
        return <div>Initializing SDK...</div>;
    }
    if (sdkError) {
        return <div>Error connecting to GamesFun SDK: {sdkError.message}</div>;
    }
    if (!connection) {
        return <div>Connecting wallet... Please ensure you are logged in.</div>;
    }
    if (!isConnected) {
        return <div>Connecting to game server...</div>;
    }
    if (gameError) {
        return <div>Error connecting to game server: {gameError}</div>;
    }
    // Default case if none of the above but gameState isn't ready yet
    return <div>Loading game state...</div>;
}

export default Game; 
import React, { useEffect, useState, useRef } from 'react';
import { useGame } from './context/GameContext';
import { useGamesFun, useGamesFunActions } from '@games-fun/react'; // Import useGamesFunActions
// Import UI components
import GameUI from './components/GameUI'; // Import the new GameUI component
import RewardScreen from './components/RewardScreen'; // Import RewardScreen
import ActionPanel from './components/ActionPanel'; // Import ActionPanel
import DeckView from './components/DeckView'; // Import DeckView
import type { GameState, CardDefinition, GameConfig } from '../../server/src/types'; // Import GameState, CardDefinition, and GameConfig types

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

    // State to track which card is currently being animated
    const [animatingCardId, setAnimatingCardId] = useState<string | null>(null);

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
        // Cleanup function: Clears any pending timeout
        const cleanupTimeout = () => {
            if (timeoutRef.current) {
                console.log(`Game Effect Cleanup: Clearing previous timeout (ID: ${timeoutRef.current}).`);
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
                // DO NOT reset isPlayerActingRef here. Let the finally/abort logic handle it.
            }
        };

        // Log current state relevant to the effect's decision
        console.log(`Game Effect Triggered: Phase: ${gameState?.phase} Turn: ${gameState?.turn} Next Card ID: ${gameState?.player?.nextCard} Energy: ${gameState?.player?.energy}`);

        // Initial checks for necessary data
        if (!gameState || !gameConfig || !actions) {
            console.log("Game Effect: Skipping - Initializing or missing context.");
            // Ensure any previous timeout is cleared if context becomes unavailable mid-operation
            return cleanupTimeout;
        }

        const { phase, turn, player } = gameState;
        const nextCardId = player?.nextCard; // This is the ID (string)

        // Define conditions for auto-play
        const isFightingPhase = phase === 'fighting';
        const isPlayerTurn = turn === 'player';
        const hasNextCard = typeof nextCardId === 'string';

        // Primary condition check: Should we attempt to play?
        if (isFightingPhase && isPlayerTurn && hasNextCard) {
            const cardDefinition = gameConfig.cards[nextCardId];

            if (!cardDefinition) {
                console.error(`Game Effect Error: Card definition not found for ID: ${nextCardId}`);
                return cleanupTimeout; // Return cleanup function
            }

            if (player.energy >= cardDefinition.cost) {
                console.log(`Game Effect: Conditions MET for auto-play (Card: ${cardDefinition.name} [${nextCardId}], Energy: ${player.energy}/${cardDefinition.cost}). Setting timeout.`);

                // Set animation state (this is okay as useState)
                console.log(`  Setting animatingCardId = ${nextCardId}`);
                setAnimatingCardId(nextCardId); // Start animation

                // Clear any potentially existing timeout before setting a new one
                cleanupTimeout();

                // --- Schedule the action ---
                const newTimeoutId = setTimeout(async () => {
                    // Capture for logging and comparison before nulling ref
                    const currentTimeoutId = newTimeoutId;
                    // Re-check conditions using the latest state from the ref inside the timeout
                    const currentState = gameStateRef.current;
                    const intendedCardId = nextCardId; // Use the card ID captured when the timeout was set

                    console.log(`Timeout Fired (ID: ${currentTimeoutId}): Checking conditions again. Ref Phase: ${currentState?.phase}, Ref Turn: ${currentState?.turn}, Ref Next Card: ${currentState?.player?.nextCard}, Intended Card: ${intendedCardId}`);

                    if (
                        currentState?.phase === 'fighting' &&
                        currentState?.turn === 'player' &&
                        currentState?.player?.nextCard === intendedCardId && // Ensure it's still the expected card
                        currentState.player.energy >= cardDefinition.cost   // Ensure energy is still sufficient
                    ) {
                        console.log(`Timeout Action (ID: ${currentTimeoutId}): Conditions still valid. Calling autoPlayCard for ${intendedCardId}`);
                        try {
                            await actions.autoPlayCard({});
                            console.log(`Timeout Action (ID: ${currentTimeoutId}): autoPlayCard action called for ${intendedCardId}.`);
                        } catch (error) {
                            console.error(`Timeout Action (ID: ${currentTimeoutId}): Error calling autoPlayCard action for ${intendedCardId}:`, error);
                        } finally {
                            console.log(`Timeout Finally (ID: ${currentTimeoutId}): Resetting animatingCardId=null for action related to ${intendedCardId}`);
                            setAnimatingCardId(null);
                            // Only nullify timeoutRef if it still holds the ID of *this* timeout,
                            // preventing race conditions if cleanup ran for a newer effect invocation.
                            if (timeoutRef.current === currentTimeoutId) {
                                timeoutRef.current = null; // Mark timeout as completed
                            }
                        }
                    } else {
                        console.log(`Timeout Aborted (ID: ${currentTimeoutId}): Conditions NO LONGER MET or changed for ${intendedCardId}. Resetting state.`);
                        console.log(`  - Ref Phase: ${currentState?.phase} (Expected: fighting)`);
                        console.log(`  - Ref Turn: ${currentState?.turn} (Expected: player)`);
                        console.log(`  - Ref Next Card: ${currentState?.player?.nextCard} (Expected: ${intendedCardId})`);
                        console.log(`  - Ref Energy: ${currentState?.player?.energy} (Required: ${cardDefinition.cost})`);

                        // Reset animation state
                        setAnimatingCardId(null);
                        if (timeoutRef.current === currentTimeoutId) {
                            timeoutRef.current = null; // Mark timeout as completed (or aborted)
                        }
                    }
                }, 1200); // 1.2 second delay

                timeoutRef.current = newTimeoutId; // Store the new timeout ID
                console.log(`Game Effect: Scheduled timeout ID: ${timeoutRef.current} for card ${nextCardId}`);

            } else {
                // Conditions met except for energy
                console.log(`Game Effect: Conditions NOT MET for auto-play. Insufficient energy (Have: ${player.energy}, Need: ${cardDefinition.cost}) for card ${cardDefinition.name} (${nextCardId})`);
                // Don't reset acting flag here, just don't start the action.
                // Stop animation if energy becomes insufficient for the card we thought we were playing
                if (animatingCardId === nextCardId) setAnimatingCardId(null);
            }
        } else {
            // Log reasons why auto-play didn't trigger
            console.log(`Game Effect: Conditions NOT MET or Skipping auto-play.`);
            if (!isFightingPhase) console.log(`  - Reason: Not in 'fighting' phase (Phase: ${phase})`);
            if (!isPlayerTurn) console.log(`  - Reason: Not player's turn (Turn: ${turn})`);
            if (!hasNextCard) console.log(`  - Reason: No next card ID (ID: ${nextCardId})`);

            // Reset animation if conditions (like phase/turn/card) are no longer met
            if (animatingCardId && animatingCardId === nextCardId) {
                 // This case might occur if the card changes while we're not animating/acting. Stop animation.
                 setAnimatingCardId(null);
            } else if (animatingCardId && !hasNextCard) {
                // If the card we were animating disappears (e.g., played successfully and nextCard is now null/different)
                // The finally block in timeout should handle this, but as a fallback:
                 setAnimatingCardId(null);
            }
        }

        // Return the cleanup function to be called if dependencies change OR component unmounts
        return cleanupTimeout;
    // Dependencies remain the same
    }, [gameState, gameConfig, actions]);

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
                // Pass animatingCardId (will be null here)
                return <GameUI gameState={gameState!} animatingCardId={animatingCardId} />;
            case 'fighting':
                // Pass animatingCardId down to GameUI
                return <GameUI gameState={gameState!} animatingCardId={animatingCardId} />; // Use non-null assertion if gameState check passed
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
        <div>
            <h1>Game Active - Player: {connection?.privyId ?? 'Loading...'}</h1>
            {gameState && gameConfig ? ( // Only show Floor/Turn/ActionPanel/DeckView when state is loaded
                <>
                    <p>Floor: {gameState.floor} | Turn: {gameState.turn}</p>
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
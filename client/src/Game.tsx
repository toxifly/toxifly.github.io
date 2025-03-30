import React, { useEffect, useState, useRef } from 'react';
import { useGame } from './context/GameContext';
import { useGamesFun, useGamesFunActions } from '@games-fun/react'; // Import useGamesFunActions
// Import UI components
import GameUI from './components/GameUI'; // Import the new GameUI component
import RewardScreen from './components/RewardScreen'; // Import RewardScreen
import ActionPanel from './components/ActionPanel'; // Import ActionPanel
import DeckView from './components/DeckView'; // Import DeckView
import type { GameState } from '../../server/src/types'; // Import GameState type (Corrected path)

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

    // Local state to prevent triggering auto-play multiple times rapidly
    const [isPlayerActing, setIsPlayerActing] = useState(false);
    // State to track which card is currently being animated
    const [animatingCardId, setAnimatingCardId] = useState<string | null>(null);
    const ANIMATION_DURATION = 500; // ms, match CSS animation duration

    // State for DeckView visibility
    const [isDeckVisible, setIsDeckVisible] = useState(false);

    // *** Moved useRef and its useEffect to the top level ***
    // Ref to hold the latest gameState for use in setTimeout callbacks
    const gameStateRef = useRef<GameState | null>(gameState);
    useEffect(() => {
       gameStateRef.current = gameState;
    }, [gameState]);

    // Effect to automatically play the next card when it's the player's turn
    useEffect(() => {
        // Use gameStateRef.current for checks if needed, but direct gameState is usually fine for the initial check
        console.log("Game Effect Triggered: Turn:", gameState?.turn, "Next Card:", gameState?.player?.nextCard?.id, "Is Acting:", isPlayerActing, "Animating:", animatingCardId);

        // Store nextCard from the current render's gameState
        const cardToPlay = gameState?.player?.nextCard;

        if (
            gameState &&
            gameState.turn === 'player' &&
            cardToPlay && // Check if there's a card to play
            !isPlayerActing && // Check if we are not already acting
            animatingCardId !== cardToPlay.id // Ensure we don't re-trigger animation for the same card
        ) {
            console.log("Game Effect: Conditions MET for auto-play. Setting timeout.");
            setIsPlayerActing(true); // Set flag BEFORE timeout

            const timer = setTimeout(async () => {
                // Re-check state inside timeout using the ref for the *latest* state
                const currentCardIdInTimeout = gameStateRef.current?.player?.nextCard?.id;
                // Make sure cardToPlay still exists before accessing id
                const cardToPlayId = cardToPlay?.id;
                console.log(`Game Effect: Timeout fired. Card to play ID (initial): ${cardToPlayId}, Card ID now: ${currentCardIdInTimeout}`);

                // Ensure the card intended to be played is still the next card
                // Check both currentCardIdInTimeout and cardToPlayId exist before comparing
                if (!cardToPlayId || !currentCardIdInTimeout || currentCardIdInTimeout !== cardToPlayId) {
                    console.log("Game Effect: Card changed or disappeared before action could be sent. Aborting auto-play.");
                    setIsPlayerActing(false);
                    setAnimatingCardId(null); // Reset animation if card changed
                    return;
                }

                console.log('Auto-playing card:', cardToPlayId);
                // Trigger animation *before* sending the action
                setAnimatingCardId(cardToPlayId);

                try {
                    console.log("Game Effect: Calling actions.autoPlayCard");
                    await actions.autoPlayCard({}); // Call the action
                    console.log("Game Effect: actions.autoPlayCard finished");
                } catch (err) {
                    console.error('Error auto-playing card:', err);
                    setAnimatingCardId(null);
                } finally {
                    console.log("Game Effect: Resetting isPlayerActing flag immediately.");
                    setIsPlayerActing(false);
                    setTimeout(() => {
                        console.log("Game Effect: Resetting animatingCardId.");
                        setAnimatingCardId(null)
                    }, ANIMATION_DURATION);
                }
            }, 500);

            return () => {
                console.log("Game Effect: Cleanup function running.");
                clearTimeout(timer);
                console.log("Game Effect: Resetting isPlayerActing flag in cleanup.");
                setIsPlayerActing(false);
            };
        } else {
             // Add log for why conditions were NOT met
             console.log("Game Effect: Conditions NOT MET for auto-play.");
             if (!gameState) console.log("  - Reason: Game state not loaded yet");
             else { // Only check these if gameState exists
                 if (gameState.turn !== 'player') console.log("  - Reason: Not player's turn");
                 if (!cardToPlay) console.log("  - Reason: No card to play");
                 if (isPlayerActing) console.log("  - Reason: Already acting");
                 if (cardToPlay && animatingCardId === cardToPlay.id) console.log("  - Reason: Card already animating");
             }
        }

        // This part handles resetting if turn changes *while* acting flag is true
        if (gameState?.turn !== 'player' && isPlayerActing) {
            console.log("Game Effect: Turn changed, resetting isPlayerActing flag.");
            // Reset the acting flag if it's not the player's turn anymore
            setIsPlayerActing(false);
        }
        // Reset animation if the card changes unexpectedly or turn ends
        if (animatingCardId && gameState?.player?.nextCard?.id !== animatingCardId) {
             console.log("Game Effect: Next card changed or disappeared, resetting animatingCardId.");
            setAnimatingCardId(null);
        }
        // *** Removed the misplaced useRef and useEffect from here ***

    }, [gameState, actions, animatingCardId]); // Corrected dependency array

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
                // animatingCardId will be null here, so no card animation
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
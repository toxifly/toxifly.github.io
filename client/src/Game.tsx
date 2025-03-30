import React from 'react';
import { useGame } from './context/GameContext';
import { useGamesFun } from '@games-fun/react'; // Assuming this is the correct import path
// Import UI components
import GameUI from './components/GameUI'; // Import the new GameUI component
// import RewardScreen from './components/RewardScreen';

// Define game actions
const GAME_ACTIONS = {
    AUTO_PLAY_CARD: 'autoPlayCard',
    END_TURN: 'endTurn',
    SELECT_REWARD: 'selectReward',
} as const; // Use 'as const' for stricter typing

const Game: React.FC = () => {
    // Get state and connection status from our game context
    const { gameState, gameConfig, isConnected, error: gameError } = useGame();
    // Get SDK status and connection details
    const { isInitializing, connection, error: sdkError } = useGamesFun();

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
    // Placeholder for actual UI components to be added in later steps
    const renderGameContent = () => {
        switch (gameState.phase) {
            case 'fighting':
                // Render the GameUI component, passing the gameState
                return <GameUI gameState={gameState} />;
            case 'reward':
                // TODO: Render RewardScreen component (Step 39)
                return <div>Reward Phase - Floor {gameState.floor} Cleared!</div>;
            case 'gameOver':
                // TODO: Render Game Over screen (Step 42)
                return <div>Game Over - Reached Floor {gameState.floor}. Currency: {gameState.currency || 0}</div>;
            default:
                return <div>Unknown game phase: {gameState.phase}</div>;
        }
    };

    return (
        <div>
            <h1>Game Active - Player: {connection.privyId}</h1>
            <p>Floor: {gameState.floor} | Turn: {gameState.turn}</p>
            {renderGameContent()}
            {/* We can add debug info here if needed */}
            {/* <pre>{JSON.stringify(gameState, null, 2)}</pre> */}
        </div>
    );
};

export default Game; 
import React from 'react';
import { GameState } from '../../../server/src/types'; // Assuming types are accessible like this
// You might need to adjust the import path for GameState depending on your setup.
// If using a shared types package, import from there instead.
import styles from './ActionPanel.module.css';

// Import types from the SDK if available for better action typing
// import type { ActionResult } from '@games-fun/core'; // Example

// Define a more accurate type for the actions object returned by useGamesFunActions
// This assumes the hook returns functions named after the keys provided (e.g., startBattle)
type GameActions = {
    // Adjust payload/return types based on actual SDK/game logic if needed
    startBattle?: (payload?: any) => Promise<any>; // Make optional if not always present
    // Add other actions used by ActionPanel if any in the future
    // Example: endTurn?: (payload?: any) => Promise<any>;
};

interface ActionPanelProps {
    gameState: GameState | null;
    actions: GameActions; // Use the more specific GameActions type
    onViewDeck: () => void; // Function to open the deck view
    // Add other props if needed
}

const ActionPanel: React.FC<ActionPanelProps> = ({ gameState, actions, onViewDeck }) => {
    const handleStartBattle = () => {
        // Check if the startBattle action function exists before calling
        if (actions.startBattle) {
             actions.startBattle({}); // Call the specific action function
        } else {
            console.error("startBattle action is not available");
        }
    };

    // Don't render the panel if gameState is not yet loaded
    if (!gameState) {
        return null;
    }

    return (
        <div className={styles.panel}>
            {/* Always show View Deck button when panel is rendered (gameState exists) */}
            <button onClick={onViewDeck} className={styles.buttonSecondary}>
                View Deck
            </button>

            {/* Conditionally render Start Battle button */}
            {gameState.phase === 'pre_battle' && (
                <button onClick={handleStartBattle} className={styles.button}>
                    Start Battle
                </button>
            )}

            {/* Add other buttons here if needed, e.g., End Turn */}
            {/* {gameState.phase === 'fighting' && gameState.turn === 'player' && actions.endTurn && (
                <button onClick={() => actions.endTurn?.()} className={styles.button}>
                    End Turn
                </button>
            )} */}
        </div>
    );
};

// Remove old inline styles const
// const styles = { ... };

export default ActionPanel; 
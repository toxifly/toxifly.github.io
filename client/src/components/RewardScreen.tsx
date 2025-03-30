import React from 'react';
import { useGame } from '../context/GameContext';
import { useGamesFunActions } from '@games-fun/react'; // Assuming actions hook is here
import CardDisplay from './CardDisplay';
import { CardDefinition } from '../../../server/src/types'; // Adjust path if needed
// Import GAME_ACTIONS (assuming it's exported from Game.tsx or a shared types file)
// If GAME_ACTIONS lives elsewhere, adjust the import path.
// For now, assuming it might be in Game.tsx or moved to a shared location.
// Let's temporarily redefine it here if not easily importable,
// but ideally it should be imported.
// UPDATE: Let's assume it's correctly imported or defined globally/shared.
// If not, you might need to pass it down or import from its definition file.

// Example: If GAME_ACTIONS is in Game.tsx, you might export it there:
// export const GAME_ACTIONS = { ... } as const;
// Then import here: import { GAME_ACTIONS } from '../Game';

// For this fix, let's assume GAME_ACTIONS is available in scope
// or properly imported. We need it for useGamesFunActions.
// A better approach would be to define GAME_ACTIONS in a shared types file.
// Let's refine the action definitions based on Game.tsx
const REWARD_SCREEN_ACTIONS = {
    selectReward: 'selectReward',
} as const;

const RewardScreen: React.FC = () => {
    const { gameState } = useGame();
    // Pass the specific actions needed by this component to the hook
    const actions = useGamesFunActions(REWARD_SCREEN_ACTIONS); // Pass the actions map

    if (!gameState || gameState.phase !== 'reward' || !gameState.rewardOptions || gameState.rewardOptions.length === 0) {
        // Handle cases where reward state is not ready or empty
        return <div>Loading rewards or no rewards available...</div>;
    }

    const currentRewardSetIndex = gameState.currentRewardSet;
    if (currentRewardSetIndex >= gameState.rewardOptions.length) {
        console.error("Reward set index out of bounds:", currentRewardSetIndex, gameState.rewardOptions.length);
        return <div>Error loading rewards.</div>;
    }

    const currentOptions: CardDefinition[] = gameState.rewardOptions[currentRewardSetIndex];

    const handleSelectReward = (index: number) => {
        // Check if the specific action 'selectReward' exists on the returned actions object
        if (!actions?.selectReward) {
            console.error("selectReward action is not available.");
            return;
        }
        console.log(`Selecting reward card index: ${index}`);
        // Call the action correctly
        actions.selectReward({ cardIndex: index });
    };

    return (
        <div style={styles.container}>
            <h2>Choose Your Reward (Set {currentRewardSetIndex + 1}/{gameState.rewardOptions.length})</h2>
            <div style={styles.cardOptions}>
                {currentOptions.map((card, index) => (
                    <div
                        key={card.id + '-' + index} // Add index for key uniqueness in case of duplicate card IDs in rewards
                        onClick={() => handleSelectReward(index)}
                        style={styles.cardWrapper}
                    >
                        <CardDisplay card={card} />
                    </div>
                ))}
            </div>
            <button
                onClick={() => handleSelectReward(-1)}
                style={styles.skipButton}
            >
                Skip Reward
            </button>
        </div>
    );
};

// Basic inline styles for layout
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
        color: 'white',
        borderRadius: '8px',
        margin: 'auto',
        maxWidth: '800px',
    },
    cardOptions: {
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap', // Allow cards to wrap on smaller screens
        gap: '20px', // Space between cards
        marginBottom: '20px',
    },
    cardWrapper: {
        cursor: 'pointer',
        border: '2px solid transparent', // Add space for hover effect
        borderRadius: '5px', // Match CardDisplay border-radius if any
        transition: 'border-color 0.2s ease-in-out',
    },
    // Add a hover effect (optional, can be moved to CSS Module)
    // cardWrapper:hover: { // Pseudo-classes don't work directly in inline styles
    //     borderColor: '#007bff',
    // },
    skipButton: {
        padding: '10px 20px',
        fontSize: '16px',
        cursor: 'pointer',
        backgroundColor: '#6c757d', // Grey color for skip
        color: 'white',
        border: 'none',
        borderRadius: '5px',
    }
};

// Enhance cardWrapper hover using CSS (optional - would require a new CSS Module)
/*
// In a new RewardScreen.module.css
.cardWrapper:hover {
    border-color: #007bff;
}
// In RewardScreen.tsx:
import stylesModule from './RewardScreen.module.css';
...
<div className={stylesModule.cardWrapper} ... >
*/


export default RewardScreen; 
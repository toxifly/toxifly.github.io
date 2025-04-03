import React, { useEffect, useState } from 'react';
import type { GameState, CardDefinition, CardInstance } from '../../../server/src/types'; // Adjust path if needed
import PlayerDisplay from './PlayerDisplay';
import EnemyDisplay from './EnemyDisplay';
import CardDisplay from './CardDisplay';
import { useGame } from '../context/GameContext'; // Import useGame hook

interface GameUIProps {
    gameState: GameState;
}

/**
 * Main UI for the fighting phase. Displays Floor, Enemy, Player, current playable card, and next card to draw.
 */
const GameUI: React.FC<GameUIProps> = ({ gameState }) => {
    const { gameConfig } = useGame(); // Get gameConfig from context
    const [previousCardId, setPreviousCardId] = useState<string | null>(null);

    // Get the playable card instance
    const playableCardInstance: CardInstance | null = gameState.player.nextCard;
    // Get the definition ID from the instance (if it exists)
    const playableCardId = playableCardInstance?.cardId;
    // Look up the definition using the ID
    const playableCardDefinition: CardDefinition | null = playableCardId && gameConfig?.cards
        ? gameConfig.cards[playableCardId]
        : null;

    // Get the next draw card instance (top of deck)
    const nextDrawCardInstance: CardInstance | null = gameState.player.deck.length > 0 ? gameState.player.deck[0] : null;
    const nextDrawCardId = nextDrawCardInstance?.cardId;
    const nextDrawCardDefinition: CardDefinition | null = nextDrawCardId && gameConfig?.cards
        ? gameConfig.cards[nextDrawCardId]
        : null;

    // Track when card changes to trigger fade effect
    useEffect(() => {
        // Ensure we pass null if nextDrawCardId is undefined
        const currentCardId = nextDrawCardId ?? null;
        if (currentCardId !== previousCardId) {
            setPreviousCardId(currentCardId);
        }
    }, [nextDrawCardId, previousCardId]); // Add previousCardId to dependency array

    // --- Add Logging ---
    console.log(`[GameUI Render] Playable Instance ID: ${playableCardInstance?.instanceId ?? 'null'}, Def ID: ${playableCardId ?? 'null'}, Def Found: ${!!playableCardDefinition}, Turn: ${gameState.turn}`);
    console.log(`[GameUI Render] Next Draw Instance ID: ${nextDrawCardInstance?.instanceId ?? 'null'}, Def ID: ${nextDrawCardId ?? 'null'}, Def Found: ${!!nextDrawCardDefinition}`);
    // -------------------

    // Simple loading/error check for config
    if (!gameConfig) {
        return <div>Loading configuration...</div>;
    }

    // Get animation timings from config, provide defaults if missing
    const animationDelay = gameConfig.CARD_ANIMATION_DELAY_MS ?? 300;
    const animationDuration = gameConfig.CARD_ANIMATION_DURATION_MS ?? 700;

    // Attempt to get max momentum from config, default to 10 if not found
    // Check if PLAYER_START_MOMENTUM_MAX exists (based on updated types.ts)
    const maxMomentum = gameConfig.PLAYER_START_MOMENTUM_MAX ?? 10;

    return (
        // Use CSS classes for styling the main container if needed
        <div className="game-ui-container">
             {/* Floor Indicator */}
             <div className="floor-indicator">
                Floor {gameState.floor}
             </div>

             {/* Enemy Display */}
             <div className="enemy-section">
                <EnemyDisplay
                    enemy={gameState.enemy}
                    maxMomentum={maxMomentum} // Pass maxMomentum
                />
             </div>

             {/* Player Display */}
             <div className="player-section">
                <PlayerDisplay player={gameState.player} maxMomentum={maxMomentum} />
             </div>

             {/* Card Area: Playable card and next draw preview side-by-side */}
             <div className="card-area">
                 {/* Playable Card Display - Always render CardDisplay */}
                 <div className="playable-card-section">
                    {/* Label removed */}
                    {/* <span className="card-label">Playable Card</span> */}
                    <CardDisplay
                        // Use instanceId for the key to ensure React treats it as new when instance changes
                        key={`card-${playableCardInstance?.instanceId ?? 'empty'}`}
                        // Pass the definition for display
                        card={playableCardDefinition}
                        // Pass the instanceId for animation triggering
                        instanceId={playableCardInstance?.instanceId ?? null}
                        isNextCard={!!playableCardDefinition && !!playableCardInstance} // Only true if both exist
                        animationDelay={animationDelay}
                        animationDuration={animationDuration}
                    />
                 </div>

                 {/* Next Draw Preview */}
                 <div className="next-draw-section">
                     <span className="card-label">Next Draw Preview:</span>
                     <CardDisplay
                         key={`preview-${nextDrawCardInstance?.instanceId ?? 'empty'}`} // Use instance ID for key
                         card={nextDrawCardDefinition}
                         instanceId={null}
                         isNextCard={false}
                         isNextDrawPreview={true}
                         previousCardId={previousCardId} // Pass previous card ID to track changes
                     />
                 </div>
             </div>

            {/* Action Log Removed */}
            {/* <div style={{ width: '100%', maxWidth: '800px', marginTop: '20px' }}>
                 <ActionLog logs={gameState.logs || []} />
            </div> */}
        </div>
    );
};

export default GameUI; 
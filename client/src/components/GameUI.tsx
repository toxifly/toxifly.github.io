import React, { useEffect } from 'react';
import type { GameState, GameConfig, CardDefinition } from '../../../server/src/types'; // Adjust path if needed
import PlayerDisplay from './PlayerDisplay';
import EnemyDisplay from './EnemyDisplay';
import CardDisplay from './CardDisplay';
import { useGame } from '../context/GameContext'; // Import useGame hook

interface GameUIProps {
    gameState: GameState;
    animatingCardId?: string | null;
}

/**
 * Main UI for the fighting phase. Displays Floor, Enemy, Player, current playable card, and next card to draw.
 */
const GameUI: React.FC<GameUIProps> = ({ gameState, animatingCardId }) => {
    const { gameConfig } = useGame(); // Get gameConfig from context

    // Card to be played next (from state)
    const playableCardId = gameState.player.nextCard;
    const playableCardDefinition = playableCardId && gameConfig?.cards ? gameConfig.cards[playableCardId] : null;

    // Card at the top of the draw pile (preview)
    const nextDrawCardId = gameState.player.deck.length > 0 ? gameState.player.deck[0] : null;
    const nextDrawCardDefinition = nextDrawCardId && gameConfig?.cards ? gameConfig.cards[nextDrawCardId] : null;

    // Determine if the playable card is the one being animated
    const isPlayableCardBeingAnimated = !!(playableCardId && animatingCardId && playableCardId === animatingCardId);

    useEffect(() => {
        console.log(`[GameUI] animatingCardId changed: ${animatingCardId}`);
        console.log(`[GameUI] Playable Card ID: ${playableCardId}, Next Draw ID: ${nextDrawCardId}`);
    }, [animatingCardId, playableCardId, nextDrawCardId]);

    // Add debug logging for card lookups
    useEffect(() => {
        if (playableCardId && !playableCardDefinition) {
            console.warn(`[GameUI] Playable card definition not found for ID: ${playableCardId}`);
        }
        if (nextDrawCardId && !nextDrawCardDefinition) {
            console.warn(`[GameUI] Next draw card definition not found for ID: ${nextDrawCardId}`);
        }
    }, [playableCardId, playableCardDefinition, nextDrawCardId, nextDrawCardDefinition]);


    // Simple loading/error check for config
    if (!gameConfig) {
        return <div>Loading configuration...</div>;
    }

    // Attempt to get max momentum from config, default to 10 if not found
    // NOTE: MAX_MOMENTUM should ideally be added to GameConfig in types.ts and config.ts
    const maxMomentum = (gameConfig as any).MAX_MOMENTUM ?? 10;

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
                 {/* Playable Card Display */}
                 <div className="playable-card-section">
                    {/* Label removed as per image */}
                    {/* <span className="card-label">Playable Card</span> */}
                    {playableCardDefinition ? (
                        <CardDisplay
                            card={playableCardDefinition}
                            isNextCard={true} // Highlight the playable card
                            isBeingPlayed={isPlayableCardBeingAnimated}
                            isNextDrawPreview={false} // Explicitly false
                        />
                    ) : (
                        <div className="card-placeholder">
                            {/* Placeholder styling handled by CSS */}
                            {playableCardId ? `Loading card: ${playableCardId}` : 'No card'}
                        </div>
                    )}
                 </div>

                 {/* Next Draw Preview */}
                 <div className="next-draw-section">
                    <span className="card-label">Next Draw:</span>
                    {nextDrawCardDefinition ? (
                        <CardDisplay
                            card={nextDrawCardDefinition}
                            isNextCard={false} // Not the primary playable card
                            isBeingPlayed={false} // Not being played
                            isNextDrawPreview={true} // Indicate it's the preview
                        />
                    ) : (
                        <div className="card-placeholder-small">
                            {/* Placeholder styling handled by CSS */}
                            Deck Empty
                        </div>
                    )}
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
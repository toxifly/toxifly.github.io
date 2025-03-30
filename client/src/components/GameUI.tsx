import React, { useEffect } from 'react';
import type { GameState, GameConfig } from '../../../server/src/types'; // Adjust path if needed
import PlayerDisplay from './PlayerDisplay';
import EnemyDisplay from './EnemyDisplay';
import CardDisplay from './CardDisplay';
import { useGame } from '../context/GameContext'; // Import useGame hook

interface GameUIProps {
    gameState: GameState;
    animatingCardId?: string | null;
}

const gameUiStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    border: '1px solid lightgray',
    borderRadius: '8px',
    backgroundColor: '#f0f0f0',
    minHeight: '80vh', // Ensure it takes up some vertical space
};

const combatantsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-start', // Align tops of player/enemy displays
    width: '100%',
    maxWidth: '800px', // Limit width
    gap: '20px',
};

const cardAreaStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start', // Align cards at the top
    gap: '15px',
    marginTop: '20px',
    width: '100%',
};

const cardSectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
};

const cardLabelStyle: React.CSSProperties = {
    fontWeight: 'bold',
    fontSize: '0.9em',
    color: '#555',
};

/**
 * Main UI for the fighting phase. Displays player, enemy, current card, and next card.
 */
const GameUI: React.FC<GameUIProps> = ({ gameState, animatingCardId }) => {
    const { gameConfig } = useGame(); // Get gameConfig from context
    const currentCard = gameState.player.hand.length > 0 ? gameState.player.hand[0] : null;
    const nextCardId = gameState.player.nextCard; // This is a string ID, not a CardDefinition
    
    // Look up the actual card definition from gameConfig using the ID
    const nextCardDefinition = nextCardId && gameConfig?.cards ? gameConfig.cards[nextCardId] : null;

    // Determine if the next card is the one being played - compare string IDs directly
    const isNextCardBeingPlayed = !!(nextCardId && animatingCardId && nextCardId === animatingCardId);

    useEffect(() => {
        console.log(`[GameUI] animatingCardId changed: ${animatingCardId}`);
    }, [animatingCardId]);

    // Debug log for lastEnemyCardPlayedId
    useEffect(() => {
        console.log(`[GameUI] gameState.lastEnemyCardPlayedId: ${gameState.lastEnemyCardPlayedId}`);
    }, [gameState.lastEnemyCardPlayedId]);

    // Add debug logging for nextCardId and definition
    useEffect(() => {
        console.log(`[GameUI] nextCardId: ${nextCardId}, definition found: ${!!nextCardDefinition}`);
        if (nextCardId && !nextCardDefinition) {
            console.warn(`[GameUI] Card definition not found for ID: ${nextCardId}`);
        }
    }, [nextCardId, nextCardDefinition]);

    return (
        <div style={gameUiStyle}>
            {/* Top Section: Combatants (Enemy and Player side-by-side) */}
            <div style={combatantsStyle}>
                 {/* Player Display on Left */}
                 <div style={{ width: '45%' }}> {/* Adjust width as needed */}
                    <PlayerDisplay player={gameState.player} />
                 </div>

                 {/* Enemy Display on Right */}
                 <div style={{ width: '45%' }}> {/* Adjust width as needed */}
                    <EnemyDisplay
                        enemy={gameState.enemy}
                        lastPlayedCardId={gameState.lastEnemyCardPlayedId} // Pass the ID
                        gameConfig={gameConfig} // Pass the config
                    />
                 </div>
            </div>

            {/* Middle Section: Cards */}
            <div style={cardAreaStyle}>
                 {/* Current Card Display */}
                 <div style={cardSectionStyle}>
                    <span style={cardLabelStyle}>Current Card</span>
                    {currentCard ? (
                        <CardDisplay card={currentCard} isNextCard={false} />
                    ) : (
                        <div style={{ width: '150px', height: '200px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9e9e9', borderRadius: '8px' }}>
                            No card
                        </div>
                    )}
                 </div>

                 {/* Next Card Display */}
                 <div style={cardSectionStyle}>
                    <span style={cardLabelStyle}>Next Card</span>
                    {nextCardDefinition ? (
                        <CardDisplay
                            card={nextCardDefinition} // Pass the actual CardDefinition object
                            isNextCard={true}
                            isBeingPlayed={isNextCardBeingPlayed}
                        />
                    ) : (
                        <div style={{ width: '150px', height: '200px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9e9e9', borderRadius: '8px' }}>
                            {nextCardId ? `Loading card: ${nextCardId}` : 'No next card'}
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default GameUI; 
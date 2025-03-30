import React from 'react';
import type { GameState } from '../../../server/src/types'; // Adjust path if needed
import PlayerDisplay from './PlayerDisplay';
import EnemyDisplay from './EnemyDisplay';
import CardDisplay from './CardDisplay';

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
    const currentCard = gameState.player.hand.length > 0 ? gameState.player.hand[0] : null;
    const nextCard = gameState.player.nextCard;

    // Determine if the next card is the one being played
    const isNextCardBeingPlayed = !!(nextCard && animatingCardId && nextCard.id === animatingCardId);

    return (
        <div style={gameUiStyle}>
            {/* Top Section: Enemy */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <EnemyDisplay enemy={gameState.enemy} />
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
                    {nextCard ? (
                         <CardDisplay
                             card={nextCard}
                             isNextCard={true}
                             isBeingPlayed={isNextCardBeingPlayed}
                         />
                    ) : (
                        <div style={{ width: '150px', height: '200px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9e9e9', borderRadius: '8px' }}>
                            No next card
                        </div>
                    )}
                 </div>
            </div>

            {/* Bottom Section: Player */}
             <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <PlayerDisplay player={gameState.player} />
            </div>
        </div>
    );
};

export default GameUI; 
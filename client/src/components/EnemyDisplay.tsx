import React, { useState, useEffect } from 'react';
import type { EnemyState, GameConfig, CardDefinition } from '../../../server/src/types'; // Adjust path if necessary
import CombatantDisplay from './CombatantDisplay';
import CardDisplay from './CardDisplay'; // Import CardDisplay

interface EnemyDisplayProps {
  enemy: EnemyState;
  lastPlayedCardId?: string | null; // Added: ID of the last card played by the enemy
  gameConfig?: GameConfig | null; // Added: Game config to look up card definitions
}

const enemyDisplayContainerStyle: React.CSSProperties = {
    position: 'relative', // Make container relative for absolute positioning of the card
    minWidth: '200px', // Give it some base width
    minHeight: '150px', // Ensure the div has some size to show the background
};

const enemyCardPlayedStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '-60px', // Position below the enemy display
    left: '50%',
    transform: 'translateX(-50%) scale(0.7)', // Center and scale down slightly
    zIndex: 10, // Ensure it's visible
    transition: 'opacity 0.5s ease-out', // Fade out transition
    pointerEvents: 'none', // Don't intercept clicks
};

/**
 * Displays the enemy's stats using CombatantDisplay, adds an enemy-specific background image,
 * and temporarily shows the last card played by the enemy.
 */
const EnemyDisplay: React.FC<EnemyDisplayProps> = ({ enemy, lastPlayedCardId, gameConfig }) => {
  const [displayedCard, setDisplayedCard] = useState<CardDefinition | null>(null);
  const [showCard, setShowCard] = useState<boolean>(false);

  useEffect(() => {
    // Use ReturnType<typeof setTimeout> for browser/React compatibility
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (lastPlayedCardId && gameConfig?.cards) {
      const cardDef = gameConfig.cards[lastPlayedCardId];
      if (cardDef) {
        console.log(`[EnemyDisplay] Enemy played card: ${cardDef.name} (ID: ${lastPlayedCardId})`);
        setDisplayedCard(cardDef);
        setShowCard(true); // Make it visible

        // Set a timer to hide the card after a delay
        timeoutId = setTimeout(() => {
          console.log(`[EnemyDisplay] Hiding enemy card: ${cardDef.name}`);
          setShowCard(false);
          // Optionally clear displayedCard after fade out, though not strictly necessary
          // setTimeout(() => setDisplayedCard(null), 500); // Delay matches transition
        }, 1500); // Display for 1.5 seconds
      } else {
        console.warn(`[EnemyDisplay] Could not find card definition for ID: ${lastPlayedCardId}`);
        setDisplayedCard(null);
        setShowCard(false);
      }
    } else {
        // If lastPlayedCardId becomes null/undefined (e.g., player turn starts), immediately hide if shown
        // This handles the case where the server clears the ID before the timeout finishes
        if (showCard) {
            console.log('[EnemyDisplay] Hiding enemy card immediately (ID cleared)');
            setShowCard(false);
        }
    }

    // Cleanup function to clear the timeout if the component unmounts
    // or if lastPlayedCardId changes again before the timeout fires
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [lastPlayedCardId, gameConfig, showCard]); // Depend on lastPlayedCardId and gameConfig


  const enemyImageStyle: React.CSSProperties = {
    backgroundImage: `url(/images/enemies/${enemy.id}.png)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    border: '2px solid red',
    padding: '10px',
    minHeight: '150px', // Inherited minHeight from container style is fine
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative', // Keep relative for CombatantDisplay potentially
  };

  return (
    <div style={enemyDisplayContainerStyle} className="enemy-display-container">
      {/* Enemy Core Display */}
      <div className="enemy-image-and-stats" style={enemyImageStyle}>
        <CombatantDisplay combatant={enemy} />
      </div>

      {/* Temporarily Displayed Enemy Card */}
      {displayedCard && (
         <div
            style={{
                ...enemyCardPlayedStyle,
                opacity: showCard ? 1 : 0, // Control visibility via opacity for transition
            }}
            className="enemy-played-card-indicator"
         >
            <CardDisplay card={displayedCard} isNextCard={false} isBeingPlayed={false} />
         </div>
      )}
    </div>
  );
};

export default EnemyDisplay; 
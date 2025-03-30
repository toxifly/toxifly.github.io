import React from 'react'; // Removed useState, useEffect
import type { EnemyState } from '../../../server/src/types'; // Removed GameConfig, CardDefinition
import CombatantDisplay from './CombatantDisplay';
// Removed CardDisplay import
import './EnemyDisplay.css'; // Import CSS for styling

interface EnemyDisplayProps {
  enemy: EnemyState;
  // Removed lastPlayedCardId and gameConfig props
}

// Removed inline styles
// const enemyDisplayContainerStyle: React.CSSProperties = { ... };
// const enemyCardPlayedStyle: React.CSSProperties = { ... };
// const enemyImageStyle: React.CSSProperties = { ... };


/**
 * Displays the enemy's stats using CombatantDisplay.
 * The specific enemy image is used as the background for the entire component.
 * Styling is handled by EnemyDisplay.css.
 */
const EnemyDisplay: React.FC<EnemyDisplayProps> = ({ enemy }) => {
  // Removed state and useEffect for displayed card

  const enemyImageUrl = `/images/enemies/${enemy.id}.png`;
  // Removed generic backgroundImageUrl

  return (
    // Use CSS class for the main container and set the specific enemy image as background inline
    <div className="enemy-display-container" style={{ backgroundImage: `url(${enemyImageUrl})` }}>
        {/* Removed Left Side: Enemy Image Container */}

        {/* Info Container now takes the full width */}
        <div className="enemy-info-container">
            {/* Removed duplicate enemy name H2 */}
            {/* Use CombatantDisplay for stats (assuming it shows name) */}
            <div className="enemy-stats">
                 <CombatantDisplay combatant={enemy} />
            </div>
        </div>
    </div>
  );
};

export default EnemyDisplay; 
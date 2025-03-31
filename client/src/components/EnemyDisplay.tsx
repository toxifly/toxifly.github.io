import React from 'react'; // Removed useState, useEffect
import type { EnemyState } from '../../../server/src/types'; // Removed GameConfig, CardDefinition
import CombatantDisplay from './CombatantDisplay';
// Removed CardDisplay import
import './EnemyDisplay.css'; // Import CSS for styling

interface EnemyDisplayProps {
  enemy: EnemyState | null;
  maxMomentum: number; // Added: Prop for max momentum
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
const EnemyDisplay: React.FC<EnemyDisplayProps> = ({ enemy, maxMomentum }) => {
  if (!enemy) {
    return <div className="enemy-display-container">Loading enemy...</div>;
  }

  const enemyImagePath = `/images/enemies/${enemy.id}.png`; // Assuming ID matches image name

  return (
    <div
      className="enemy-display-container"
      style={{
        backgroundImage: `url(${enemyImagePath})`,
        backgroundSize: 'contain', // Changed from 'cover' to 'contain'
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center', // Keeps it centered
      }}
    >
      {/* Info box aligned to the right */}
      <div className="enemy-info-container">
         {/* Removed duplicate enemy name heading */}
        <CombatantDisplay combatant={enemy} maxMomentum={maxMomentum} />
        {/* Removed last played card display */}
      </div>
    </div>
  );
};

export default EnemyDisplay; 
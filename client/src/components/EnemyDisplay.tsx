import React from 'react';
import type { EnemyState } from '../../../server/src/types'; // Adjust path if necessary
import CombatantDisplay from './CombatantDisplay';

interface EnemyDisplayProps {
  enemy: EnemyState;
}

/**
 * Displays the enemy's stats using CombatantDisplay and adds an enemy-specific background image.
 */
const EnemyDisplay: React.FC<EnemyDisplayProps> = ({ enemy }) => {
  const enemyImageStyle: React.CSSProperties = {
    backgroundImage: `url(/images/enemies/${enemy.id}.png)`,
    backgroundSize: 'cover', // Or 'contain', depending on desired look
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    border: '2px solid red', // Example border
    padding: '10px',
    minHeight: '150px', // Ensure the div has some size to show the background
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', // Center the CombatantDisplay within
    position: 'relative', // Needed if CombatantDisplay uses absolute positioning internally
  };

  return (
    <div className="enemy-container" style={enemyImageStyle}>
      {/* Render CombatantDisplay on top of the background */}
      <CombatantDisplay combatant={enemy} />
    </div>
  );
};

export default EnemyDisplay; 
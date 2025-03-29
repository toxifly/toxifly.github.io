import React from 'react';
import type { PlayerState } from '../../../server/src/types'; // Adjust path if necessary
import CombatantDisplay from './CombatantDisplay';

interface PlayerDisplayProps {
  player: PlayerState;
}

/**
 * Displays the player's specific stats, leveraging the CombatantDisplay
 * and adding player-specific information like energy.
 */
const PlayerDisplay: React.FC<PlayerDisplayProps> = ({ player }) => {
  return (
    <div className="player-display">
      {/* Use CombatantDisplay for shared stats */}
      <CombatantDisplay combatant={player} />

      {/* Player-specific stats */}
      <div style={{ marginTop: '8px', paddingTop: '5px', borderTop: '1px dashed #eee', color: 'green' }}>
        Energy: {player.energy} / {player.maxEnergy}
      </div>
      {/* Add other player-specific UI elements here if needed */}
    </div>
  );
};

export default PlayerDisplay; 
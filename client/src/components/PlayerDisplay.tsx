import React from 'react';
import { PlayerState } from '../../../server/src/types'; // Adjust path as needed
import CombatantDisplay from './CombatantDisplay';
import './PlayerDisplay.css'; // Import CSS for styling

interface PlayerDisplayProps {
  player: PlayerState | null;
  maxMomentum: number; // Added: Prop for max momentum
}

/**
 * Displays the player's stats using CombatantDisplay.
 * Uses player.png as a background image.
 * Styling is primarily handled by PlayerDisplay.css.
 */
const PlayerDisplay: React.FC<PlayerDisplayProps> = ({ player, maxMomentum }) => {
  if (!player) {
    return <div className="player-display-container">Loading player...</div>;
  }

  // Define the path to the player image
  const playerImagePath = '/images/enemies/player.png'; // Static path for the player image

  return (
    // Apply CSS class and inline style for background image
    <div
      className="player-display-container"
      style={{
        backgroundImage: `url(${playerImagePath})`,
        backgroundSize: 'contain', // Ensure full image is visible
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center', // Center the image
      }}
    >
      <div className="player-info">
        <span className="player-name">{player.name}</span>
        <div className="player-stats">
          {/* Pass player state and maxMomentum to CombatantDisplay */}
          <CombatantDisplay combatant={player} maxMomentum={maxMomentum} />
          {/* Display Energy separately if not part of CombatantDisplay */}
          <div className="stat-row">
             <span className="stat-label">Energy:</span>
             <span className="stat-value">{player.energy} / {player.maxEnergy}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDisplay; 
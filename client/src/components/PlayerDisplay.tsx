import React from 'react';
import type { PlayerState } from '../../../server/src/types'; // Adjust path if necessary
import CombatantDisplay from './CombatantDisplay';
import './PlayerDisplay.css'; // Import CSS file

interface PlayerDisplayProps {
  player: PlayerState;
}

/**
 * Displays the player's name on the left and stats (HP, Block, Energy, Momentum, Buffs) on the right.
 * Uses PlayerDisplay.css for styling.
 */
const PlayerDisplay: React.FC<PlayerDisplayProps> = ({ player }) => {
  return (
    <div className="player-display-container">
      {/* Left Side: Player Name */}
      <div className="player-info">
        <h2>{player.name}</h2>
      </div>

      {/* Right Side: Stats */}
      <div className="stats-container">
         {/* Use CombatantDisplay for HP, Block, Momentum, Buffs */}
         {/* We need to pass a subset of stats or modify CombatantDisplay */}
         {/* Option: Replicate relevant stats here */}
         <div className="stat-row">
            <span className="stat-label">HP</span>
            <span className="stat-value">{player.hp} / {player.maxHp}</span>
         </div>
         <div className="stat-row">
            <span className="stat-label">Block</span>
            <span className="stat-value">{player.block}</span>
         </div>
         {/* Player-specific stats */}
         <div className="stat-row">
            <span className="stat-label">Energy</span>
            <span className="stat-value">{player.energy} / {player.maxEnergy}</span>
         </div>
         <div className="stat-row">
            <span className="stat-label">Momentum</span>
            <span className="stat-value">{player.momentum} / {player.maxMomentum}</span> {/* Assuming maxMomentum exists */}
         </div>

         {/* Pass only buffs to CombatantDisplay or render them here */}
         <CombatantDisplay combatant={{ buffs: player.buffs } as any} /> {/* Pass only buffs or necessary props */}

      </div>
    </div>
  );
};

export default PlayerDisplay; 
import React from 'react';
// Assuming types can be imported from the server directory. Adjust path if needed.
import type { CombatantState } from '../../../server/src/types';
import BuffIcon from './BuffIcon';

interface CombatantDisplayProps {
  combatant: CombatantState;
}

/**
 * A reusable component to display the core stats of a combatant (Player or Enemy).
 */
const CombatantDisplay: React.FC<CombatantDisplayProps> = ({ combatant }) => {
  return (
    <div className="combatant-display" style={{ border: '1px solid #ccc', padding: '10px', margin: '5px' }}>
      <h4>{combatant.name}</h4>
      <div>
        HP: {combatant.hp} / {combatant.maxHp}
      </div>
      {combatant.block > 0 && (
        <div style={{ color: 'blue' }}>
          Block: {combatant.block}
        </div>
      )}
      {combatant.momentum > 0 && (
        <div style={{ color: 'orange' }}>
          Momentum: {combatant.momentum}
        </div>
      )}
      {combatant.buffs && combatant.buffs.length > 0 && (
        <div className="buff-container" style={{ marginTop: '8px', borderTop: '1px dashed #eee', paddingTop: '5px' }}>
          {combatant.buffs.map((buff, index) => (
            <BuffIcon key={`${buff.id}-${index}`} buff={buff} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CombatantDisplay; 
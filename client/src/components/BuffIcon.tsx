import React from 'react';
// Assuming types can be shared/imported from the server directory.
// Adjust the import path if your project uses a different structure (e.g., monorepo, shared types package).
import type { Buff } from '../../../server/src/types';

interface BuffIconProps {
  buff: Buff;
}

const BuffIcon: React.FC<BuffIconProps> = ({ buff }) => {
  // Construct image path. Assumes images are in public/images/buffs/ and named after the buff id.
  const iconPath = `/images/buffs/${buff.id}.png`; // Ensure your image files match this pattern (e.g., strength.png)

  // Format duration for display
  const durationText = buff.duration === 'permanent' ? 'Permanent' : `Duration: ${buff.duration}`;

  // Tooltip text
  const tooltip = `${buff.name}${buff.stacks > 1 ? ` (x${buff.stacks})` : ''}\n${buff.description}\n${durationText}`;

  return (
    <div
      className="buff-icon"
      title={tooltip}
      style={{
        display: 'inline-block',
        margin: '2px',
        position: 'relative', // Needed for positioning the stack count
      }}
    >
      <img
        src={iconPath}
        alt={buff.name}
        style={{ width: '32px', height: '32px', border: '1px solid #ccc', borderRadius: '4px' }}
        // Basic error handling: display alt text if image fails to load
        onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none'; // Hide broken image icon
            // Optionally, replace with a placeholder or text
            const parent = target.parentElement;
            if (parent) {
                const altText = document.createElement('span');
                altText.textContent = buff.id.substring(0,3); // Show first few letters as fallback
                altText.style.fontSize = '10px';
                altText.style.display = 'inline-block';
                altText.style.width = '32px';
                altText.style.height = '32px';
                altText.style.lineHeight = '32px';
                altText.style.textAlign = 'center';
                altText.style.border = '1px solid #ccc';
                altText.style.borderRadius = '4px';
                altText.title = tooltip;
                parent.appendChild(altText);
            }
        }}

      />
      {/* Display stack count if greater than 1 */}
      {buff.stacks > 1 && (
        <span
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            borderRadius: '50%',
            padding: '1px 4px',
            fontSize: '10px',
            fontWeight: 'bold',
            minWidth: '12px',
            textAlign: 'center',
            lineHeight: '1',
          }}
        >
          {buff.stacks}
        </span>
      )}
    </div>
  );
};

export default BuffIcon; 
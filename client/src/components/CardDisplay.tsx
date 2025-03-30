import React from 'react';
import { CardDefinition } from '../../../server/src/types'; // Adjust the path as needed based on your client structure
import styles from './CardDisplay.module.css'; // Import CSS module

interface CardDisplayProps {
  card: CardDefinition;
  isNextCard?: boolean; // Highlight if it's the main playable card
  isBeingPlayed?: boolean; // Animation trigger
  isNextDrawPreview?: boolean; // Added: Style as the smaller next draw preview
}

// Removed inline styles as they are now in CardDisplay.module.css

const CardDisplay: React.FC<CardDisplayProps> = ({
  card,
  isNextCard = false,
  isBeingPlayed = false,
  isNextDrawPreview = false, // Added prop
}) => {
  const imagePath = `/images/cards/${card.id}.png`; // Assumes images are in public/images/cards/

  // Combine CSS module classes conditionally
  const cardClasses = [
    styles.card,
    isNextCard ? styles.nextCard : '',
    isBeingPlayed ? styles.playing : '',
    isNextDrawPreview ? styles.nextDrawPreview : '', // Apply preview style
  ]
    .filter(Boolean) // Remove empty strings
    .join(' '); // Join into a single string

  console.log(`[CardDisplay] Rendering card: ${card.id}. isNextCard: ${isNextCard}, isBeingPlayed: ${isBeingPlayed}, isNextDrawPreview: ${isNextDrawPreview}`);
  if (isBeingPlayed) {
      console.log(`[CardDisplay] Applying 'playing' class to card: ${card.id}`);
  }

  // Prevent rendering if the card is mid-animation and presumably gone
  // This depends on how state updates; if the card disappears immediately
  // after the action, this might not be strictly necessary, but can prevent flicker.
  // if (isBeingPlayed) {
  //   return null; // Or keep rendering but let animation hide it
  // }

  return (
    // Use the combined classes string
    <div className={cardClasses}>
      <div className={styles.cost}>{card.cost}</div>
      {/* Use image class */}
      <img src={imagePath} alt={card.name} className={styles.image} onError={(e) => (e.currentTarget.src = '/images/cards/default.png')} /> {/* Added fallback */}
      {/* Use name class */}
      <div className={styles.name}>{card.name}</div>
      {/* Use description class */}
      <div className={styles.description}>{card.description}</div>
    </div>
  );
};

export default CardDisplay; 
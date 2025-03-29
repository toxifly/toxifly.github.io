import React from 'react';
import { CardDefinition } from '../../../server/src/types'; // Adjust the path as needed based on your client structure

interface CardDisplayProps {
  card: CardDefinition;
  isNextCard: boolean;
}

// Basic styling - consider moving this to a separate CSS file or using styled-components/Tailwind
const cardStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  borderRadius: '8px',
  padding: '10px',
  margin: '5px',
  width: '150px', // Adjust as needed
  minHeight: '200px', // Adjust as needed
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#f9f9f9',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  position: 'relative', // For positioning cost/image absolutely if desired
};

const nextCardStyle: React.CSSProperties = {
  border: '2px solid blue',
  boxShadow: '0 4px 8px rgba(0,0,255,0.3)',
};

const costStyle: React.CSSProperties = {
  position: 'absolute',
  top: '5px',
  left: '5px',
  backgroundColor: 'lightblue',
  borderRadius: '50%',
  width: '25px',
  height: '25px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  border: '1px solid #aaa',
};

const imageStyle: React.CSSProperties = {
  width: '80%', // Adjust as needed
  height: 'auto',
  margin: '10px auto',
  display: 'block',
};

const nameStyle: React.CSSProperties = {
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: '5px',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '0.9em',
  textAlign: 'center',
  flexGrow: 1, // Make description take remaining space
};

const CardDisplay: React.FC<CardDisplayProps> = ({ card, isNextCard }) => {
  const imagePath = `/images/cards/${card.id}.png`; // Assumes images are in public/images/cards/

  return (
    <div style={{ ...cardStyle, ...(isNextCard ? nextCardStyle : {}) }}>
      <div style={costStyle}>{card.cost}</div>
      <img src={imagePath} alt={card.name} style={imageStyle} />
      <div style={nameStyle}>{card.name}</div>
      <div style={descriptionStyle}>{card.description}</div>
    </div>
  );
};

export default CardDisplay; 
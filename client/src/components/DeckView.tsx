import React from 'react';
import { GameConfig } from '../../../server/src/types'; // Adjust path if necessary
import CardDisplay from './CardDisplay';
import styles from './DeckView.module.css'; // Import the CSS Module

// Basic styles for the modal overlay and content
// const styles = { ... }; // Remove old inline styles

interface DeckViewProps {
    deck: string[]; // Array of card IDs
    gameConfig: GameConfig;
    onClose: () => void;
}

const DeckView: React.FC<DeckViewProps> = ({ deck, gameConfig, onClose }) => {
    if (!gameConfig || !gameConfig.cards) {
        return (
            <div className={styles.overlay}>
                <div className={styles.content}>
                    <button onClick={onClose} className={styles.closeButton}>Close</button>
                    <p className={styles.loadingOrError}>Error: Game configuration not loaded.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.content}>
                <button onClick={onClose} className={styles.closeButton}>Close</button>
                <h2 className={styles.title}>Your Deck ({deck.length} cards)</h2>
                <div className={styles.cardGrid}>
                    {deck.length > 0 ? (
                        deck.map((cardId) => {
                            const cardDef = gameConfig.cards[cardId];
                            if (!cardDef) {
                                console.warn(`Card definition not found for ID: ${cardId}`);
                                return (
                                    <div key={cardId} className={styles.cardWrapper}>
                                        <div className={styles.loadingOrError}>Unknown Card ({cardId})</div>
                                    </div>
                                );
                            }
                            return (
                                <div key={cardId} className={styles.cardWrapper}>
                                    {/* Pass isNextCard and isBeingPlayed as false or undefined */}
                                    <CardDisplay card={cardDef} isNextCard={false} isBeingPlayed={false} />
                                </div>
                            );
                        })
                    ) : (
                        <p className={styles.loadingOrError}>Your deck is empty.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeckView; 
import React, { useEffect, useRef, useState } from 'react';
import { CardDefinition } from '../../../server/src/types';
import styles from './CardDisplay.module.css';

interface CardDisplayProps {
  card: CardDefinition | null;
  instanceId: string | null;
  isNextCard?: boolean;
  isNextDrawPreview?: boolean;
  animationDelay?: number;
  animationDuration?: number;
  previousCardId?: string | null;
}

const CardDisplay: React.FC<CardDisplayProps> = ({
  card,
  instanceId,
  isNextCard = false,
  isNextDrawPreview = false,
  animationDelay = 0,
  animationDuration = 700,
  previousCardId = null,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isFadingIn, setIsFadingIn] = useState(false);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentInstanceIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isNextDrawPreview && card && previousCardId && previousCardId !== card.id) {
      setIsFadingOut(true);
      
      setTimeout(() => {
        setIsFadingOut(false);
        setIsFadingIn(true);
        
        setTimeout(() => {
          setIsFadingIn(false);
        }, 200);
      }, 200);
    }
  }, [card, previousCardId, isNextDrawPreview]);

  useEffect(() => {
    const cardIdForLog = card?.id || 'null';
    
    const clearAnimationTimeout = () => {
      if (animationTimeoutRef.current) {
        console.log(`[CardDisplay] Clearing animation timeout ${animationTimeoutRef.current} for card: ${cardIdForLog} (Instance: ${instanceId})`);
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
      setIsAnimating(false);
    };

    console.log(`[CardDisplay Effect] Card: ${cardIdForLog}, Instance: ${instanceId}, isNextCard: ${isNextCard}, currentInstanceIdRef: ${currentInstanceIdRef.current}`);
    
    if (isNextCard && instanceId) {
      if (instanceId !== currentInstanceIdRef.current) {
        setAnimationCompleted(false);
      }
      
      const shouldAnimate = (instanceId !== currentInstanceIdRef.current) || isNextCard;
      
      currentInstanceIdRef.current = instanceId;
      
      if (shouldAnimate) {
        console.log(`[CardDisplay] Setting up animation for card: ${cardIdForLog} (Instance: ${instanceId})`);
        clearAnimationTimeout();
        
        animationTimeoutRef.current = setTimeout(() => {
          console.log(`[CardDisplay Timeout] Delay finished. Starting animation for card: ${cardIdForLog} (Instance: ${instanceId})`);
          setIsAnimating(true);
          animationTimeoutRef.current = null;
        }, animationDelay);
        
        console.log(`[CardDisplay Effect] Scheduled animation timeout ID: ${animationTimeoutRef.current} with delay ${animationDelay}ms for card: ${cardIdForLog} (Instance: ${instanceId})`);
      } else {
         console.log(`[CardDisplay Effect] Skipping animation setup for card: ${cardIdForLog} (Instance: ${instanceId}) - already tracked or not needed.`);
      }
    } else {
      if (currentInstanceIdRef.current !== null) {
        console.log(`[CardDisplay] Instance ${currentInstanceIdRef.current} is no longer the next card or became invalid`);
        currentInstanceIdRef.current = null;
      }
      clearAnimationTimeout();
      setAnimationCompleted(false);
    }
    
    return clearAnimationTimeout;
  }, [instanceId, isNextCard, animationDelay, card?.id]);

  const handleAnimationEnd = () => {
    const cardIdForLog = card?.id || 'null';
    console.log(`[CardDisplay] Animation ended for card: ${cardIdForLog} (Instance: ${instanceId})`);
    setIsAnimating(false);
    if (isNextCard) {
      setAnimationCompleted(true);
    }
  };

  const animationStyle: React.CSSProperties = isAnimating
    ? { animationDuration: `${animationDuration}ms` }
    : {};

  if (isNextCard && animationCompleted) {
    return <div className={styles.card + ' ' + styles.placeholder}></div>;
  }

  if (!card) {
    return (
      <div
        ref={cardRef}
        className={`${styles.card} ${styles.placeholder} ${isAnimating ? styles.playing : ''}`}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className={styles.placeholderText}>No Card</div>
      </div>
    );
  }

  const imagePath = `/images/cards/${card.id}.png`;

  const cardClasses = [
    styles.card,
    isNextCard ? styles.nextCard : '',
    isNextDrawPreview ? styles.nextDrawPreview : '',
    isAnimating ? styles.playing : '',
    isFadingOut ? styles.fadingOut : '',
    isFadingIn ? styles.fadingIn : '',
  ]
    .filter(Boolean)
    .join(' ');

  console.log(`[CardDisplay] Rendering card: ${card?.id ?? 'N/A'} (Instance: ${instanceId ?? 'N/A'}). isNextCard: ${isNextCard}, isNextDrawPreview: ${isNextDrawPreview}, isAnimating: ${isAnimating}, animationCompleted: ${animationCompleted}`);

  return (
    <div
      ref={cardRef}
      className={cardClasses}
      onAnimationEnd={handleAnimationEnd}
      style={animationStyle}
    >
      <div className={styles.cost}>{card.cost}</div>
      <img src={imagePath} alt={card.name} className={styles.image} onError={(e) => (e.currentTarget.src = '/images/cards/default.png')} />
      <div className={styles.name}>{card.name}</div>
      <div className={styles.description}>{card.description}</div>
    </div>
  );
};

export default CardDisplay;
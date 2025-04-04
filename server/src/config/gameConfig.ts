import { GameConfig } from '../types';
import { config as gameConfigConstants } from '../config'; // Renamed import
import { cards } from '../data/cards';
import { enemies } from '../data/enemies';
import { buffs } from '../data/buffs';

/**
 * Constructs the full GameConfig object by combining constants and data definitions.
 * This ensures the structure matches the GameConfig interface expected by the rest of the application.
 */
export function loadGameConfig(): GameConfig {
  const gameConfig: GameConfig = {
    // Data definitions
    cards: cards,
    enemies: enemies,
    buffs: buffs,

    // Player Stats (map from nested constants)
    PLAYER_MAX_HP: gameConfigConstants.PLAYER_MAX_HP,
    PLAYER_START_ENERGY: gameConfigConstants.PLAYER_START_ENERGY,
    PLAYER_START_MOMENTUM_MAX: gameConfigConstants.PLAYER_START_MOMENTUM_MAX,
    PLAYER_STARTING_DECK: gameConfigConstants.PLAYER_STARTING_DECK,

    // Gameplay Mechanics (map from nested constants)
    STARTING_HAND_SIZE: gameConfigConstants.STARTING_HAND_SIZE,
    NEXT_CARD_DRAWN_ON_SHUFFLE: gameConfigConstants.NEXT_CARD_DRAWN_ON_SHUFFLE,
    MOMENTUM_PER_CARD: gameConfigConstants.MOMENTUM_PER_CARD,
    MOMENTUM_PER_ZERO_COST_CARD: gameConfigConstants.MOMENTUM_PER_ZERO_COST_CARD,
    MOMENTUM_PER_SHUFFLE: gameConfigConstants.MOMENTUM_PER_SHUFFLE,

    // Rewards (map from nested constants)
    REWARD_CHOICES_COUNT: gameConfigConstants.REWARD_CHOICES_COUNT,
    REWARD_SETS: gameConfigConstants.REWARD_SETS,

    // Animation Timings (map from nested constants)
    CARD_ANIMATION_DELAY_MS: gameConfigConstants.CARD_ANIMATION_DELAY_MS,
    CARD_ANIMATION_DURATION_MS: gameConfigConstants.CARD_ANIMATION_DURATION_MS,

    // Note: ANIMATION_SPEEDS, MAX_MOMENTUM, CURRENCY_PER_FLOOR are not included
    // as they are not currently defined in the GameConfig type interface.
    // If they are needed by the client or shared logic, add them to the GameConfig type
    // in types.ts and uncomment/add their mapping here.
  };
  console.log("Game Config Loaded.");
  return gameConfig;
} 
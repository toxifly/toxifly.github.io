import type { CardDefinition } from './data/cards';
import type { EnemyDefinition } from './data/enemies';
import type { BuffDefinition } from './data/buffs';

// Core type definitions for the game state and entities
export type { CardDefinition } from './data/cards';
export type { EnemyDefinition } from './data/enemies';
export type { BuffDefinition } from './data/buffs';

/**
 * Represents a single effect a card can have (e.g., deal damage, gain block, apply buff)
 */
export interface CardEffect {
  type: 'damage' | 'block' | 'applyBuff' | 'drawCard' | 'gainEnergy'; // Add more types as needed
  value?: number; // For damage, block, draw amount, energy gain
  buffType?: string; // ID of the buff to apply
  buffStacks?: number; // Stacks to apply (defaults to 1 if not specified)
}

/**
 * Represents an active buff or debuff on a combatant.
 */
export interface Buff {
  id: string;
  name: string;
  description: string;
  image?: string; // Optional: Path to buff icon
  duration: number | 'permanent'; // Turns remaining or permanent
  stacks: number; // How many times the buff is stacked
  // Potentially add: onApply, onTurnEnd, onTurnStart effect triggers
}

/**
 * Base state for any entity participating in combat.
 */
export interface CombatantState {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  block: number;
  momentum: number;
  buffs: Buff[];
  // image?: string; // Removed - derive from id for enemies
  description?: string; // Optional description, mainly for enemies
}

/**
 * Represents a unique instance of a card in a player's deck, discard, or as the next card.
 */
export interface CardInstance {
  cardId: string; // The ID linking to the CardDefinition
  instanceId: string; // A unique identifier for this specific instance
}

/**
 * Represents the state of the player
 */
export interface PlayerState extends CombatantState {
  energy: number;
  maxEnergy: number;
  deck: CardInstance[]; // Array of card instances
  discard: CardInstance[]; // Array of card instances
  nextCard: CardInstance | null; // The specific instance of the next card to be played
  allCards: string[]; // All card *definition* IDs owned by the player
  // id and name inherited from CombatantState
}

/**
 * Represents the state of the enemy
 */
export interface EnemyState extends CombatantState {
  // energy: number; // Current energy, maybe not needed if enemies follow simple patterns? Let's add maxEnergy
  maxEnergy: number; // Max energy if needed for enemy logic
  deck: string[]; // Card IDs representing the enemy's possible actions/cards
}

/**
 * Represents the overall state of a single player's game session.
 */
export interface GameState {
  gameId: string; // Added gameId
  playerId: string; // Added playerId
  floor: number;
  phase: 'pre_battle' | 'fighting' | 'reward' | 'gameOver';
  turn: 'player' | 'enemy';
  player: PlayerState;
  enemy: EnemyState;
  rewardOptions: CardDefinition[][]; // Array of arrays of card *definitions* for reward choices
  currentRewardSet: number;
  currency: number;
  lastEnemyCardPlayedId: string | null; // ID of the last card the enemy played
  logs?: string[]; // Optional action logs
}

/**
 * Represents the static configuration for the game, loaded at server start.
 * Includes definitions for all cards, enemies, and core game constants.
 */
export interface GameConfig {
  // Use the imported types directly
  cards: Record<string, CardDefinition>;
  enemies: Record<string, EnemyDefinition>;
  buffs: Record<string, BuffDefinition>;

  // Player Stats (ensure these match the keys in config.ts or the constructed object in index.ts)
  PLAYER_MAX_HP: number;
  PLAYER_START_ENERGY: number;
  PLAYER_START_MOMENTUM_MAX: number; // Make sure this key exists in your config/construction
  PLAYER_STARTING_DECK: string[]; // Changed from PLAYER_START_DECK

  // Gameplay Mechanics
  STARTING_HAND_SIZE: number;
  NEXT_CARD_DRAWN_ON_SHUFFLE: boolean;
  MOMENTUM_PER_CARD: number;
  MOMENTUM_PER_ZERO_COST_CARD: number;
  MOMENTUM_PER_SHUFFLE: number;

  // Rewards
  REWARD_CHOICES_COUNT: number; // Changed from REWARD_CHOICES
  REWARD_SETS: number;

  // Animation Timings (ensure these match the keys in config.ts or construction)
  CARD_ANIMATION_DELAY_MS: number;
  CARD_ANIMATION_DURATION_MS: number;

  // Ensure these were intended to be part of the config sent to client
  // If not, remove them here. If yes, ensure they are added during construction in index.ts.
  // MAX_MOMENTUM: number;
  // CURRENCY_PER_FLOOR: number;

  // Add missing nested ANIMATION_SPEEDS if it should be part of GameConfig
  // ANIMATION_SPEEDS: {
  //     CARD_PLAY: number;
  //     ENEMY_TURN: number;
  //     SHUFFLE: number;
  // };
}

/**
 * Represents an action requested by the client to the server.
 * Uses a discriminated union based on the 'type' property.
 */
export interface ActionRequest {
  type: 'autoPlayCard' | 'selectReward' | 'startBattle' | 'newGame'; // Add other valid action types
  payload?: any; // Define specific payload types for each action later if needed
  // Example specific payload types:
  // payload: ActionPayloads[T]; // Where T extends ActionRequest['type']
}

/**
 * Represents game actions the player can take.
 * Extend this as more actions are added.
 */
export const GAME_ACTIONS = {
  autoPlayCard: "Play Card",
  endTurn: "End Turn",
  selectReward: "Select Reward"
  // Add more like 'usePotion', 'viewDeck', etc.
} as const;

export type GameActionType = keyof typeof GAME_ACTIONS;

// Types related to the GamesFun SDK interaction (if needed)
// e.g., ActionRequest, ActionResult 

export interface ActionResult {
    success: boolean;
    message?: string;
} 
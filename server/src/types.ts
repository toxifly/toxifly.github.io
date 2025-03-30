// Core type definitions for the game state and entities

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
 * Defines the static properties of a card
 */
export interface CardDefinition {
  id: string; // Unique identifier, used for image name (e.g., "strike")
  name: string;
  cost: number;
  description: string;
  // image: string; // Removed - derive from id
  effects: CardEffect[]; // Changed from Record<string, ...> to CardEffect[]
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
 * Defines the static properties of a buff/debuff.
 * Used in GameConfig and loaded from data/buffs.ts.
 */
export type BuffDefinition = Omit<Buff, 'stacks' | 'duration'>;

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
 * Represents the state of the player
 */
export interface PlayerState extends CombatantState {
  energy: number;
  maxEnergy: number;
  deck: string[]; // Array of card IDs
  hand: CardDefinition[]; // Currently unused in auto-play model
  discard: string[]; // Array of card IDs
  nextCard: string | null; // <<< CHANGED: Should store the ID of the next card, not the full definition
  allCards: string[]; // All card IDs owned by the player
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
 * Defines the static properties of an enemy type (used for instantiation)
 */
export type EnemyDefinition = Omit<
  EnemyState,
  'hp' | 'block' | 'momentum' | 'buffs' // Omit dynamic combat state
>;

/**
 * Represents the overall state of a single player's game session.
 */
export interface GameState {
  floor: number;
  phase: 'pre_battle' | 'fighting' | 'reward' | 'gameOver';
  turn: 'player' | 'enemy';
  player: PlayerState;
  enemy: EnemyState;
  rewardOptions: CardDefinition[][]; // Array of arrays of card *definitions* for reward choices
  currentRewardSet: number;
  currency: number;
  lastEnemyCardPlayedId: string | null; // ID of the last card the enemy played
}

/**
 * Represents the static configuration for the game, loaded at server start.
 * Includes definitions for all cards, enemies, and core game constants.
 */
export interface GameConfig {
  // Core Game Constants (Values typically loaded from config.ts)
  PLAYER_MAX_HP: number;
  PLAYER_START_ENERGY: number;
  MOMENTUM_PER_CARD: number;
  REWARD_CHOICES_COUNT: number; // How many cards per reward set
  REWARD_SETS: number; // How many sets of rewards are offered

  // Game Data Definitions
  cards: Record<string, CardDefinition>;
  enemies: Record<string, EnemyDefinition>; // Changed Omit<...> to EnemyDefinition
  buffs: Record<string, BuffDefinition>; // Definitions for buffs/debuffs - Changed Omit<...> to BuffDefinition
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
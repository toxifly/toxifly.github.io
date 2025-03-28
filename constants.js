/**
 * Defines constant string values for different card types.
 */
export const CARD_TYPES = {
    ATTACK: 'attack',
    DEFENSE: 'defense',
    SKILL: 'skill',
};

/** Maximum momentum a player can accumulate. */
export const MAX_MOMENTUM = 10;

/** Momentum gained from playing a 0-cost card. */
export const MOMENTUM_GAIN_ZERO_COST = 2;

/** Momentum gained from playing a 1 or 2-cost card. */
export const MOMENTUM_GAIN_DEFAULT = 1;

// --- Turn and Animation Delays (in milliseconds) ---

/** Delay before starting turn actions (drawing cards, status effects). */
export const DELAY_TURN_START = 1000;
/** Short delay before a character decides which card to play. */
export const DELAY_PRE_ACTION = 300;
/** Delay after card animation starts, before its effect executes. Allows animation visibility. */
export const DELAY_PRE_EFFECT = 500;
/** Delay after a card's effect finishes, before the next action or check (like HP checks, next card play). */
export const DELAY_POST_EFFECT = 300;
/** Delay after a turn's actions are complete, before starting the next character's turn. */
export const DELAY_TURN_END = 800;
/** Short delay before the Momentum Burst visual effect appears. */
export const DELAY_MOMENTUM_BURST_PRE = 100;
/** Delay after the Momentum Burst visual effect, before ending the turn. */
export const DELAY_MOMENTUM_BURST_POST = 1000;

/** Number of card options offered as a reward. */
export const NUM_REWARD_CHOICES = 4;

/** Number of cards the player can pick from the reward options. */
export const NUM_REWARD_PICKS = 2; 
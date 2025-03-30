import {
  GameConfig,
  GameState,
  PlayerState,
  EnemyState,
  CombatantState,
  CardDefinition,
  ActionRequest,
  Buff,
  BuffDefinition,
} from './types';
// Import the actual config constants now needed for initialization logic
import { config as gameConfigConstants } from './config';

/**
 * Manages the game state and logic for multiple players.
 */
export class DefaultGameManager {
  private config: GameConfig;
  private playerStates: Map<string, GameState> = new Map(); // Stores game state per player ID

  constructor(config: GameConfig) {
    this.config = config;
    // Ensure card/enemy definitions are part of the config passed in
    if (!config.cards || !config.enemies) {
      throw new Error(
        'GameConfig must include card and enemy definitions.'
      );
    }
    console.log('GameManager initialized');
  }

  /**
   * Retrieves the current game state for a given player.
   * If the player has no state, it initializes a new game state.
   * @param playerId The unique identifier for the player.
   * @returns The current GameState for the player.
   */
  getState(playerId: string): GameState {
    let state = this.playerStates.get(playerId);
    if (!state) {
      console.log(`No state found for player ${playerId}, initializing new game.`);
      // --- Remove TEMPORARY state initialization call ---
      // state = this.initializeNewGameState(playerId); // Old call
      state = this.initializeNewGameState(playerId);
      this.setState(playerId, state);
    }
    return state;
  }

  /**
   * Updates the game state for a specific player.
   * @param playerId The unique identifier for the player.
   * @param state The new GameState object.
   */
  setState(playerId: string, state: GameState): void {
    this.playerStates.set(playerId, state);
    console.log(`State updated for player ${playerId}`);
    // TODO: Consider if any side effects or broadcasts should happen here or elsewhere.
  }

  /**
   * Validates and processes a player action.
   * @param playerId The ID of the player requesting the action.
   * @param action The ActionRequest object from the client.
   * @returns A promise resolving to an object indicating success and an optional message.
   */
  async validateAction(
    playerId: string,
    action: ActionRequest
  ): Promise<{ success: boolean; message?: string }> {
    const currentState = this.getState(playerId);
    // Use a mutable copy for modifications within this action handler
    const state = JSON.parse(JSON.stringify(currentState)) as GameState;
    const player = state.player;
    const enemy = state.enemy;

    console.log(`Processing action ${action.type} for player ${playerId}`);

    switch (action.type) {
      case 'autoPlayCard': {
        if (state.phase !== 'fighting') {
            return { success: false, message: "Cannot play cards outside of fighting phase." };
        }
        if (state.turn !== 'player') {
          return { success: false, message: "Not player's turn." };
        }
        const cardToPlayId = player.nextCard;
        if (!cardToPlayId) {
          return { success: false, message: 'No card ready to play.' };
        }
        const cardToPlayDefinition = this.config.cards[cardToPlayId];
        if (!cardToPlayDefinition) {
            console.error(`Action 'autoPlayCard': Card definition not found for ID: ${cardToPlayId}`);
            player.nextCard = null;
            return { success: false, message: `Internal error: Card definition not found for ID ${cardToPlayId}.` };
        }
        if (player.energy < cardToPlayDefinition.cost) {
          return {
            success: false,
            message: `Not enough energy to play ${cardToPlayDefinition.name} (Cost: ${cardToPlayDefinition.cost}, Have: ${player.energy}).`,
          };
        }
        console.log(`Action 'autoPlayCard' (${cardToPlayDefinition.name}) validated. Executing...`);

        player.energy -= cardToPlayDefinition.cost;
        console.log(`Player ${playerId} spent ${cardToPlayDefinition.cost} energy. Remaining: ${player.energy}`);

        let primaryTarget: CombatantState = player;
        if (cardToPlayDefinition.effects.some(e => e.type === 'damage')) {
            primaryTarget = enemy;
        }
        console.log(`Applying effects of ${cardToPlayDefinition.name}. Caster: Player, Primary Target: ${primaryTarget.name ?? primaryTarget.id}`);
        this.applyCardEffects(cardToPlayDefinition, player, primaryTarget, state);

        const momentumToAdd = cardToPlayDefinition.cost === 0
            ? gameConfigConstants.MOMENTUM_PER_ZERO_COST_CARD
            : gameConfigConstants.MOMENTUM_PER_CARD;
        player.momentum += momentumToAdd;
        console.log(`Player ${playerId} gained ${momentumToAdd} momentum. Total: ${player.momentum}`);

        player.discard.push(cardToPlayId);
        player.nextCard = null;
        console.log(`Card ${cardToPlayDefinition.name} (ID: ${cardToPlayId}) moved to discard. Discard size: ${player.discard.length}`);

        this.drawCard(player);

        this.checkCombatEnd(state);

        let endTurn = false;
        let reason = "";
        if (state.phase === 'fighting') {
            const nextCardId = player.nextCard;
            if (!nextCardId) {
                endTurn = true;
                reason = "No card drawn.";
            } else {
                const nextCardDef = this.config.cards[nextCardId];
                if (!nextCardDef) {
                    endTurn = true;
                    reason = `Could not find definition for next card ID: ${nextCardId}.`;
                    console.error(`GameManager Error: ${reason}`);
                } else if (player.energy < nextCardDef.cost) {
                    endTurn = true;
                    reason = `Cannot afford next card '${nextCardDef.name}' (Cost: ${nextCardDef.cost}, Have: ${player.energy}).`;
                } else {
                    console.log(`Player ${playerId} turn continues. Can afford next card '${nextCardDef.name}' (Cost: ${nextCardDef.cost}, Have: ${player.energy}).`);
                }
            }

            if (endTurn) {
                console.log(`Player ${playerId} ending turn. Reason: ${reason}`);
                this.applyEndOfTurnBuffs(player);
                player.momentum = 0;
                state.turn = 'enemy';
                state.lastEnemyCardPlayedId = null;
            }
        } else {
             console.log(`Combat ended during player action. Phase: ${state.phase}. Turn is ${state.turn}. Turn end logic skipped.`);
        }

        this.setState(playerId, state);

        if ((state.phase as GameState['phase']) === 'gameOver') {
            return { success: true, message: "Game Over" };
        } else {
            console.log(`Action 'autoPlayCard' (${cardToPlayDefinition?.name ?? 'N/A'}) executed successfully for player ${playerId}. Current phase: ${state.phase}, Turn: ${state.turn}`);
            return { success: true };
        }
      }
      case 'selectReward': {
        if (state.phase !== 'reward') {
            return { success: false, message: "Cannot select rewards outside of reward phase." };
        }
        if (action.payload === undefined || typeof action.payload.cardIndex !== 'number') {
            return { success: false, message: "Invalid payload for selectReward action." };
        }
        const cardIndex = action.payload.cardIndex;
        const currentRewardSetIndex = state.currentRewardSet;
        const currentOptions = state.rewardOptions[currentRewardSetIndex];

        if (currentRewardSetIndex >= state.rewardOptions.length) {
            return { success: false, message: `Invalid current reward set index (${currentRewardSetIndex}).` };
        }

        const isValidIndex = cardIndex >= -1 && cardIndex < currentOptions.length;

        if (!isValidIndex) {
            return { success: false, message: `Invalid card index (${cardIndex}) for current reward options.` };
        }

        if (!currentOptions) {
            console.error(`Error: Could not find reward options for set index ${currentRewardSetIndex}`);
            return { success: false, message: `Internal server error: Missing reward options for set ${currentRewardSetIndex}.` };
        }

        console.log(`Action 'selectReward' validated. Player selected index ${cardIndex}. Current Set Index: ${currentRewardSetIndex}`);

        if (cardIndex !== -1) {
            const chosenCardDefinition = currentOptions[cardIndex];
            if (!chosenCardDefinition || !chosenCardDefinition.id) {
                 console.error(`Invalid card definition found in reward set ${currentRewardSetIndex}, index ${cardIndex}`);
            } else {
                 const chosenCardId = chosenCardDefinition.id;
                 player.discard.push(chosenCardId);
                 player.allCards.push(chosenCardId);
                 console.log(`Player ${playerId} added ${chosenCardDefinition.name} (ID: ${chosenCardId}) to discard pile and allCards list.`);
            }
        } else {
            console.log(`Player ${playerId} skipped reward set ${currentRewardSetIndex + 1}.`);
        }

        state.currentRewardSet++;

        console.log(`Checking reward completion: currentRewardSet=${state.currentRewardSet}, REWARD_SETS=${gameConfigConstants.REWARD_SETS}, rewardOptions.length=${state.rewardOptions.length}`);

        if (state.currentRewardSet >= gameConfigConstants.REWARD_SETS || state.currentRewardSet >= state.rewardOptions.length) {
            console.log(`Finished all reward sets. Transitioning to next fight.`);
            state.rewardOptions = [];
            state.currentRewardSet = 0;
            state.phase = 'fighting';
            this.startNewFight(state);
            this.drawCard(player);
            const nextCardId = player.nextCard;
            const nextCardName = nextCardId ? this.config.cards[nextCardId]?.name : 'None';
            console.log(`Phase set to 'fighting'. Next fight setup. First card drawn: ${nextCardName}`);
        } else {
            console.log(`Moving to next reward set (${state.currentRewardSet}/${gameConfigConstants.REWARD_SETS}). Target next index: ${state.currentRewardSet}`);
        }

        this.setState(playerId, state);

        return { success: true };
      }
      case 'startBattle': {
        if (state.phase !== 'pre_battle') {
          return { success: false, message: 'Cannot start battle now.' };
        }
        console.log(`Action 'startBattle' validated. Executing...`);

        state.phase = 'fighting';
        this.drawCard(player);
        const nextCardId = player.nextCard;
        const nextCardName = nextCardId ? this.config.cards[nextCardId]?.name : 'None';
        console.log(`Phase changed to 'fighting'. First card drawn: ${nextCardName}`);

        this.setState(playerId, state);

        return { success: true };
      }
      case 'newGame':
        return { success: true };
      default:
        console.warn(`Unknown or unhandled action type received.`);
        return { success: false, message: 'Unknown action type' };
    }
  }

  /**
   * Applies the effects of a card to the caster and target.
   * @param card The definition of the card being played.
   * @param caster The combatant playing the card.
   * @param target The combatant being targeted (can be the same as caster).
   * @param gameState The current game state (needed for context like drawing cards).
   */
  applyCardEffects(
    card: CardDefinition,
    caster: CombatantState,
    target: CombatantState,
    gameState: GameState // Added gameState for broader context
  ): void {
    console.log(`Applying effects of card ${card.name} from ${caster.name} to ${target.name}`);
    card.effects.forEach(effect => {
      console.log(`  - Applying effect: ${effect.type}, value: ${effect.value}, buff: ${effect.buffType}`);
      switch (effect.type) {
        case 'damage':
          if (effect.value === undefined) {
            console.error(`Card ${card.name} has damage effect without value.`);
            return;
          }
          const damageToDeal = effect.value;
          const blockReduction = Math.min(target.block, damageToDeal);
          target.block -= blockReduction;
          const remainingDamage = damageToDeal - blockReduction;
          if (remainingDamage > 0) {
              target.hp = Math.max(0, target.hp - remainingDamage);
          }
          console.log(`    ${caster.name} dealt ${damageToDeal} damage to ${target.name}. Target HP: ${target.hp}, Block: ${target.block}`);
          break;

        case 'block':
          if (effect.value === undefined) {
            console.error(`Card ${card.name} has block effect without value.`);
            return;
          }
          caster.block += effect.value;
          console.log(`    ${caster.name} gained ${effect.value} block. Total: ${caster.block}`);
          break;

        case 'applyBuff':
          console.log(`    Applying buff ${effect.buffType} (stacks: ${effect.buffStacks ?? 1}) from ${caster.name} to ${target.name} - Logic pending`);
          if (!effect.buffType) {
              console.error(`Card ${card.name} has applyBuff effect without buffType.`);
              return;
          }
          const buffDef = this.config.buffs[effect.buffType.toLowerCase()];
          if (!buffDef) {
              console.error(`Buff definition not found for type: ${effect.buffType}`);
              return;
          }
          const stacksToAdd = effect.buffStacks ?? 1;
          const duration = 1;

          this.applyBuff(target, buffDef, stacksToAdd, duration);
          break;

        case 'drawCard':
           if (effect.value === undefined) {
            console.error(`Card ${card.name} has drawCard effect without value.`);
            return;
           }
           if (caster.id === gameState.player.id) {
              const cardsToDraw = effect.value;
              console.log(`    ${caster.name} attempts to draw ${cardsToDraw} card(s).`);
              for (let i = 0; i < cardsToDraw; i++) {
                this.drawCard(gameState.player);
              }
           } else {
              console.log(`    Draw card effect ignored for non-player caster ${caster.name}`);
           }
          break;

        case 'gainEnergy':
          if (effect.value === undefined) {
            console.error(`Card ${card.name} has gainEnergy effect without value.`);
            return;
           }
           if (caster.id === gameState.player.id) {
             const playerState = gameState.player;
             playerState.energy = Math.min(playerState.maxEnergy, playerState.energy + effect.value);
             console.log(`    ${playerState.name} gained ${effect.value} energy. Total: ${playerState.energy}/${playerState.maxEnergy}`);
           } else {
              console.log(`    Gain energy effect ignored for non-player caster ${caster.name}`);
           }
           break;

        default:
          console.warn(`Unknown card effect type: ${(effect as any).type}`);
      }
    });
  }

  /**
   * Applies a buff to a target combatant, handling stacking or adding new buffs.
   * @param target The combatant receiving the buff.
   * @param buffDef The definition of the buff to apply.
   * @param stacks The number of stacks to apply.
   * @param duration The duration (in turns) for the buff (if not permanent).
   */
  private applyBuff(
      target: CombatantState,
      buffDef: BuffDefinition,
      stacks: number,
      duration: number | 'permanent'
  ): void {
      const existingBuffIndex = target.buffs.findIndex(b => b.id === buffDef.id);

      if (existingBuffIndex !== -1) {
          const existingBuff = target.buffs[existingBuffIndex];
          existingBuff.stacks += stacks;
          if (duration !== 'permanent' && existingBuff.duration !== 'permanent') {
              existingBuff.duration = Math.max(existingBuff.duration, duration);
          } else if (duration === 'permanent') {
               existingBuff.duration = 'permanent';
          }
          console.log(`    Updated buff ${buffDef.name} on ${target.name}. Stacks: ${existingBuff.stacks}, Duration: ${existingBuff.duration}`);
      } else {
          const newBuff: Buff = {
              ...buffDef,
              stacks: stacks,
              duration: duration,
          };
          target.buffs.push(newBuff);
          console.log(`    Applied new buff ${buffDef.name} to ${target.name}. Stacks: ${newBuff.stacks}, Duration: ${newBuff.duration}`);
      }

      if (target.buffs[existingBuffIndex]?.stacks <= 0 && existingBuffIndex !== -1) {
          console.log(`    Buff ${buffDef.name} stacks reached 0 or below. Removing.`);
          target.buffs.splice(existingBuffIndex, 1);
      }
  }

  /**
   * Applies start-of-turn effects for a combatant's buffs.
   * Public because index.ts needs to call it for the player turn start.
   * @param combatant The combatant whose turn is starting.
   */
  applyStartOfTurnBuffs(combatant: CombatantState): void {
      console.log(`Applying start-of-turn buffs for ${combatant.name}`);
  }

  /**
   * Applies end-of-turn effects and ticks down buff durations. Removes expired buffs.
   * @param combatant The combatant whose turn is ending.
   */
  private applyEndOfTurnBuffs(combatant: CombatantState): void {
      console.log(`Applying end-of-turn buffs/ticks for ${combatant.name}`);
      const remainingBuffs: Buff[] = [];

      combatant.buffs.forEach(buff => {
          let keepBuff = true;
          if (buff.duration !== 'permanent') {
              buff.duration -= 1;
              if (buff.duration <= 0) {
                  console.log(`    Buff ${buff.name} expired for ${combatant.name}.`);
                  keepBuff = false;
              }
          }

          if (buff.stacks <= 0) {
             console.log(`    Buff ${buff.name} stacks depleted for ${combatant.name}.`);
             keepBuff = false;
          }

          if (keepBuff) {
              remainingBuffs.push(buff);
          }
      });

      combatant.buffs = remainingBuffs;
      console.log(`    ${combatant.name} finished end-of-turn buffs. Remaining buffs: ${combatant.buffs.length}`);

      if (combatant.block > 0) {
        console.log(`    Resetting ${combatant.name}'s block from ${combatant.block} to 0.`);
        combatant.block = 0;
      }
  }

  /**
   * Sets up the game state for the start of a new fight (e.g., next floor).
   * Selects an enemy based on the floor number and resets its state.
   * **Resets the player's deck using their full `allCards` list and shuffles it.**
   * @param gameState The current game state to modify.
   */
  startNewFight(gameState: GameState): void {
    console.log(`Starting new fight for floor ${gameState.floor}`);

    const availableEnemyIds = Object.keys(this.config.enemies);
    if (availableEnemyIds.length === 0) {
      console.error("Cannot start new fight: No enemies defined in config!");
      gameState.phase = 'gameOver';
      return;
    }

    const enemyIndex = (gameState.floor - 1) % availableEnemyIds.length;
    const enemyIdToSpawn = availableEnemyIds[enemyIndex];
    const enemyDefinition = this.config.enemies[enemyIdToSpawn];

    if (!enemyDefinition) {
      console.error(`Cannot start new fight: Enemy definition not found for ID "${enemyIdToSpawn}"`);
      gameState.phase = 'gameOver';
      return;
    }

    console.log(`Spawning enemy for floor ${gameState.floor}: ${enemyDefinition.name}`);

    const newEnemyState: EnemyState = {
      id: enemyDefinition.id,
      name: enemyDefinition.name,
      maxHp: enemyDefinition.maxHp,
      hp: enemyDefinition.maxHp,
      block: 0,
      momentum: 0,
      buffs: [],
      maxEnergy: enemyDefinition.maxEnergy,
      deck: enemyDefinition.deck.map(id => id.toLowerCase()),
      description: enemyDefinition.description,
    };

    gameState.enemy = newEnemyState;
    gameState.lastEnemyCardPlayedId = null;

    const player = gameState.player;
    console.log(`Resetting player deck for new fight using ${player.allCards.length} cards from allCards.`);
    player.deck = [...player.allCards];
    player.discard = [];
    player.nextCard = null;

    // Reset combat stats
    player.block = 0;
    player.momentum = 0;
    player.buffs = [];
    // Reset energy to maximum
    player.energy = player.maxEnergy;
    console.log(`Player energy reset to max: ${player.energy}/${player.maxEnergy}`);    

    let currentIndex = player.deck.length;
    let randomIndex: number;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [player.deck[currentIndex], player.deck[randomIndex]] = [
        player.deck[randomIndex], player.deck[currentIndex]];
    }
    console.log(`Player deck reset and shuffled. Draw pile size: ${player.deck.length}, Discard pile size: ${player.discard.length}`);

    console.log(`New fight started against ${gameState.enemy.name}. State updated.`);
  }

  /**
   * Generates reward options after a fight is won.
   * Populates gameState.rewardOptions with sets of card choices.
   * @param gameState The current game state to modify.
   */
  generateRewards(gameState: GameState): void {
    console.log(`Generating rewards for floor ${gameState.floor}`);
    gameState.rewardOptions = [];

    const allCardIds = Object.keys(this.config.cards);
    const basicCardIds = new Set(gameConfigConstants.PLAYER_STARTING_DECK.map(id => id.toLowerCase()));
    const nonBasicCardIds = allCardIds.filter(id => !basicCardIds.has(id));

    if (nonBasicCardIds.length === 0) {
      console.warn("No non-basic cards available to generate rewards.");
      return;
    }

    const numChoices = gameConfigConstants.REWARD_CHOICES_COUNT;
    const numSets = gameConfigConstants.REWARD_SETS;

    for (let i = 0; i < numSets; i++) {
      const rewardSet: CardDefinition[] = [];
      const availableIds = [...nonBasicCardIds];

      for (let j = availableIds.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [availableIds[j], availableIds[k]] = [availableIds[k], availableIds[j]];
      }

      const count = Math.min(numChoices, availableIds.length);
      for (let j = 0; j < count; j++) {
        const cardId = availableIds[j];
        const cardDef = this.config.cards[cardId];
        if (cardDef) {
          rewardSet.push(cardDef);
        } else {
          console.error(`Could not find card definition for reward ID: ${cardId}`);
        }
      }

      if (rewardSet.length > 0) {
          console.log(`Generated reward set ${i + 1}:`, rewardSet.map(c => c.name));
          gameState.rewardOptions.push(rewardSet);
      } else if (availableIds.length > 0) {
          console.warn(`Could not generate reward set ${i + 1} despite available non-basic cards.`);
      }
    }

    if (gameState.rewardOptions.length === 0 && nonBasicCardIds.length > 0) {
        console.error("Failed to generate any reward sets, though non-basic cards exist.");
    } else {
        console.log(`Generated ${gameState.rewardOptions.length} reward sets.`);
    }
  }

  /**
   * Initializes a brand new game state for a player.
   * Implements Step 24 logic.
   * @param playerId The player ID.
   * @returns The initialized GameState.
   */
  private initializeNewGameState(playerId: string): GameState {
    console.log(`Initializing new game state for player ${playerId}`);

    const startingDeckIds = gameConfigConstants.PLAYER_STARTING_DECK.map((id) =>
      id.toLowerCase()
    );

    startingDeckIds.forEach((cardId) => {
        if (!this.config.cards[cardId]) {
            console.error(`ERROR: Starting deck card ID "${cardId}" not found in config.cards! Check data/cards.ts and config.ts.`);
        }
    });

    const playerState: PlayerState = {
      id: playerId,
      name: 'Player',
      hp: this.config.PLAYER_MAX_HP,
      maxHp: this.config.PLAYER_MAX_HP,
      block: 0,
      momentum: 0,
      buffs: [],
      energy: this.config.PLAYER_START_ENERGY,
      maxEnergy: this.config.PLAYER_START_ENERGY,
      deck: [...startingDeckIds],
      hand: [],
      discard: [],
      nextCard: null,
      allCards: [...startingDeckIds],
    };

    const enemyIds = Object.keys(this.config.enemies);
    if (enemyIds.length === 0) {
      throw new Error('No enemies defined in the game config!');
    }
    const floor1EnemyId = enemyIds[0];
    const enemyDefinition = this.config.enemies[floor1EnemyId];

    const enemyState: EnemyState = {
      id: enemyDefinition.id,
      name: enemyDefinition.name,
      maxHp: enemyDefinition.maxHp,
      hp: enemyDefinition.maxHp,
      block: 0,
      momentum: 0,
      buffs: [],
      maxEnergy: enemyDefinition.maxEnergy,
      deck: enemyDefinition.deck.map(id => id.toLowerCase()),
      description: enemyDefinition.description,
    };

    const initialGameState: GameState = {
      floor: 1,
      phase: 'pre_battle',
      turn: 'player',
      player: playerState,
      enemy: enemyState,
      rewardOptions: [],
      currentRewardSet: 0,
      currency: 0,
      lastEnemyCardPlayedId: null,
    };

    console.log(`Player ${playerId}: Initial deck before shuffle:`, [...initialGameState.player.deck]);
    this.shuffleDeck(initialGameState.player);
    console.log(`Player ${playerId}: Initial deck after shuffle:`, [...initialGameState.player.deck]);

    console.log("Initial game state created (pre_battle phase).");
    return initialGameState;
  }

  /**
   * Draws the next card for the player, shuffling the discard pile into the deck if necessary.
   * Sets the `playerState.nextCard`. Adds momentum if a shuffle occurs.
   * Implements Step 25 logic.
   * @param playerState The player state to modify.
   */
  private drawCard(playerState: PlayerState): void {
    const playerId = playerState.id;
    console.log(`Attempting to draw card for player ${playerId}`);
    if (playerState.deck.length === 0) {
      console.log(`Deck empty for player ${playerId}. Shuffling discard pile.`);
      this.shuffleDeck(playerState);
      playerState.momentum += gameConfigConstants.MOMENTUM_PER_SHUFFLE;
      console.log(`Player ${playerId} gained ${gameConfigConstants.MOMENTUM_PER_SHUFFLE} momentum from shuffle. Total: ${playerState.momentum}`);

      if (playerState.deck.length === 0) {
        console.warn(`Player ${playerId} has no cards left in deck or discard to draw.`);
        playerState.nextCard = null;
        return;
      }
    }

    const nextCardId = playerState.deck.shift();

    if (!nextCardId) {
      console.error(`Player ${playerId}: Tried to draw card but ID was undefined after length check.`);
      playerState.nextCard = null;
      return;
    }

    const nextCardDefinition = this.config.cards[nextCardId];

    if (!nextCardDefinition) {
      console.error(`Player ${playerId}: Could not find card definition for ID: ${nextCardId}`);
      playerState.nextCard = null;
      return;
    }

    playerState.nextCard = nextCardId;
    console.log(`Player ${playerId} drew next card: ${nextCardDefinition.name} (ID: ${nextCardId}). Deck size: ${playerState.deck.length}`);
  }

  /**
   * Shuffles the player's discard pile back into their deck.
   * If the discard pile is empty, it shuffles the existing deck.
   * Called when the draw pile (`playerState.deck`) is empty during combat,
   * OR during initialization to shuffle the starting deck.
   * @param playerState The player state to modify.
   */
  private shuffleDeck(playerState: PlayerState): void {
    if (playerState.discard.length === 0) {
        if (playerState.deck.length > 0) {
            console.log(`Player ${playerState.id}: Discard pile empty. Shuffling existing draw pile (${playerState.deck.length} cards).`);
        } else {
             console.log(`Player ${playerState.id}: Discard pile and deck are empty. Cannot shuffle.`);
             return;
        }
    } else {
        console.log(`Player ${playerState.id}: Shuffling ${playerState.discard.length} cards from discard into deck (current deck size: ${playerState.deck.length}).`);
        playerState.deck = [...playerState.deck, ...playerState.discard];
        playerState.discard = [];
    }

    let currentIndex = playerState.deck.length;
    let randomIndex: number;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [playerState.deck[currentIndex], playerState.deck[randomIndex]] = [
        playerState.deck[randomIndex], playerState.deck[currentIndex]];
    }

    console.log(`Player ${playerState.id}: Deck shuffled. New deck size: ${playerState.deck.length}`);
  }

  /**
   * Checks if the combat should end based on player or enemy HP.
   * Updates the game state phase if combat ends. If player loses, calculates currency.
   * @param state The current game state (will be modified directly if phase changes).
   */
  private checkCombatEnd(state: GameState): void {
    if (state.phase !== 'fighting') {
      return;
    }

    let phaseChanged = false;
    if (state.player.hp <= 0) {
      console.log(`Player ${state.player.id} defeated. Game Over.`);
      state.phase = 'gameOver';
      state.turn = 'player';
      state.currency = state.floor * 10;
      console.log(`Game Over. Player earned ${state.currency} currency.`);
      phaseChanged = true;
    } else if (state.enemy.hp <= 0) {
      console.log(`Enemy ${state.enemy.name} defeated by ${state.player.id}. Entering reward phase.`);
      state.phase = 'reward';
      state.turn = 'player';
      state.player.momentum = 0;
      state.player.block = 0;
      state.player.buffs = [];
      state.floor++;
      this.generateRewards(state);
      state.currentRewardSet = 0;
      phaseChanged = true;
      console.log(`Generated ${state.rewardOptions.length} reward sets for floor ${state.floor}. Setting currentRewardSet to 0.`);
    }

    if (phaseChanged) {
      console.log(`Combat ended. New phase: ${state.phase}, Floor: ${state.floor}`);
      if (state.phase === 'reward' && state.enemy) {
          state.enemy.buffs = [];
          state.enemy.block = 0;
      }
    }
  }

  /**
   * Executes the enemy's turn based on simple logic (plays first card).
   * Modifies the provided gameState directly.
   * @param gameState The current game state.
   */
  runEnemyTurn(gameState: GameState): void {
    console.log(`Starting enemy turn for enemy: ${gameState.enemy.name}`);
    gameState.lastEnemyCardPlayedId = null;

    if (gameState.phase !== 'fighting') {
      console.log("Enemy turn skipped: Not in fighting phase.");
      return;
    }
    if (gameState.turn !== 'enemy') {
      console.warn("runEnemyTurn called but it's not the enemy's turn.");
      return;
    }

    const enemy = gameState.enemy;
    const player = gameState.player;

    this.applyStartOfTurnBuffs(enemy);
    this.checkCombatEnd(gameState);
    if (gameState.phase !== 'fighting') {
        console.log(`Enemy turn ended early due to combat ending after start-of-turn effects.`);
        return;
    }

    if (!enemy.deck || enemy.deck.length === 0) {
      console.log(`Enemy ${enemy.name} has no actions defined in deck. Ending turn.`);
    } else {
      const cardIdToPlay = enemy.deck[0];
      const cardToPlay = this.config.cards[cardIdToPlay.toLowerCase()];

      if (!cardToPlay) {
        console.error(`Enemy ${enemy.name} tried to play card with unknown ID: ${cardIdToPlay}. Ending turn.`);
      } else {
        console.log(`Enemy ${enemy.name} plays card: ${cardToPlay.name}`);
        gameState.lastEnemyCardPlayedId = cardToPlay.id;
        console.log(`  > Set lastEnemyCardPlayedId to: ${gameState.lastEnemyCardPlayedId}`);
        this.applyCardEffects(cardToPlay, enemy, player, gameState);
      }
    }

    this.checkCombatEnd(gameState);

    if (gameState.phase === 'fighting') {
      console.log(`Enemy ${enemy.name} turn ending. Switching to player turn.`);
      gameState.turn = 'player';
    } else {
      console.log(`Enemy turn ended, but game phase is now ${gameState.phase}. Turn remains ${gameState.turn}.`);
    }
  }
}

export default DefaultGameManager; 
import { CARD_TYPES } from './constants.js';
import { CARD_TEMPLATES, getCardTemplate } from './cards.js';
import { ENEMIES, generateEnemyForFloor } from './enemies.js';
import * as Utils from './utils.js';
import * as UI from './ui.js';

const MAX_FLOOR = 10;
const PLAYER_STARTING_DECK = ['strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'iron_wave', 'quick_slash'];
const PLAYER_STARTING_HP = 50;
const PLAYER_STARTING_ENERGY = 3;
const HAND_SIZE = 5;

class CardBattler {
    constructor() {
        console.log('[Game] Initializing CardBattler...');
        this.player = null;
        this.enemy = null;
        this.currentFloor = 1;
        this.inBattle = false;
        this.battleTurn = 0;

        // Bind event listeners from UI elements
        console.log('[Game] Binding UI event listeners...');
        UI.elements.startBattleBtn.addEventListener('click', () => this.startBattle());
        UI.elements.nextFloorBtn.addEventListener('click', () => this.nextFloor());
        UI.elements.viewDeckBtn.addEventListener('click', () => this.viewDeck());
        UI.elements.restartBtn.addEventListener('click', () => this.restart());
        UI.elements.backToGameBtn.addEventListener('click', () => this.hideViewDeck());

        // Initialize game
        this.setUpNewGame();
        console.log('[Game] CardBattler initialization complete.');
    }

    setUpNewGame() {
        console.log('[Game] Setting up new game...');
        this.currentFloor = 1;
        this.player = {
            name: 'Adventurer',
            hp: PLAYER_STARTING_HP,
            maxHp: PLAYER_STARTING_HP,
            energy: PLAYER_STARTING_ENERGY,
            maxEnergy: PLAYER_STARTING_ENERGY,
            block: 0,
            strength: 0,
            vulnerable: 0, // Add vulnerable status
            berserk: 0,    // Add berserk status
            deck: [...PLAYER_STARTING_DECK],
            hand: [],
            drawPile: [],
            discardPile: []
        };
        console.log('[Game] Player initialized:', JSON.parse(JSON.stringify(this.player))); // Deep copy for logging

        UI.updateFloorInfoUI(this.currentFloor);
        this.generateEnemy(); // Includes logging
        UI.clearLog(); // UI log, not console
        this.log('Welcome to Card Battler! Prepare for battle...', 'system'); // Game log

        console.log('[Game] Enabling initial buttons.');
        UI.elements.startBattleBtn.disabled = false;
        UI.elements.nextFloorBtn.disabled = true;
        UI.elements.rewardContainer.style.display = 'none';
        UI.hideGameOverUI();
        UI.hideDeckUI();
        this.updateStats(); // Initial UI update
        console.log('[Game] New game setup complete.');
    }

    generateEnemy() {
        console.log(`[Game] Generating enemy for floor ${this.currentFloor}...`);
        this.enemy = generateEnemyForFloor(this.currentFloor); // generateEnemyForFloor logs details
        console.log('[Game] Enemy generated:', JSON.parse(JSON.stringify(this.enemy)));
        // Update enemy name immediately in UI
        UI.elements.enemyName.textContent = this.enemy.name;
        this.updateStats(); // Update stats display
    }

    startBattle() {
        console.log('[Game] Attempting to start battle...');
        if (this.inBattle) {
             console.warn('[Game] Battle already in progress. Ignoring startBattle call.');
             return;
        }
        console.log('[Game] Starting battle...');

        this.inBattle = true;
        this.battleTurn = 0;
        console.log(`[Game] Battle state set: inBattle=true, battleTurn=0`);

        // Reset player state for battle
        console.log('[Game] Resetting player state for battle...');
        this.player.hand = [];
        this.player.drawPile = Utils.shuffleArray([...this.player.deck]);
        this.player.discardPile = [];
        this.player.block = 0;
        this.player.energy = this.player.maxEnergy;
        this.player.vulnerable = 0; // Reset vulnerable at start of battle
        console.log(`[Game] Player state reset. Draw pile size: ${this.player.drawPile.length}`);

        // Reset enemy state for battle
        console.log('[Game] Resetting enemy state for battle...');
        this.enemy.hand = [];
        this.enemy.drawPile = Utils.shuffleArray([...this.enemy.deck]);
        this.enemy.discardPile = [];
        this.enemy.block = 0;
        this.enemy.energy = this.enemy.maxEnergy;
        this.enemy.vulnerable = 0; // Reset vulnerable at start of battle
        console.log(`[Game] Enemy state reset. Draw pile size: ${this.enemy.drawPile.length}`);

        this.log(`Battle against ${this.enemy.name} begins!`, 'system');
        console.log(`[Game] Disabling buttons for battle start.`);
        UI.elements.startBattleBtn.disabled = true;
        UI.elements.nextFloorBtn.disabled = true; // Disable during battle
        UI.elements.viewDeckBtn.disabled = true; // Disable during battle

        this.startPlayerTurn();
    }

    startPlayerTurn() {
        console.log('[Game] Checking battle state before starting player turn...');
        if (!this.inBattle) {
            console.warn('[Game] startPlayerTurn called but not in battle. Aborting.');
            return; // Stop if battle ended abruptly
        }

        this.battleTurn++;
        console.log(`[Game] Starting Player Turn ${this.battleTurn}`);
        this.log(`--- Turn ${this.battleTurn} ---`, 'system'); // Game log

        // Start of turn effects
        console.log(`[Game] Player block reset from ${this.player.block} to 0.`);
        this.player.block = 0; // Block resets
        console.log(`[Game] Player energy reset to ${this.player.maxEnergy}.`);
        this.player.energy = this.player.maxEnergy; // Reset energy

        // Apply Berserk effect
        if (this.player.berserk > 0) {
            console.log(`[Game] Applying player Berserk effect (${this.player.berserk})...`);
            this.player.energy += this.player.berserk;
            this.log(`${this.player.name} gains ${this.player.berserk} energy from Berserk.`, 'player'); // Game log
            console.log(`[Game] Player energy increased to ${this.player.energy} by Berserk.`);

            // Deal damage from Berserk (use dealDamage for consistency, ignore block)
            const berserkDamage = this.player.berserk * 2;
            this.log(`${this.player.name} takes ${berserkDamage} damage from Berserk.`, 'player'); // Game log
            console.log(`[Game] Player taking ${berserkDamage} self-damage from Berserk.`);
            const playerDied = this.dealDamage(this.player, this.player, berserkDamage, true); // Source is self, ignore block
            if (playerDied) {
                console.log('[Game] Player died from Berserk damage. Turn ended.');
                return; // Game over handles the rest
            }
        }

        // Reduce Vulnerable duration
        if (this.player.vulnerable > 0) {
             console.log(`[Game] Reducing player Vulnerable duration from ${this.player.vulnerable}.`);
             this.player.vulnerable--;
             if (this.player.vulnerable === 0) {
                this.log(`${this.player.name} is no longer Vulnerable.`, 'player'); // Game log
                console.log(`[Game] Player is no longer Vulnerable.`);
             } else {
                 console.log(`[Game] Player Vulnerable duration now ${this.player.vulnerable}.`);
             }
        }

        // Draw cards
        console.log(`[Game] Player drawing up to ${HAND_SIZE} cards.`);
        for (let i = 0; i < HAND_SIZE; i++) {
            this.drawCard(); // drawCard has its own logging
        }
        console.log(`[Game] Player finished drawing. Hand size: ${this.player.hand.length}`);

        this.updateUI(); // Update UI after drawing
        console.log('[Game] UI updated after drawing cards.');

        // Start automated player actions after a delay
        console.log('[Game] Scheduling automated player turn action...');
        setTimeout(() => this.playPlayerTurn(), 1000);
    }

    async playPlayerTurn() {
        console.log('[Game] Executing automated player turn action...');
        if (!this.inBattle) {
             console.warn('[Game] playPlayerTurn called but not in battle. Aborting.');
             return; // Stop if battle ended
        }

        // Simple AI: find the first playable card
        let cardToPlay = null;
        let cardIndex = -1;

        console.log('[Game] Player AI searching for a playable card...');
        for (let i = 0; i < this.player.hand.length; i++) {
            const cardId = this.player.hand[i];
            const template = getCardTemplate(cardId);
            console.log(`[Game] AI checking card: ${cardId} (Cost: ${template.cost}, Player Energy: ${this.player.energy})`);
            if (template.cost <= this.player.energy) {
                cardToPlay = cardId;
                cardIndex = i;
                console.log(`[Game] AI found playable card: ${cardToPlay} at index ${cardIndex}.`);
                break; // Play the first one found
            }
        }

        if (cardToPlay) {
             console.log(`[Game] Player playing card: ${cardToPlay}`);
             // Remove card from hand *before* playing effect
            this.player.hand.splice(cardIndex, 1);
            console.log(`[Game] Card ${cardToPlay} removed from hand. Hand size: ${this.player.hand.length}`);

            const template = getCardTemplate(cardToPlay);
            console.log(`[Game] Paying energy cost: ${template.cost}. Current energy: ${this.player.energy}`);
            this.player.energy -= template.cost;
            console.log(`[Game] Player energy after cost: ${this.player.energy}`);

            this.log(`${this.player.name} plays ${template.name}.`, 'player'); // Game log
            UI.animateCardPlay(cardToPlay, template, true); // UI logs animation start
            this.updateUI(); // Update UI immediately after cost/hand change
            console.log('[Game] UI updated after paying cost.');

            // Wait for card animation before effect
            console.log('[Game] Waiting for card play animation...');
            await Utils.delay(300);
            console.log('[Game] Animation delay complete. Executing card effect...');

            template.effect(this, this.player, this.enemy); // Card effect should log its actions
            console.log(`[Game] Card effect for ${cardToPlay} finished.`);
            this.player.discardPile.push(cardToPlay); // Move to discard after effect
            console.log(`[Game] Card ${cardToPlay} moved to discard pile. Discard size: ${this.player.discardPile.length}`);
            this.updateUI(); // Update after effect resolution
            console.log('[Game] UI updated after card effect.');

            // Check if game ended
            if (!this.inBattle) {
                 console.log('[Game] Battle ended during card effect. Stopping player turn.');
                 return; // Stop if battle ended during card effect
            }

            // Continue playing if possible after a delay
            console.log('[Game] Scheduling next player action...');
            setTimeout(() => this.playPlayerTurn(), 800);

        } else {
            // No playable cards, end turn
            console.log('[Game] Player AI found no playable cards. Ending turn.');
            this.endPlayerTurn();
        }
    }

    endPlayerTurn() {
        console.log('[Game] Ending player turn...');
        this.log(`${this.player.name} ends their turn.`, 'player'); // Game log

        // Discard hand
        console.log(`[Game] Discarding player hand. Hand size: ${this.player.hand.length}`);
        this.player.discardPile.push(...this.player.hand);
        this.player.hand = [];
        console.log(`[Game] Player hand discarded. Discard size: ${this.player.discardPile.length}`);

        this.updateUI();
        console.log('[Game] UI updated after discarding hand.');

        // Start enemy turn after a delay
        console.log('[Game] Scheduling enemy turn start...');
        setTimeout(() => this.startEnemyTurn(), 1000);
    }


     startEnemyTurn() {
        console.log('[Game] Checking battle state before starting enemy turn...');
        if (!this.inBattle) {
            console.warn('[Game] startEnemyTurn called but not in battle. Aborting.');
            return; // Stop if battle ended
        }

        console.log(`[Game] Starting Enemy Turn ${this.battleTurn}`);
        this.log(`${this.enemy.name}'s turn.`, 'enemy'); // Game log

        // Start of turn effects
        console.log(`[Game] Enemy block reset from ${this.enemy.block} to 0.`);
        this.enemy.block = 0;
        console.log(`[Game] Enemy energy reset to ${this.enemy.maxEnergy}.`);
        this.enemy.energy = this.enemy.maxEnergy;

        // Apply Berserk effect for enemy
        if (this.enemy.berserk > 0) {
            console.log(`[Game] Applying enemy Berserk effect (${this.enemy.berserk})...`);
            this.enemy.energy += this.enemy.berserk;
            this.log(`${this.enemy.name} gains ${this.enemy.berserk} energy from Berserk.`, 'enemy'); // Game log
            console.log(`[Game] Enemy energy increased to ${this.enemy.energy} by Berserk.`);

            const berserkDamage = this.enemy.berserk * 2;
            this.log(`${this.enemy.name} takes ${berserkDamage} damage from Berserk.`, 'enemy'); // Game log
             console.log(`[Game] Enemy taking ${berserkDamage} self-damage from Berserk.`);
            const enemyDied = this.dealDamage(this.enemy, this.enemy, berserkDamage, true);
            if (enemyDied) {
                console.log('[Game] Enemy died from Berserk damage. Turn ended.');
                return; // enemyDefeated handles the rest
            }
        }

        // Reduce Vulnerable duration
         if (this.enemy.vulnerable > 0) {
             console.log(`[Game] Reducing enemy Vulnerable duration from ${this.enemy.vulnerable}.`);
             this.enemy.vulnerable--;
             if (this.enemy.vulnerable === 0) {
                this.log(`${this.enemy.name} is no longer Vulnerable.`, 'enemy'); // Game log
                console.log(`[Game] Enemy is no longer Vulnerable.`);
             } else {
                 console.log(`[Game] Enemy Vulnerable duration now ${this.enemy.vulnerable}.`);
             }
        }


        // Draw cards for enemy (simplified, no UI for enemy hand)
        console.log(`[Game] Enemy drawing up to ${HAND_SIZE} cards.`);
        this.enemy.hand = [];
        for (let i = 0; i < HAND_SIZE; i++) { // Assume enemies also draw HAND_SIZE
            if (this.enemy.drawPile.length === 0 && this.enemy.discardPile.length > 0) {
                console.log(`[Game] Enemy draw pile empty. Shuffling discard pile (${this.enemy.discardPile.length} cards)...`);
                this.enemy.drawPile = Utils.shuffleArray([...this.enemy.discardPile]); // Utils logs shuffle
                this.enemy.discardPile = [];
                this.log(`${this.enemy.name} shuffles their discard pile.`, 'enemy'); // Game log
                console.log(`[Game] Enemy discard pile shuffled into draw pile. Draw size: ${this.enemy.drawPile.length}`);
            }
            if (this.enemy.drawPile.length > 0) {
                this.enemy.hand.push(this.enemy.drawPile.pop());
            } else {
                 console.log(`[Game] Enemy draw pile empty, cannot draw more cards.`);
                 break; // No more cards to draw
            }
        }
        console.log(`[Game] Enemy finished drawing. Hand size: ${this.enemy.hand.length}`);

        this.updateStats();
        console.log('[Game] Stats updated after enemy draw.');

        // Play enemy turn after a delay
        console.log('[Game] Scheduling enemy turn action...');
        setTimeout(() => this.playEnemyTurn(), 1000);
    }

    async playEnemyTurn() {
        console.log('[Game] Executing enemy turn action...');
        if (!this.inBattle) {
             console.warn('[Game] playEnemyTurn called but not in battle. Aborting.');
             return; // Stop if battle ended
        }

        // Simple AI: find the first playable card
        let cardToPlay = null;
        let cardIndex = -1;

        console.log('[Game] Enemy AI searching for a playable card...');
         for (let i = 0; i < this.enemy.hand.length; i++) {
            const cardId = this.enemy.hand[i];
            const template = getCardTemplate(cardId);
             console.log(`[Game] AI checking card: ${cardId} (Cost: ${template.cost}, Enemy Energy: ${this.enemy.energy})`);
            if (template.cost <= this.enemy.energy) {
                cardToPlay = cardId;
                cardIndex = i;
                console.log(`[Game] AI found playable card: ${cardToPlay} at index ${cardIndex}.`);
                break; // Play the first one found
            }
        }


        if (cardToPlay) {
            console.log(`[Game] Enemy playing card: ${cardToPlay}`);
            // Remove card from hand *before* playing effect
            this.enemy.hand.splice(cardIndex, 1);
             console.log(`[Game] Card ${cardToPlay} removed from enemy hand. Hand size: ${this.enemy.hand.length}`);


            const template = getCardTemplate(cardToPlay);
             console.log(`[Game] Enemy paying energy cost: ${template.cost}. Current energy: ${this.enemy.energy}`);
            this.enemy.energy -= template.cost;
            console.log(`[Game] Enemy energy after cost: ${this.enemy.energy}`);

            this.log(`${this.enemy.name} plays ${template.name}.`, 'enemy'); // Game log
            UI.animateCardPlay(cardToPlay, template, false); // Show floating name
            this.updateStats(); // Update energy display
            console.log('[Game] Stats updated after enemy paying cost.');

            // Wait for visual cue before effect
            console.log('[Game] Waiting for enemy card visual cue...');
            await Utils.delay(300);
            console.log('[Game] Delay complete. Executing enemy card effect...');


            template.effect(this, this.enemy, this.player); // Card effect should log its actions
            console.log(`[Game] Card effect for ${cardToPlay} finished.`);
            this.enemy.discardPile.push(cardToPlay); // Move to discard after effect
            console.log(`[Game] Card ${cardToPlay} moved to enemy discard pile. Discard size: ${this.enemy.discardPile.length}`);
            this.updateUI(); // Update after effect resolution
            console.log('[Game] UI updated after enemy card effect.');


            // Check if game ended
            if (!this.inBattle) {
                console.log('[Game] Battle ended during enemy card effect. Stopping enemy turn.');
                return; // Stop if battle ended during card effect
            }

            // Continue playing if possible after a delay
            console.log('[Game] Scheduling next enemy action...');
            setTimeout(() => this.playEnemyTurn(), 800);

        } else {
            // No playable cards, end turn
            console.log('[Game] Enemy AI found no playable cards. Ending turn.');
            this.endEnemyTurn();
        }
    }

     endEnemyTurn() {
        console.log('[Game] Ending enemy turn...');
        this.log(`${this.enemy.name} ends their turn.`, 'enemy'); // Game log

        // Discard hand (no UI update needed for enemy hand)
        console.log(`[Game] Discarding enemy hand. Hand size: ${this.enemy.hand.length}`);
        this.enemy.discardPile.push(...this.enemy.hand);
        this.enemy.hand = [];
        console.log(`[Game] Enemy hand discarded. Discard size: ${this.enemy.discardPile.length}`);


        this.updateStats(); // Update just in case block/energy changed implicitly
        console.log('[Game] Stats updated after enemy turn end.');

        // Start player turn after a delay
        console.log('[Game] Scheduling player turn start...');
        setTimeout(() => this.startPlayerTurn(), 1000);
    }


    drawCard() {
        // Check hand size limit
        if (this.player.hand.length >= 10) { // Max hand size limit
            console.warn(`[Game] Player hand is full (${this.player.hand.length}/10). Burning next card.`);
            this.log(`${this.player.name}'s hand is full! Card burned.`, 'player'); // Game log
             // Check if shuffle is needed before burning
             if (this.player.drawPile.length === 0 && this.player.discardPile.length > 0) {
                console.log(`[Game] Player draw pile empty. Shuffling discard pile (${this.player.discardPile.length} cards) before burning...`);
                this.player.drawPile = Utils.shuffleArray([...this.player.discardPile]); // Utils logs shuffle
                this.player.discardPile = [];
                this.log(`${this.player.name} shuffles their discard pile.`, 'player'); // Game log
                console.log(`[Game] Player discard pile shuffled into draw pile. Draw size: ${this.player.drawPile.length}`);
            }
             // Burn the card if possible
             if (this.player.drawPile.length > 0) {
                 const burnedCard = this.player.drawPile.pop();
                 console.log(`[Game] Burned card: ${burnedCard}. Draw pile size: ${this.player.drawPile.length}`);
                 // Optionally, move burned card to a separate pile or just log it
             } else {
                  console.warn('[Game] Player hand full, but no cards in draw pile to burn.');
             }
            return; // Don't draw
        }

        // Shuffle if necessary
        if (this.player.drawPile.length === 0 && this.player.discardPile.length > 0) {
            console.log(`[Game] Player draw pile empty. Shuffling discard pile (${this.player.discardPile.length} cards)...`);
            this.player.drawPile = Utils.shuffleArray([...this.player.discardPile]); // Utils logs shuffle
            this.player.discardPile = [];
            this.log(`${this.player.name} shuffles their discard pile.`, 'player'); // Game log
            console.log(`[Game] Player discard pile shuffled into draw pile. Draw size: ${this.player.drawPile.length}`);
        }

        // Draw the card
        if (this.player.drawPile.length > 0) {
            const cardId = this.player.drawPile.pop();
            this.player.hand.push(cardId);
            console.log(`[Game] Player drew card: ${cardId}. Hand size: ${this.player.hand.length}, Draw pile size: ${this.player.drawPile.length}`);
            // Don't log every draw to game log, it's too noisy
            // this.log(`${this.player.name} draws a card.`, 'player');
        } else {
            console.log(`[Game] Player has no cards left in draw or discard piles.`);
            this.log(`${this.player.name} has no cards left to draw.`, 'player'); // Game log
        }
        // UI Update happens in the calling function (startPlayerTurn) or after card effect
    }

    dealDamage(source, target, amount, ignoreBlock = false) {
        console.log(`[Game] Calculating damage: ${source.name} -> ${target.name}, Base amount: ${amount}, Ignore block: ${ignoreBlock}`);
        if (amount <= 0) {
             console.log('[Game] Damage amount is zero or less. No damage dealt.');
             return false; // No damage dealt
        }

        let finalAmount = amount;

        // Apply strength bonus
        if (source !== target && source.strength) {
            console.log(`[Game] Applying source strength bonus: +${source.strength}`);
            finalAmount += source.strength;
        }

        // Apply Vulnerable
        if (target.vulnerable > 0) {
            const vulnerableMultiplier = 1.5;
            const amountBeforeVulnerable = finalAmount;
            finalAmount = Math.floor(finalAmount * vulnerableMultiplier);
            console.log(`[Game] Applying target Vulnerable bonus (${target.vulnerable} turns): ${amountBeforeVulnerable} * ${vulnerableMultiplier} -> ${finalAmount}`);
            // Vulnerable counter decreases at start of target's turn, not here
        }

        let damageDealt = finalAmount;
        let blockedAmount = 0;

        // Apply block if not ignoring
        if (!ignoreBlock && target.block > 0) {
            console.log(`[Game] Target has ${target.block} block. Applying block...`);
            blockedAmount = Math.min(target.block, finalAmount);
            target.block -= blockedAmount;
            damageDealt = finalAmount - blockedAmount;
            if (blockedAmount > 0) {
                 this.log(`${target.name}'s block absorbs ${blockedAmount} damage.`, source === this.player ? 'player' : 'enemy'); // Game log
                 console.log(`[Game] Block absorbed ${blockedAmount} damage. Remaining block: ${target.block}`);
            }
        } else if (ignoreBlock) {
            console.log(`[Game] Ignoring target block (${target.block}).`);
        } else {
             console.log(`[Game] Target has no block.`);
        }

        // Apply damage to HP
        if (damageDealt > 0) {
             console.log(`[Game] Dealing ${damageDealt} damage to ${target.name}'s HP (${target.hp}).`);
            target.hp -= damageDealt;
            this.log(`${source.name} deals ${damageDealt} damage to ${target.name}.`, source === this.player ? 'player' : 'enemy'); // Game log
            console.log(`[Game] ${target.name} HP after damage: ${target.hp}`);
            UI.showDamageEffect(target === this.player ? UI.elements.player : UI.elements.enemy, damageDealt); // UI logs effect start
        } else {
             console.log('[Game] No damage dealt to HP after block application.');
        }

        this.updateStats(); // Update UI after HP/Block changes
        console.log('[Game] Stats updated after damage calculation.');

        // Check for lethal
        if (target.hp <= 0) {
            console.log(`[Game] Target ${target.name} HP reached zero or below.`);
            target.hp = 0; // Ensure HP doesn't go negative
            if (target === this.enemy) {
                console.log('[Game] Enemy defeated.');
                this.enemyDefeated();
                return true; // Target was defeated
            } else {
                console.log('[Game] Player defeated.');
                this.gameOver(false); // Player was defeated
                return true; // Target was defeated
            }
        }
        console.log(`[Game] Target ${target.name} survived the damage.`);
        return false; // Target survived
    }

    enemyDefeated() {
        console.log('[Game] Processing enemy defeat...');
        this.inBattle = false; // Mark battle as ended
        console.log('[Game] Battle state set: inBattle=false');
        this.log(`${this.enemy.name} has been defeated!`, 'reward'); // Game log
        this.updateStats(); // Update final enemy HP to 0

        // If max floor reached, trigger victory directly
        if (this.currentFloor >= MAX_FLOOR) {
             console.log(`[Game] Max floor (${MAX_FLOOR}) reached. Triggering victory.`);
             this.gameOver(true);
        } else {
            console.log('[Game] Showing reward screen and enabling next floor button.');
            this.showReward();
            UI.elements.nextFloorBtn.disabled = false;
            UI.elements.viewDeckBtn.disabled = false; // Re-enable deck view
        }
        console.log('[Game] Enemy defeat processing complete.');
    }

    showReward() {
        console.log('[Game] Generating rewards...');
        // Generate 3 random card choices
        const rewardCardIds = [];
        const rarities = ['common', 'uncommon', 'rare'];

        // Basic rarity weighting (adjust as needed)
        let commonChance = 0.6;
        let uncommonChance = 0.3;
        let rareChance = 0.1;

        // Slightly increase chances of better cards on higher floors
        const floorBonus = Math.min(this.currentFloor * 0.02, 0.2); // Max 20% shift
        commonChance = Math.max(0.1, commonChance - floorBonus);
        rareChance += floorBonus / 2;
        uncommonChance = 1 - commonChance - rareChance;

        console.log('[Game] Reward rarity weights:', { commonChance, uncommonChance, rareChance });

        for (let i = 0; i < 3; i++) {
            let selectedRarity;
            const roll = Math.random();
             console.log(`[Game] Reward roll ${i+1}: ${roll.toFixed(3)}`);

            if (roll < commonChance) selectedRarity = 'common';
            else if (roll < commonChance + uncommonChance) selectedRarity = 'uncommon';
            else selectedRarity = 'rare';
             console.log(`[Game] Selected rarity: ${selectedRarity}`);

            const possibleCards = CARD_TEMPLATES.filter(card => card.rarity === selectedRarity);
            if (possibleCards.length === 0) { // Fallback if no cards of that rarity exist
                 i--; continue;
            }

            let cardTemplate;
            do {
                 cardTemplate = possibleCards[Math.floor(Math.random() * possibleCards.length)];
            } while (rewardCardIds.includes(cardTemplate.id)); // Avoid duplicates in the reward screen

             console.log(`[Game] Chosen reward card ${i+1}: ${cardTemplate.id}`);
            rewardCardIds.push(cardTemplate.id);
        }

        console.log('[Game] Displaying reward UI with cards:', rewardCardIds);
        UI.showRewardUI(rewardCardIds, (chosenCardId) => this.handleRewardChoice(chosenCardId)); // UI logs show
    }

    handleRewardChoice(chosenCardId) {
        console.log(`[Game] Handling reward choice. Chosen card ID: ${chosenCardId}`);
        if (chosenCardId) {
            this.player.deck.push(chosenCardId);
            const cardTemplate = getCardTemplate(chosenCardId);
            this.log(`Added ${cardTemplate.name} to your deck!`, 'reward'); // Game log
            console.log(`[Game] Added ${chosenCardId} to player deck. New deck size: ${this.player.deck.length}`);
        } else {
            this.log('Skipped card reward.', 'system'); // Game log
            console.log('[Game] Player skipped reward.');
        }
        console.log('[Game] Reward choice handled.');
        // UI hides itself in showRewardUI callback
    }


    nextFloor() {
        console.log(`[Game] Advancing to next floor from floor ${this.currentFloor}.`);
        this.currentFloor++;
        UI.updateFloorInfoUI(this.currentFloor); // UI logs update

        // Heal player
        const hpBeforeHeal = this.player.hp;
        const healAmount = Math.min(this.player.maxHp - this.player.hp, Math.floor(this.player.maxHp * 0.3)); // Heal 30% or up to full
        if (healAmount > 0) {
            this.player.hp += healAmount;
            this.log(`You rest and recover ${healAmount} HP.`, 'reward'); // Game log
            console.log(`[Game] Player healed for ${healAmount} HP. HP: ${hpBeforeHeal} -> ${this.player.hp}`);
            UI.showHealEffect(UI.elements.player, healAmount); // UI logs effect
        } else {
            console.log('[Game] Player already at max HP or heal amount is zero. No healing applied.');
        }

        console.log('[Game] Generating enemy for the new floor...');
        this.generateEnemy(); // Logs internally
        this.updateUI(); // Update HP and enemy info
        console.log('[Game] UI updated for new floor.');

        UI.elements.startBattleBtn.disabled = false; // Enable start for next battle
        UI.elements.nextFloorBtn.disabled = true;
        console.log('[Game] Buttons updated for new floor (Start enabled, Next disabled).');


        this.log(`Entering Floor ${this.currentFloor}...`, 'system'); // Game log
        console.log(`[Game] Entered Floor ${this.currentFloor}. Ready for player to start battle.`);

         // No auto-start, let player click "Start Battle"
         // setTimeout(() => this.startBattle(), 1000);
    }

    gameOver(victory) {
        console.log(`[Game] Game Over. Victory: ${victory}`);
        this.inBattle = false; // Ensure battle state is off
        console.log('[Game] Battle state set: inBattle=false');
        UI.showGameOverUI(victory, this.currentFloor); // UI logs show
        if (victory) {
            this.log('Congratulations! You have conquered the spire!', 'reward'); // Game log
        } else {
            this.log('Game over! You have been defeated.', 'system'); // Game log
        }
        UI.elements.startBattleBtn.disabled = true;
        UI.elements.nextFloorBtn.disabled = true;
        UI.elements.viewDeckBtn.disabled = true; // Disable deck view on game over
        console.log('[Game] Game over buttons disabled.');
    }

    restart() {
        console.log('[Game] Restarting game...');
        this.setUpNewGame();
        console.log('[Game] Game restart complete.');
    }

    viewDeck() {
        console.log('[Game] Showing deck view UI...');
        UI.showDeckUI(this.player); // UI logs show
    }

    hideViewDeck() {
         console.log('[Game] Hiding deck view UI...');
        UI.hideDeckUI(); // UI logs hide
    }

    // Update all relevant UI parts
    updateUI() {
         // console.debug('[Game] Updating Full UI (Stats + Hand)...'); // Can be noisy
        this.updateStats();
        UI.updatePlayerHandUI(this.player.hand); // UI logs update
    }

    // Update only the stat displays
    updateStats() {
        // console.debug('[Game] Updating Stats UI...'); // Can be noisy
        UI.updateStatsUI(this.player, this.enemy); // UI logs update
    }

     // Centralized logging to game window
    log(message, type = 'system') {
        // console.debug(`[Game][Log] ${type}: ${message}`); // Log to console as well
        UI.logMessage(message, type); // UI logs add
    }
}

// Initialize game when script loads
window.addEventListener('load', () => {
    console.log('[Game] Window loaded. Initializing game instance.');
    const game = new CardBattler();
    // Make game instance globally accessible for debugging (optional)
    // window.currentGame = game;
    // console.log('[Game] Game instance created and potentially assigned to window.currentGame.');
}); 
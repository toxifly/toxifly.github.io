import { shuffleArray, delay } from './utils.js';
import {
    elements,
    updatePlayerHandUI,
    updateStatsUI,
    updateFloorInfoUI,
    logMessage,
    clearLog,
    showDamageEffect,
    showHealEffect,
    animateCardPlay,
    showMomentumBurstEffect,
    showRewardUI,
    showGameOverUI,
    hideGameOverUI,
    showDeckUI,
    hideDeckUI,
    updateNextCardPreviewUI
} from './ui.js';
import { getCardTemplate, CARD_TEMPLATES } from './cards.js';
import { generateEnemyForFloor } from './enemies.js';
import { MAX_MOMENTUM, MOMENTUM_GAIN_DEFAULT, MOMENTUM_GAIN_ZERO_COST } from './constants.js';

const MAX_FLOOR = 10;
const PLAYER_STARTING_DECK = ['strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'iron_wave', 'quick_slash'];
const PLAYER_STARTING_HP = 50;
const PLAYER_STARTING_ENERGY = 3;
const PLAYER_MAX_HAND_SIZE = 1;
const ENEMY_HAND_SIZE = 5;
const MAX_HAND_SIZE = 10;
const BASE_DRAW = 1;

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
        elements.startBattleBtn.addEventListener('click', () => this.startBattle());
        elements.nextFloorBtn.addEventListener('click', () => this.nextFloor());
        elements.viewDeckBtn.addEventListener('click', () => this.viewDeck());
        elements.restartBtn.addEventListener('click', () => this.restart());
        elements.backToGameBtn.addEventListener('click', () => this.hideViewDeck());

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
            vulnerable: 0,
            berserk: 0,
            deck: [...PLAYER_STARTING_DECK],
            hand: [],
            drawPile: [],
            discardPile: [],
            statusEffects: {},
            momentum: 0,
        };
        console.log('[Game] Player initialized:', JSON.parse(JSON.stringify(this.player)));

        updateFloorInfoUI(this.currentFloor);
        this.generateEnemy();
        clearLog();
        this.log('Welcome to Card Battler! Prepare for battle...', 'system');

        console.log('[Game] Enabling initial buttons.');
        elements.startBattleBtn.disabled = false;
        elements.nextFloorBtn.disabled = true;
        if (elements.rewardContainer) elements.rewardContainer.style.display = 'none';
        hideGameOverUI();
        hideDeckUI();
        this.updateStats();
        console.log('[Game] New game setup complete.');
    }

    generateEnemy() {
        console.log(`[Game] Generating enemy for floor ${this.currentFloor}...`);
        this.enemy = generateEnemyForFloor(this.currentFloor);
        console.log('[Game] Enemy generated:', JSON.parse(JSON.stringify(this.enemy)));
        if (elements.enemyName) elements.enemyName.textContent = this.enemy.name;
        this.updateStats();
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

        this.player.hand = [];
        this.player.drawPile = shuffleArray([...this.player.deck]);
        this.player.discardPile = [];
        this.player.block = 0;
        this.player.energy = this.player.maxEnergy;
        this.player.vulnerable = 0;
        this.player.statusEffects = {};
        this.player.momentum = 0;
        console.log(`[Game] Player state reset. Draw pile size: ${this.player.drawPile.length}`);

        this.enemy.hand = [];
        this.enemy.drawPile = shuffleArray([...this.enemy.deck]);
        this.enemy.discardPile = [];
        this.enemy.block = 0;
        this.enemy.energy = this.enemy.maxEnergy;
        this.enemy.vulnerable = 0;
        console.log(`[Game] Enemy state reset. Draw pile size: ${this.enemy.drawPile.length}`);

        this.log(`Battle against ${this.enemy.name} begins!`, 'system');
        console.log(`[Game] Disabling buttons for battle start.`);
        elements.startBattleBtn.disabled = true;
        elements.nextFloorBtn.disabled = true;
        elements.viewDeckBtn.disabled = true;

        this.startPlayerTurn();
    }

    startPlayerTurn() {
        console.log('[Game] Checking battle state before starting player turn...');
        if (!this.inBattle) {
            console.warn('[Game] startPlayerTurn called but not in battle. Aborting.');
            return;
        }

        this.battleTurn++;
        console.log(`[Game] Starting Player Turn ${this.battleTurn}`);
        this.log(`--- Player Turn ${this.battleTurn} ---`, 'system');

        this.player.block = 0;
        this.player.energy = this.player.maxEnergy;
        this.player.momentum = 0;

        if (this.player.berserk > 0) {
            console.log(`[Game] Applying player Berserk effect (${this.player.berserk})...`);
            this.player.energy += this.player.berserk;
            this.log(`${this.player.name} gains ${this.player.berserk} energy from Berserk.`, 'player');
            console.log(`[Game] Player energy increased to ${this.player.energy} by Berserk.`);

            const berserkDamage = this.player.berserk * 2;
            this.log(`${this.player.name} takes ${berserkDamage} damage from Berserk.`, 'player');
            console.log(`[Game] Player taking ${berserkDamage} self-damage from Berserk.`);
            const playerDied = this.dealDamage(this.player, this.player, berserkDamage, true);
            if (playerDied) {
                console.log('[Game] Player died from Berserk damage. Turn ended.');
                return;
            }
        }

        if (this.player.vulnerable > 0) {
             console.log(`[Game] Reducing player Vulnerable duration from ${this.player.vulnerable}.`);
             this.player.vulnerable--;
             if (this.player.vulnerable === 0) {
                this.log(`${this.player.name} is no longer Vulnerable.`, 'player');
                console.log(`[Game] Player is no longer Vulnerable.`);
             } else {
                 console.log(`[Game] Player Vulnerable duration now ${this.player.vulnerable}.`);
             }
        }

        console.log(`[Game] Player drawing ${BASE_DRAW} card(s).`);
        for (let i = 0; i < BASE_DRAW; i++) {
            this.drawCard();
        }
        console.log(`[Game] Player finished drawing. Hand size: ${this.player.hand.length}`);

        this.updateUI();
        console.log('[Game] UI updated after drawing card(s).');

        console.log('[Game] Scheduling automated player turn action...');
        setTimeout(() => this.playPlayerTurn(), 1000);
    }

    async playPlayerTurn() {
        console.log('[Game] Executing automated player turn action...');
        if (!this.inBattle) {
             console.warn('[Game] playPlayerTurn called but not in battle. Aborting.');
             return;
        }

        await delay(500);

        const playableCardIndex = this.player.hand.length > 0 ? 0 : -1;
        const cardId = playableCardIndex !== -1 ? this.player.hand[playableCardIndex] : null;
        const cardTemplate = cardId ? getCardTemplate(cardId) : null;

        if (cardTemplate && this.player.energy >= cardTemplate.cost) {
            let spentMomentum = 0;
            if (cardTemplate.usesMomentum && this.player.momentum >= cardTemplate.momentumCost) {
                spentMomentum = cardTemplate.momentumCost;
                this.player.momentum -= spentMomentum;
                this.log(`Spent ${spentMomentum} momentum for ${cardTemplate.name}'s bonus effect.`, 'player');
            }

            this.player.energy -= cardTemplate.cost;

            this.player.hand.splice(playableCardIndex, 1);
            this.player.discardPile.push(cardId);

            this.log(`Player plays ${cardTemplate.name} (Cost: ${cardTemplate.cost})`, 'player');
            this.updateStats();

            animateCardPlay(cardId, cardTemplate, true);
            await delay(300);

            if (cardTemplate.effect) {
                cardTemplate.effect(this, this.player, this.enemy, spentMomentum);
            }

            if (this.enemy.hp <= 0) {
                this.enemyDefeated();
                return;
            }

            let momentumGained = 0;
            if (cardTemplate.cost === 0) {
                momentumGained = MOMENTUM_GAIN_ZERO_COST;
            } else if (cardTemplate.cost === 1 || cardTemplate.cost === 2) {
                momentumGained = MOMENTUM_GAIN_DEFAULT;
            }

            if (momentumGained > 0) {
                this.player.momentum += momentumGained;
                this.log(`Gained ${momentumGained} momentum. (Total: ${this.player.momentum})`, 'player');
                if (this.player.momentum > MAX_MOMENTUM) {
                    this.player.momentum = MAX_MOMENTUM;
                }
            }

            console.log('[Game] Player played a card, drawing replacement...');
            this.drawCard();

            this.updateUI();

            if (this.player.momentum >= MAX_MOMENTUM) {
                await delay(100);
                showMomentumBurstEffect();
                await delay(1000);
                this.log('Maximum momentum reached! Ending turn.', 'system-warning');
                this.endPlayerTurn();
                return;
            }

            this.playPlayerTurn();
        } else {
            if (this.player.hand.length > 0) {
                this.log(`Player cannot afford ${cardTemplate.name} (Cost: ${cardTemplate.cost}, Energy: ${this.player.energy}).`, 'player');
            } else {
                this.log('Player has no card in hand.', 'player');
            }
            this.endPlayerTurn();
        }
    }

    endPlayerTurn() {
        console.log('[Game] Ending player turn...');
        this.log(`${this.player.name} ends their turn.`, 'player');

        console.log(`[Game] Discarding player hand. Hand size: ${this.player.hand.length}`);
        this.player.discardPile.push(...this.player.hand);
        this.player.hand = [];
        console.log(`[Game] Player hand discarded. Discard size: ${this.player.discardPile.length}`);

        this.updateUI();
        console.log('[Game] UI updated after discarding hand.');

        console.log('[Game] Scheduling enemy turn start...');
        setTimeout(() => this.startEnemyTurn(), 1000);
    }

    startEnemyTurn() {
        console.log('[Game] Checking battle state before starting enemy turn...');
        if (!this.inBattle) {
            console.warn('[Game] startEnemyTurn called but not in battle. Aborting.');
            return;
        }

        console.log(`[Game] Starting Enemy Turn ${this.battleTurn}`);
        this.log(`${this.enemy.name}'s turn.`, 'enemy');

        this.enemy.block = 0;
        this.enemy.energy = this.enemy.maxEnergy;

        if (this.enemy.berserk > 0) {
            console.log(`[Game] Applying enemy Berserk effect (${this.enemy.berserk})...`);
            this.enemy.energy += this.enemy.berserk;
            this.log(`${this.enemy.name} gains ${this.enemy.berserk} energy from Berserk.`, 'enemy');
            console.log(`[Game] Enemy energy increased to ${this.enemy.energy} by Berserk.`);

            const berserkDamage = this.enemy.berserk * 2;
            this.log(`${this.enemy.name} takes ${berserkDamage} damage from Berserk.`, 'enemy');
             console.log(`[Game] Enemy taking ${berserkDamage} self-damage from Berserk.`);
            const enemyDied = this.dealDamage(this.enemy, this.enemy, berserkDamage, true);
            if (enemyDied) {
                console.log('[Game] Enemy died from Berserk damage. Turn ended.');
                return;
            }
        }

        if (this.enemy.vulnerable > 0) {
             console.log(`[Game] Reducing enemy Vulnerable duration from ${this.enemy.vulnerable}.`);
             this.enemy.vulnerable--;
             if (this.enemy.vulnerable === 0) {
                this.log(`${this.enemy.name} is no longer Vulnerable.`, 'enemy');
                console.log(`[Game] Enemy is no longer Vulnerable.`);
             } else {
                 console.log(`[Game] Enemy Vulnerable duration now ${this.enemy.vulnerable}.`);
             }
        }

        console.log(`[Game] Enemy drawing up to ${ENEMY_HAND_SIZE} cards.`);
        this.enemy.hand = [];
        for (let i = 0; i < ENEMY_HAND_SIZE; i++) {
            if (this.enemy.drawPile.length === 0 && this.enemy.discardPile.length > 0) {
                console.log(`[Game] Enemy draw pile empty. Shuffling discard pile (${this.enemy.discardPile.length} cards)...`);
                this.enemy.drawPile = shuffleArray([...this.enemy.discardPile]);
                this.enemy.discardPile = [];
                this.log(`${this.enemy.name} shuffles their discard pile.`, 'enemy');
                console.log(`[Game] Enemy discard pile shuffled into draw pile. Draw size: ${this.enemy.drawPile.length}`);
            }
            if (this.enemy.drawPile.length > 0) {
                this.enemy.hand.push(this.enemy.drawPile.pop());
            } else {
                 console.log(`[Game] Enemy draw pile empty, cannot draw more cards.`);
                 break;
            }
        }
        console.log(`[Game] Enemy finished drawing. Hand size: ${this.enemy.hand.length}`);

        this.updateStats();
        console.log('[Game] Stats updated after enemy draw.');

        console.log('[Game] Scheduling enemy turn action...');
        setTimeout(() => this.playEnemyTurn(), 1000);
    }

    async playEnemyTurn() {
        console.log('[Game] Executing enemy turn action...');
        if (!this.inBattle) {
             console.warn('[Game] playEnemyTurn called but not in battle. Aborting.');
             return;
        }

        await delay(500);

        const playableCardIndex = this.enemy.hand.findIndex(cardId => {
            const template = getCardTemplate(cardId);
            return template && this.enemy.energy >= template.cost;
        });

        if (playableCardIndex !== -1) {
            const cardId = this.enemy.hand[playableCardIndex];
            const cardTemplate = getCardTemplate(cardId);
             console.log(`[Game] AI checking card: ${cardId} (Cost: ${cardTemplate.cost}, Enemy Energy: ${this.enemy.energy})`);

            if (cardTemplate) {
                this.enemy.hand.splice(playableCardIndex, 1);
                 console.log(`[Game] Card ${cardId} removed from enemy hand. Hand size: ${this.enemy.hand.length}`);

                this.enemy.energy -= cardTemplate.cost;
                console.log(`[Game] Enemy energy after cost: ${this.enemy.energy}`);

                this.log(`${this.enemy.name} plays ${cardTemplate.name}.`, 'enemy');
                animateCardPlay(cardId, cardTemplate, false);
                this.updateStats();
                console.log('[Game] Stats updated after enemy paying cost.');

                await delay(300);
                console.log('[Game] Delay complete. Executing enemy card effect...');

                cardTemplate.effect(this, this.enemy, this.player);
                console.log(`[Game] Card effect for ${cardId} finished.`);
                this.enemy.discardPile.push(cardId);
                console.log(`[Game] Card ${cardId} moved to enemy discard pile. Discard size: ${this.enemy.discardPile.length}`);
                this.updateUI();
                console.log('[Game] UI updated after enemy card effect.');

                if (this.enemy.hp <= 0) {
                    this.enemyDefeated();
                    return;
                }

                this.playEnemyTurn();
            } else {
                this.log(`Error: Card template not found for ID: ${cardId}`, 'error');
                this.endEnemyTurn();
            }
        } else {
            this.log('Enemy has no more playable cards.', 'enemy');
            this.endEnemyTurn();
        }
    }

    endEnemyTurn() {
        console.log('[Game] Ending enemy turn...');
        this.log(`${this.enemy.name} ends their turn.`, 'enemy');

        console.log(`[Game] Discarding enemy hand. Hand size: ${this.enemy.hand.length}`);
        this.enemy.discardPile.push(...this.enemy.hand);
        this.enemy.hand = [];
        console.log(`[Game] Enemy hand discarded. Discard size: ${this.enemy.discardPile.length}`);

        this.updateStats();
        console.log('[Game] Stats updated after enemy turn end.');

        console.log('[Game] Scheduling player turn start...');
        setTimeout(() => this.startPlayerTurn(), 1000);
    }

    drawCard() {
        if (this.player.hand.length >= PLAYER_MAX_HAND_SIZE) {
            console.log(`[Game] Player hand already full (${this.player.hand.length}/${PLAYER_MAX_HAND_SIZE}). Not drawing.`);
            this.updateNextCardPreview();
            return;
        }

        if (this.player.drawPile.length === 0 && this.player.discardPile.length > 0) {
            console.log(`[Game] Player draw pile empty. Shuffling discard pile (${this.player.discardPile.length} cards)...`);
            this.player.drawPile = shuffleArray([...this.player.discardPile]);
            this.player.discardPile = [];
            this.log(`${this.player.name} shuffles their discard pile.`, 'player');
            console.log(`[Game] Player discard pile shuffled into draw pile. Draw size: ${this.player.drawPile.length}`);
        }

        if (this.player.drawPile.length > 0) {
            const cardId = this.player.drawPile.pop();
            this.player.hand.push(cardId);
            console.log(`[Game] Player drew card: ${cardId}. Hand size: ${this.player.hand.length}, Draw pile size: ${this.player.drawPile.length}`);
        } else {
            console.log(`[Game] Player has no cards left in draw or discard piles.`);
            this.log(`${this.player.name} has no cards left to draw.`, 'player');
        }

        this.updateNextCardPreview();
    }

    updateNextCardPreview() {
        let nextCardId = null;
        if (this.player.drawPile.length > 0) {
            nextCardId = this.player.drawPile[this.player.drawPile.length - 1];
        } else if (this.player.discardPile.length > 0) {
             console.log('[Game] Draw pile empty, next card is uncertain (after shuffle).');
             nextCardId = null;
        } else {
             console.log('[Game] No cards in draw or discard pile.');
        }
         console.log(`[Game] Updating next card preview. Next card ID: ${nextCardId}`);
        updateNextCardPreviewUI(nextCardId);
    }

    dealDamage(source, target, amount, ignoreBlock = false) {
        console.log(`[Game] Calculating damage: ${source.name} -> ${target.name}, Base amount: ${amount}, Ignore block: ${ignoreBlock}`);
        if (amount <= 0) {
             console.log('[Game] Damage amount is zero or less. No damage dealt.');
             return false;
        }

        let finalAmount = amount;

        if (source !== target && source.strength) {
            console.log(`[Game] Applying source strength bonus: +${source.strength}`);
            finalAmount += source.strength;
        }

        if (target.vulnerable > 0) {
            const vulnerableMultiplier = 1.5;
            const amountBeforeVulnerable = finalAmount;
            finalAmount = Math.floor(finalAmount * vulnerableMultiplier);
            console.log(`[Game] Applying target Vulnerable bonus (${target.vulnerable} turns): ${amountBeforeVulnerable} * ${vulnerableMultiplier} -> ${finalAmount}`);
        }

        let damageDealt = finalAmount;
        let blockedAmount = 0;

        if (!ignoreBlock && target.block > 0) {
            console.log(`[Game] Target has ${target.block} block. Applying block...`);
            blockedAmount = Math.min(target.block, finalAmount);
            target.block -= blockedAmount;
            damageDealt = finalAmount - blockedAmount;
            if (blockedAmount > 0) {
                 this.log(`${target.name}'s block absorbs ${blockedAmount} damage.`, source === this.player ? 'player' : 'enemy');
                 console.log(`[Game] Block absorbed ${blockedAmount} damage. Remaining block: ${target.block}`);
            }
        } else if (ignoreBlock) {
            console.log(`[Game] Ignoring target block (${target.block}).`);
        } else {
             console.log(`[Game] Target has no block.`);
        }

        if (damageDealt > 0) {
             console.log(`[Game] Dealing ${damageDealt} damage to ${target.name}'s HP (${target.hp}).`);
            target.hp -= damageDealt;
            this.log(`${source.name} deals ${damageDealt} damage to ${target.name}.`, source === this.player ? 'player' : 'enemy');
            console.log(`[Game] ${target.name} HP after damage: ${target.hp}`);

            let targetElement = null;
            if (target === this.player) {
                targetElement = elements.player;
                 console.log('[Game] Damage target identified as player. Using player element.');
            } else if (target === this.enemy) {
                targetElement = elements.enemyContainer;
                 console.log('[Game] Damage target identified as enemy. Using enemy container element.');
            } else {
                 console.warn('[Game] Could not determine target type (player/enemy) for damage effect.');
            }

            if (targetElement) {
                showDamageEffect(targetElement, damageDealt);
            } else {
                console.warn(`[Game] Could not find UI element for target '${target?.name || 'UNKNOWN'}' to apply damage effect.`);
            }
        } else {
             console.log('[Game] No damage dealt to HP after block application.');
        }

        this.updateStats();
        console.log('[Game] Stats updated after damage calculation.');

        if (target.hp <= 0) {
            console.log(`[Game] Target ${target.name} HP reached zero or below.`);
            target.hp = 0;
            if (target === this.enemy) {
                console.log('[Game] Enemy defeated.');
                this.enemyDefeated();
                return true;
            } else {
                console.log('[Game] Player defeated.');
                this.gameOver(false);
                return true;
            }
        }
        console.log(`[Game] Target ${target.name} survived the damage.`);
        return false;
    }

    enemyDefeated() {
        console.log('[Game] Processing enemy defeat...');
        this.inBattle = false;
        console.log('[Game] Battle state set: inBattle=false');
        this.log(`${this.enemy.name} has been defeated!`, 'reward');
        this.updateStats();

        if (this.currentFloor >= MAX_FLOOR) {
             console.log(`[Game] Max floor (${MAX_FLOOR}) reached. Triggering victory.`);
             this.gameOver(true);
        } else {
            console.log('[Game] Showing reward screen and enabling next floor button.');
            this.showReward();
            elements.nextFloorBtn.disabled = false;
            elements.viewDeckBtn.disabled = false;
        }
        console.log('[Game] Enemy defeat processing complete.');
    }

    showReward() {
        console.log('[Game] Generating rewards...');
        const rewardCardIds = [];
        const rarities = ['common', 'uncommon', 'rare'];

        let commonChance = 0.6;
        let uncommonChance = 0.3;
        let rareChance = 0.1;

        const floorBonus = Math.min(this.currentFloor * 0.02, 0.2);
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
            if (possibleCards.length === 0) {
                 i--; continue;
            }

            let cardTemplate;
            do {
                 cardTemplate = possibleCards[Math.floor(Math.random() * possibleCards.length)];
            } while (rewardCardIds.includes(cardTemplate.id));

             console.log(`[Game] Chosen reward card ${i+1}: ${cardTemplate.id}`);
            rewardCardIds.push(cardTemplate.id);
        }

        console.log('[Game] Displaying reward UI with cards:', rewardCardIds);
        showRewardUI(rewardCardIds, this.handleRewardChoice.bind(this));
    }

    handleRewardChoice(chosenCardId) {
        console.log(`[Game] Handling reward choice. Chosen card ID: ${chosenCardId}`);
        if (chosenCardId) {
            this.player.deck.push(chosenCardId);
            const cardTemplate = getCardTemplate(chosenCardId);
            this.log(`Added ${cardTemplate.name} to your deck!`, 'reward');
            console.log(`[Game] Added ${chosenCardId} to player deck. New deck size: ${this.player.deck.length}`);
        } else {
            this.log('Skipped card reward.', 'system');
            console.log('[Game] Player skipped reward.');
        }
        console.log('[Game] Reward choice handled.');
    }

    nextFloor() {
        console.log(`[Game] Advancing to next floor from floor ${this.currentFloor}.`);
        this.currentFloor++;
        updateFloorInfoUI(this.currentFloor);

        const hpBeforeHeal = this.player.hp;
        const healAmount = Math.min(this.player.maxHp - this.player.hp, Math.floor(this.player.maxHp * 0.3));
        if (healAmount > 0) {
            this.player.hp += healAmount;
            this.log(`You rest and recover ${healAmount} HP.`, 'reward');
            console.log(`[Game] Player healed for ${healAmount} HP. HP: ${hpBeforeHeal} -> ${this.player.hp}`);
            showHealEffect(elements.player, healAmount);
        } else {
            console.log('[Game] Player already at max HP or heal amount is zero. No healing applied.');
        }

        console.log('[Game] Generating enemy for the new floor...');
        this.generateEnemy();
        this.updateUI();
        console.log('[Game] UI updated for new floor.');

        elements.startBattleBtn.disabled = false;
        elements.nextFloorBtn.disabled = true;
        console.log('[Game] Buttons updated for new floor (Start enabled, Next disabled).');

        this.log(`Entering Floor ${this.currentFloor}...`, 'system');
        console.log(`[Game] Entered Floor ${this.currentFloor}. Ready for player to start battle.`);
    }

    gameOver(victory) {
        console.log(`[Game] Game Over. Victory: ${victory}`);
        this.inBattle = false;
        console.log('[Game] Battle state set: inBattle=false');
        showGameOverUI(victory, this.currentFloor);
        if (victory) {
            this.log('Congratulations! You have conquered the spire!', 'reward');
        } else {
            this.log('Game over! You have been defeated.', 'system');
        }
        elements.startBattleBtn.disabled = true;
        elements.nextFloorBtn.disabled = true;
        elements.viewDeckBtn.disabled = true;
        console.log('[Game] Game over buttons disabled.');
    }

    restart() {
        console.log('[Game] Restarting game...');
        this.setUpNewGame();
        console.log('[Game] Game restart complete.');
    }

    viewDeck() {
        console.log('[Game] Showing deck view UI...');
        showDeckUI(this.player);
    }

    hideViewDeck() {
         console.log('[Game] Hiding deck view UI...');
        hideDeckUI();
    }

    updateUI() {
        console.log('[Game] Updating UI (Stats, Hand, Next Card)...');
        this.updateStats();
        updatePlayerHandUI(this.player.hand);
        this.updateNextCardPreview();
        console.log('[Game] updatePlayerHandUI & updateNextCardPreviewUI called.');
    }

    updateStats() {
        console.log('[Game] Updating Stats UI...');
        updateStatsUI(this.player, this.inBattle ? this.enemy : null);
        console.log('[Game] updateStatsUI called.');
    }

    log(message, type = 'system') {
        logMessage(message, type);
    }
}

window.addEventListener('load', () => {
    console.log('[Game] Window loaded. Initializing game instance.');
    const game = new CardBattler();
}); 
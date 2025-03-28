import { CARD_TYPES } from './constants.js';
import { getCardTemplate } from './cards.js';

export const elements = {
    playerName: document.getElementById('player-name'),
    playerHp: document.getElementById('player-hp'),
    playerEnergy: document.getElementById('player-energy'),
    playerHand: document.getElementById('player-hand'),
    player: document.getElementById('player'),

    enemyName: document.getElementById('enemy-name'),
    enemyHp: document.getElementById('enemy-hp'),
    enemyEnergy: document.getElementById('enemy-energy'),
    enemy: document.getElementById('enemy'),

    logContainer: document.getElementById('log-container'),
    floorInfo: document.getElementById('floor-info'),

    startBattleBtn: document.getElementById('start-battle-btn'),
    nextFloorBtn: document.getElementById('next-floor-btn'),
    viewDeckBtn: document.getElementById('view-deck-btn'),

    rewardContainer: document.getElementById('reward-container'),
    rewardOptions: document.getElementById('reward-options'),

    gameOver: document.getElementById('game-over'),
    gameOverMessage: document.getElementById('game-over-message'),
    restartBtn: document.getElementById('restart-btn'),

    deckBuilder: document.getElementById('deck-builder'),
    deckGrid: document.getElementById('deck-grid'),
    deckStats: document.getElementById('deck-stats'),
    playerStats: document.getElementById('player-stats'),
    backToGameBtn: document.getElementById('back-to-game-btn'),
};

export function createCardElement(cardTemplate) {
    console.log(`[UI] Creating card element for: ${cardTemplate.id} (${cardTemplate.name})`);
    const card = document.createElement('div');
    card.className = `card ${cardTemplate.type}`;
    card.dataset.cardId = cardTemplate.id;

    const cost = document.createElement('div');
    cost.className = 'card-cost';
    cost.textContent = cardTemplate.cost;

    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = cardTemplate.name;

    const description = document.createElement('div');
    description.className = 'card-description';
    description.textContent = cardTemplate.description;

    const type = document.createElement('div');
    type.className = 'card-type';
    type.textContent = cardTemplate.type.charAt(0).toUpperCase() + cardTemplate.type.slice(1);

    card.appendChild(cost);
    card.appendChild(name);
    card.appendChild(description);
    card.appendChild(type);

    return card;
}

export function updatePlayerHandUI(hand) {
    console.log(`[UI] Updating player hand UI with ${hand.length} cards.`);
    elements.playerHand.innerHTML = '';
    hand.forEach(cardId => {
        const cardTemplate = getCardTemplate(cardId);
        if (!cardTemplate) {
            console.error(`[UI] Card template not found for ID: ${cardId} during hand update.`);
            return;
        }
        const cardElement = createCardElement(cardTemplate);
        elements.playerHand.appendChild(cardElement);
    });
    console.log(`[UI] Player hand UI update complete.`);
}

export function updateStatsUI(player, enemy) {
    console.debug('[UI] Updating stats UI...');
    // Update player stats
    let playerHpText = `${player.hp}/${player.maxHp}`;
    if (player.block > 0) {
        playerHpText += ` (${player.block} Block)`;
    }
    elements.playerHp.textContent = playerHpText;
    elements.playerEnergy.textContent = `${player.energy}/${player.maxEnergy}`;
    console.debug(`[UI] Player stats updated: HP=${playerHpText}, Energy=${player.energy}/${player.maxEnergy}`);

    // Update enemy stats
    if (enemy) {
        let enemyHpText = `${enemy.hp}/${enemy.maxHp}`;
        if (enemy.block > 0) {
            enemyHpText += ` (${enemy.block} Block)`;
        }
        elements.enemyHp.textContent = enemyHpText;
        elements.enemyEnergy.textContent = `${enemy.energy}/${enemy.maxEnergy}`;
        elements.enemyName.textContent = enemy.name;
        console.debug(`[UI] Enemy stats updated: Name=${enemy.name}, HP=${enemyHpText}, Energy=${enemy.energy}/${enemy.maxEnergy}`);
    } else {
        console.debug('[UI] No enemy provided, clearing enemy stats display.');
        elements.enemyName.textContent = '???';
        elements.enemyHp.textContent = '-/-';
        elements.enemyEnergy.textContent = '-/-';
    }
    console.debug('[UI] Stats UI update complete.');
}

export function updateFloorInfoUI(floor) {
    console.log(`[UI] Updating floor info UI to: Floor ${floor}`);
    elements.floorInfo.textContent = `Floor ${floor}`;
}

export function logMessage(message, type = 'system') {
    console.debug(`[UI] Adding log message: "${message}" (Type: ${type})`);
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.textContent = message;

    elements.logContainer.appendChild(logEntry);
    elements.logContainer.scrollTop = elements.logContainer.scrollHeight; // Auto-scroll
}

export function clearLog() {
    console.log('[UI] Clearing game log display.');
    elements.logContainer.innerHTML = '';
}

export function showDamageEffect(targetElement, damage) {
    console.log(`[UI] Showing damage effect (${damage}) on element:`, targetElement);
    targetElement.classList.add('shake');
    setTimeout(() => targetElement.classList.remove('shake'), 500);

    const damageText = document.createElement('div');
    damageText.className = 'damage-text';
    damageText.textContent = `-${damage}`;
    const rect = targetElement.getBoundingClientRect();
    damageText.style.left = `${rect.left + rect.width / 2 + (Math.random() - 0.5) * 50}px`;
    damageText.style.top = `${rect.top + rect.height / 2 + (Math.random() - 0.5) * 30}px`;
    document.body.appendChild(damageText);

    // Simple hit flash effect (can be expanded)
    targetElement.classList.add('flash');
    setTimeout(() => targetElement.classList.remove('flash'), 300);


    setTimeout(() => damageText.remove(), 1500);
}

export function showHealEffect(targetElement, amount) {
    console.log(`[UI] Showing heal effect (${amount}) on element:`, targetElement);
    const healText = document.createElement('div');
    healText.className = 'heal-text';
    healText.textContent = `+${amount}`;
    const rect = targetElement.getBoundingClientRect();
    healText.style.left = `${rect.left + rect.width / 2 + (Math.random() - 0.5) * 50}px`;
    healText.style.top = `${rect.top + rect.height / 2 + (Math.random() - 0.5) * 30}px`;
    document.body.appendChild(healText);

    setTimeout(() => healText.remove(), 1500);
}

export function animateCardPlay(cardId, cardTemplate, sourceIsPlayer) {
    console.log(`[UI] Animating card play for ${cardId} (${cardTemplate.name}). Source is player: ${sourceIsPlayer}`);
    if (sourceIsPlayer) {
        // Find the card element and animate it
        const cardElements = elements.playerHand.querySelectorAll('.card');
        cardElements.forEach(card => {
            if (card.dataset.cardId === cardId) {
                card.classList.add('played');
                setTimeout(() => card.remove(), 900); // Remove after animation
                console.log(`[UI] Found card element for ${cardId} in hand, applying 'played' class.`);
            }
        });
    }

    // Floating card name effect for both player and enemy
    console.log(`[UI] Creating floating card name effect for ${cardTemplate.name}`);
    const cardNameElem = document.createElement('div');
    cardNameElem.textContent = cardTemplate.name;
    cardNameElem.style.position = 'absolute';
    cardNameElem.style.left = '50%'; // Center horizontally relative to viewport
    cardNameElem.style.top = sourceIsPlayer ? '40%' : '30%'; // Position vertically
    cardNameElem.style.transform = 'translate(-50%, -50%)';
    cardNameElem.style.fontSize = '24px';
    cardNameElem.style.fontWeight = 'bold';
    cardNameElem.style.color = getCardTypeColor(cardTemplate.type);
    cardNameElem.style.textShadow = '2px 2px 0 #000';
    cardNameElem.style.zIndex = '1000';
    cardNameElem.style.animation = 'float-up 1.5s forwards';
    document.body.appendChild(cardNameElem);

    setTimeout(() => {
        cardNameElem.remove();
    }, 1500);
}

export function getCardTypeColor(type) {
    switch (type) {
        case CARD_TYPES.ATTACK: return '#ff5555';
        case CARD_TYPES.DEFENSE: return '#5555ff';
        case CARD_TYPES.SKILL: return '#55ff55';
        default: return '#ffffff';
    }
}

export function showRewardUI(rewardCardIds, onRewardChosen) {
    console.log('[UI] Showing reward UI with cards:', rewardCardIds);
    elements.rewardContainer.style.display = 'flex';
    elements.rewardOptions.innerHTML = '';

    rewardCardIds.forEach(cardId => {
        const cardTemplate = getCardTemplate(cardId);
        if (!cardTemplate) {
            console.error(`[UI] Card template not found for ID: ${cardId} during reward display.`);
            return;
        }
        const cardElement = createCardElement(cardTemplate);
        cardElement.addEventListener('click', () => {
            console.log(`[UI] Reward card chosen: ${cardId}`);
            onRewardChosen(cardId);
            elements.rewardContainer.style.display = 'none';
            console.log('[UI] Reward UI hidden after choice.');
        });
        elements.rewardOptions.appendChild(cardElement);
    });

    // Add skip reward option
    const skipButton = document.createElement('button');
    skipButton.textContent = 'Skip Reward';
    skipButton.addEventListener('click', () => {
        console.log('[UI] Skip reward chosen.');
        onRewardChosen(null); // Pass null to indicate skipping
        elements.rewardContainer.style.display = 'none';
        console.log('[UI] Reward UI hidden after skip.');
    });
    elements.rewardOptions.appendChild(skipButton);
    console.log('[UI] Reward UI setup complete.');
}

export function showGameOverUI(victory, floor) {
    console.log(`[UI] Showing Game Over UI. Victory: ${victory}, Floor: ${floor}`);
    elements.gameOver.style.display = 'block';
    if (victory) {
        elements.gameOverMessage.textContent = `Victory! You conquered the 10 floors!`;
    } else {
        elements.gameOverMessage.textContent = `Defeat! You made it to floor ${floor}.`;
    }
    elements.startBattleBtn.disabled = true;
    elements.nextFloorBtn.disabled = true;
}

export function hideGameOverUI() {
    console.log('[UI] Hiding Game Over UI.');
    elements.gameOver.style.display = 'none';
}

export function showDeckUI(player) {
    console.log('[UI] Showing Deck Builder UI.');
    elements.deckBuilder.style.display = 'flex';
    updateDeckViewUI(player);
}

export function hideDeckUI() {
    console.log('[UI] Hiding Deck Builder UI.');
    elements.deckBuilder.style.display = 'none';
}

export function updateDeckViewUI(player) {
    console.log('[UI] Updating Deck View UI...');
    elements.deckGrid.innerHTML = '';
    elements.deckStats.innerHTML = '';
    elements.playerStats.innerHTML = '';

     // Add player stats
    console.log('[UI] Adding player stats to deck view.');
    const statsHTML = `
        <div class="player-stat">
            <div>HP</div>
            <div class="stat-value">${player.hp}/${player.maxHp}</div>
        </div>
        <div class="player-stat">
            <div>Energy</div>
            <div class="stat-value">${player.maxEnergy}</div>
        </div>
        <div class="player-stat">
            <div>Strength</div>
            <div class="stat-value">${player.strength || 0}</div>
        </div>
        <!-- Add more stats as needed -->
    `;
    elements.playerStats.innerHTML = statsHTML;

    // Count card types
    const cardCounts = {
        [CARD_TYPES.ATTACK]: 0,
        [CARD_TYPES.DEFENSE]: 0,
        [CARD_TYPES.SKILL]: 0
    };

    // Group cards by ID
    const cardGroups = {};

    player.deck.forEach(cardId => {
        const template = getCardTemplate(cardId);
        cardCounts[template.type]++;

        if (!cardGroups[cardId]) {
            cardGroups[cardId] = 1;
        } else {
            cardGroups[cardId]++;
        }
    });

    console.log('[UI] Counting and grouping cards in deck...');
    console.log('[UI] Card counts:', cardCounts);
    console.log('[UI] Card groups:', cardGroups);

    // Display deck stats
    console.log('[UI] Displaying deck stats.');
    const deckStatsHTML = `
        <div>Deck Size: ${player.deck.length}</div>
        <div>Attacks: ${cardCounts[CARD_TYPES.ATTACK]}</div>
        <div>Defenses: ${cardCounts[CARD_TYPES.DEFENSE]}</div>
        <div>Skills: ${cardCounts[CARD_TYPES.SKILL]}</div>
    `;
    elements.deckStats.innerHTML = deckStatsHTML;

    // Display cards sorted by type then name
    console.log('[UI] Sorting and displaying cards in deck grid.');
    const sortedCardIds = Object.keys(cardGroups).sort((a, b) => {
        const templateA = getCardTemplate(a);
        const templateB = getCardTemplate(b);
        if (templateA.type !== templateB.type) {
            const typeOrder = { [CARD_TYPES.ATTACK]: 1, [CARD_TYPES.SKILL]: 2, [CARD_TYPES.DEFENSE]: 3 };
            return typeOrder[templateA.type] - typeOrder[templateB.type];
        }
        return templateA.name.localeCompare(templateB.name);
    });


    sortedCardIds.forEach(cardId => {
        const count = cardGroups[cardId];
        const template = getCardTemplate(cardId);
        const cardElement = createCardElement(template);

        // Add count badge
        if (count > 1) {
            const countBadge = document.createElement('div');
            countBadge.textContent = `x${count}`;
            countBadge.style.position = 'absolute';
            countBadge.style.top = '5px';
            countBadge.style.right = '5px';
            countBadge.style.background = '#333';
            countBadge.style.padding = '2px 5px';
            countBadge.style.borderRadius = '3px';
            countBadge.style.fontSize = '12px';
            cardElement.appendChild(countBadge);
        }

        elements.deckGrid.appendChild(cardElement);
    });
    console.log('[UI] Deck View UI update complete.');
} 
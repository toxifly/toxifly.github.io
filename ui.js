import { CARD_TYPES, MAX_MOMENTUM } from './constants.js';
import { getCardTemplate } from './cards.js';

export const elements = {
    playerName: document.getElementById('player-name'),
    playerHp: document.getElementById('player-hp'),
    playerMaxHp: document.getElementById('player-max-hp'),
    playerBlock: document.getElementById('player-block'),
    playerEnergy: document.getElementById('player-energy'),
    playerMaxEnergy: document.getElementById('player-max-energy'),
    playerMomentum: document.getElementById('player-momentum'),
    playerMaxMomentum: document.getElementById('player-max-momentum'),
    playerHand: document.getElementById('player-hand'),
    player: document.getElementById('player'),
    nextCardPreview: document.getElementById('next-card-preview'),

    enemyName: document.getElementById('enemy-name'),
    enemyHp: document.getElementById('enemy-hp'),
    enemyEnergy: document.getElementById('enemy-energy'),
    enemyContainer: document.getElementById('enemy'),

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

/**
 * Creates a DOM element for a card.
 * @param {object} cardTemplate - The card template object.
 * @returns {HTMLElement} The card element.
 */
function createCardElement(cardTemplate) {
    console.log(`Creating element for card: ${cardTemplate.name}`);
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    cardElement.dataset.cardId = cardTemplate.id; // Use data attribute for ID

    // Card Background Image
    // Note: Add CSS: .card-background-image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; }
    // Note: Add CSS: .card { position: relative; overflow: hidden; /* keep existing dimensions/border */ }
    const imgElement = document.createElement('img');
    // imgElement.classList.add('card-image'); // Remove or rename if it conflicts
    imgElement.classList.add('card-background-image'); // New class for background styling
    const specificImagePath = `images/cards/${cardTemplate.id}.png`;
    const placeholderImagePath = 'images/cards/placeholder.png';
    imgElement.src = specificImagePath;
    imgElement.alt = ""; // Decorative images should have empty alt text
    // Fallback to placeholder if specific image fails to load
    imgElement.onerror = () => {
        console.warn(`Specific image not found for ${cardTemplate.id}, using placeholder.`);
        imgElement.src = placeholderImagePath;
        imgElement.onerror = null; // Prevent infinite loops if placeholder also fails
    };
    cardElement.appendChild(imgElement); // Append image first

    // Container for overlay content (Name, Cost, Description)
    // Note: Add CSS: .card-content { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; padding: 8px; box-sizing: border-box; color: white; text-shadow: 1px 1px 2px black; /* Adjust color/shadow for readability */ }
    const contentElement = document.createElement('div');
    contentElement.classList.add('card-content');
    cardElement.appendChild(contentElement);

    // Card Name (Top)
    // Note: Add CSS: .card-name { text-align: center; font-weight: bold; font-size: 1.1em; /* Adjust styling */ }
    const nameElement = document.createElement('div');
    nameElement.classList.add('card-name');
    nameElement.textContent = cardTemplate.name;
    contentElement.appendChild(nameElement); // Add to content container

    // Card Cost (e.g., Top Right)
    // Note: Add CSS: .card-cost { position: absolute; top: 5px; right: 8px; /* Style cost indicator */ background: rgba(0,0,0,0.7); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9em; color: yellow; /* Adjust styling */ }
    const costElement = document.createElement('div');
    costElement.classList.add('card-cost');
    costElement.textContent = cardTemplate.cost;
    contentElement.appendChild(costElement); // Add to content container (CSS positions it)

    // Card Description (Bottom)
    // Note: Add CSS: .card-description { margin-top: auto; /* Pushes to bottom */ text-align: center; font-size: 0.9em; /* Adjust styling */ padding: 5px; background: rgba(0,0,0,0.4); border-radius: 4px; /* Optional background for readability */ }
    const descriptionElement = document.createElement('div');
    descriptionElement.classList.add('card-description');
    descriptionElement.textContent = cardTemplate.description;
    contentElement.appendChild(descriptionElement); // Add to content container

    // Card Type Indicator (Border color - keep as is)
    const typeColor = getCardTypeColor(cardTemplate.type);
    cardElement.style.borderColor = typeColor;
    // Note: Ensure card border style is set in CSS, e.g., .card { border: 3px solid; }

    return cardElement;
}

/**
 * Updates the player's hand UI.
 * @param {string[]} hand - Array of card IDs in the player's hand.
 */
export function updatePlayerHandUI(hand) {
    console.log(`[UI] Updating player hand UI with ${hand.length} card(s).`);
    elements.playerHand.innerHTML = '';
    hand.forEach(cardId => {
        const cardTemplate = getCardTemplate(cardId);
        if (!cardTemplate) {
            console.error(`[UI] Card template not found for ID: ${cardId} during hand update.`);
            return;
        }
        const cardElement = createCardElement(cardTemplate);
        cardElement.style.cursor = 'default';
        cardElement.style.pointerEvents = 'none';
        elements.playerHand.appendChild(cardElement);
    });
    console.log(`[UI] Player hand UI update complete.`);
}

export function updateStatsUI(player, enemy) {
    console.debug('[UI] Updating stats UI...');
    // Update player stats
    let playerHpText = `${player.hp}/${player.maxHp}`;
    // Combine block display with HP text for robustness if separate element fails
    // if (player.block > 0) {
    //     playerHpText += ` (+${player.block} Block)`; // Example combined display
    // }

    // Safely update elements, checking if they exist first
    if (elements.playerHp) {
        elements.playerHp.textContent = `${player.hp}/${player.maxHp}`;
    } else {
        console.warn("[UI] Element with ID 'player-hp' not found.");
    }

    // Safely update playerBlock
    if (elements.playerBlock) {
        elements.playerBlock.textContent = player.block > 0 ? `+${player.block}` : '0'; // Line 95 (approx)
    } else {
        // Log a warning instead of crashing if the element is missing
        console.warn("[UI] Element with ID 'player-block' not found. Block will not be displayed separately.");
    }

    if (elements.playerEnergy) {
        elements.playerEnergy.textContent = `${player.energy}/${player.maxEnergy}`;
    } else {
        console.warn("[UI] Element with ID 'player-energy' not found.");
    }

    if (elements.playerMomentum) {
        elements.playerMomentum.textContent = player.momentum;
    } else {
        console.warn("[UI] Element with ID 'player-momentum' not found.");
    }

    if (elements.playerMaxMomentum) {
        elements.playerMaxMomentum.textContent = MAX_MOMENTUM;
    } else {
        console.warn("[UI] Element with ID 'player-max-momentum' not found.");
    }

    // console.debug(`[UI] Player stats updated: HP=${playerHpText}, Energy=${elements.playerEnergy?.textContent}`); // Use optional chaining for debug log

    // Update enemy stats (with similar safe checks)
    if (enemy) {
        let enemyHpText = `${enemy.hp}/${enemy.maxHp}`;
        if (enemy.block > 0) {
            // Consider adding block to HP text or using a separate, checked element
             enemyHpText += ` (+${enemy.block} Block)`;
        }

        if (elements.enemyHp) {
            elements.enemyHp.textContent = enemyHpText;
        } else {
             console.warn("[UI] Element with ID 'enemy-hp' not found.");
        }

        if (elements.enemyEnergy) {
            elements.enemyEnergy.textContent = `${enemy.energy}/${enemy.maxEnergy}`;
        } else {
            console.warn("[UI] Element with ID 'enemy-energy' not found.");
        }

        if (elements.enemyName) {
            elements.enemyName.textContent = enemy.name;
        } else {
            console.warn("[UI] Element with ID 'enemy-name' not found.");
        }
        // console.debug(`[UI] Enemy stats updated: Name=${enemy.name}, HP=${enemyHpText}, Energy=${enemy.energy}/${enemy.maxEnergy}`);
    } else {
        // console.debug('[UI] No enemy provided, clearing enemy stats display.');
        // Safely clear enemy stats
        if(elements.enemyName) elements.enemyName.textContent = '???';
        if(elements.enemyHp) elements.enemyHp.textContent = '-/-';
        if(elements.enemyEnergy) elements.enemyEnergy.textContent = '-/-';
    }
    // console.debug('[UI] Stats UI update complete.');
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

export function showDamageEffect(element, amount) {
    console.log(`[UI] Showing damage effect (${amount}) on element:`, element);
    if (!element) {
        console.warn("[UI] showDamageEffect called with an undefined element.");
        return;
    }
    element.classList.add('damaged');
    const damageText = document.createElement('div');
    damageText.classList.add('damage-text');
    damageText.textContent = `-${amount}`;
    const rect = element.getBoundingClientRect();
    damageText.style.left = `${rect.left + rect.width / 2 + (Math.random() - 0.5) * 50}px`;
    damageText.style.top = `${rect.top + rect.height / 2 + (Math.random() - 0.5) * 30}px`;
    document.body.appendChild(damageText);

    // Simple hit flash effect (can be expanded)
    element.classList.add('flash');
    setTimeout(() => element.classList.remove('flash'), 300);

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
        <div>Block: <span id="player-block">${player.block || 0}</span></div>
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

export function showMomentumBurstEffect() {
    console.log('Showing Momentum Burst Effect');
    const effectElement = document.createElement('div');
    effectElement.style.position = 'fixed';
    effectElement.style.top = '50%';
    effectElement.style.left = '50%';
    effectElement.style.transform = 'translate(-50%, -50%)';
    effectElement.style.zIndex = '1000'; // Ensure it's on top
    effectElement.style.opacity = '0';
    effectElement.style.transition = 'opacity 0.5s ease-out';

    const img = document.createElement('img');
    img.src = '/images/momentum-burst.png'; // Use the specified image path
    img.alt = 'Momentum Burst!';
    img.style.maxWidth = '80vw'; // Adjust size as needed
    img.style.maxHeight = '80vh';

    effectElement.appendChild(img);
    document.body.appendChild(effectElement);

    // Fade in
    requestAnimationFrame(() => {
        effectElement.style.opacity = '1';
    });

    // Fade out and remove after a delay
    setTimeout(() => {
        effectElement.style.opacity = '0';
        setTimeout(() => {
            if (effectElement.parentNode) {
                effectElement.parentNode.removeChild(effectElement);
            }
        }, 500); // Match transition duration
    }, 1000); // Duration the effect stays visible
}

/**
 * Updates the next card preview UI.
 * @param {string|null} nextCardId - The ID of the next card to draw, or null.
 */
export function updateNextCardPreviewUI(nextCardId) {
    console.log(`[UI] Updating next card preview UI. Next card ID: ${nextCardId}`);
    const previewContainer = elements.nextCardPreview;
    if (!previewContainer) {
        console.warn('[UI] Next card preview element not found.');
        return;
    }

    previewContainer.innerHTML = ''; // Clear previous preview

    if (nextCardId) {
        const cardTemplate = getCardTemplate(nextCardId);
        if (cardTemplate) {
            const cardElement = createCardElement(cardTemplate);
            cardElement.classList.add('next-card-preview-style'); // Add class for specific styling
            // Maybe add text above/below it
             const label = document.createElement('div');
             label.textContent = 'Next Draw:';
             label.style.textAlign = 'center';
             label.style.marginBottom = '5px';
             label.style.fontSize = '12px';
             label.style.color = '#aaa';
             previewContainer.appendChild(label);

            previewContainer.appendChild(cardElement);
        } else {
            console.error(`[UI] Card template not found for next card ID: ${nextCardId}`);
            previewContainer.textContent = 'Next: ???'; // Placeholder for error
        }
    } else {
        // Handle null case (e.g., draw pile empty, needing shuffle)
        previewContainer.textContent = 'Next: (Shuffle)';
        previewContainer.style.textAlign = 'center';
        previewContainer.style.color = '#aaa';
        previewContainer.style.fontSize = '14px';
        previewContainer.style.paddingTop = '50px'; // Center vertically roughly
    }
    console.log('[UI] Next card preview UI update complete.');
} 
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
    playerHand: document.getElementById('player-hand'),
    player: document.getElementById('player'),
    nextCardPreview: document.getElementById('next-card-preview'),

    enemyName: document.getElementById('enemy-name'),
    enemyHp: document.getElementById('enemy-hp'),
    enemyEnergy: document.getElementById('enemy-energy'),
    enemyBlock: document.getElementById('enemy-block'),
    enemyMomentum: document.getElementById('enemy-momentum'),
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

/**
 * Updates the stats display for player and enemy.
 * @param {object} player - The player object.
 * @param {object|null} enemy - The enemy object, or null if no enemy.
 */
export function updateStatsUI(player, enemy = null) {
    console.log('[UI] Updating stats UI...');
    const defaultMaxMomentum = MAX_MOMENTUM || 10; // Use constant or default

    // Update Player Stats
    if (player && elements.playerHp) { // Check if player and elements exist
        elements.playerName.textContent = player.name || 'Adventurer';
        // Use nullish coalescing (??) to handle potential undefined/null values gracefully
        elements.playerHp.textContent = `${player.hp ?? '--'}/${player.maxHp ?? '--'}`;
        elements.playerBlock.textContent = player.block ?? 0;
        elements.playerEnergy.textContent = `${player.energy ?? '-'}/${player.maxEnergy ?? '-'}`;
        // Update player momentum display format
        elements.playerMomentum.textContent = `${player.momentum ?? 0}/${player.maxMomentum ?? defaultMaxMomentum}`;
        console.log(`[UI] Player stats updated: HP=${elements.playerHp.textContent}, Block=${elements.playerBlock.textContent}, Energy=${elements.playerEnergy.textContent}, Momentum=${elements.playerMomentum.textContent}`);
    } else {
        console.warn('[UI] updateStatsUI called without player object or player elements not found.');
        // Optionally clear or set default values if player is null
        if (elements.playerHp) {
            elements.playerName.textContent = 'Adventurer';
            elements.playerHp.textContent = '--/--';
            elements.playerBlock.textContent = '0';
            elements.playerEnergy.textContent = '-/-';
            // Update player momentum display format for default
            elements.playerMomentum.textContent = `0/${defaultMaxMomentum}`;
        }
    }

    // Update Enemy Stats
    if (enemy && elements.enemyHp) { // Check if enemy and elements exist
        elements.enemyName.textContent = enemy.name || 'Enemy';
        elements.enemyHp.textContent = `${enemy.hp ?? '--'}/${enemy.maxHp ?? '--'}`;
        elements.enemyEnergy.textContent = `${enemy.energy ?? '-'}/${enemy.maxEnergy ?? '-'}`;
        // Update enemy block and momentum using new elements
        elements.enemyBlock.textContent = enemy.block ?? 0;
        elements.enemyMomentum.textContent = `${enemy.momentum ?? 0}/${enemy.maxMomentum ?? defaultMaxMomentum}`;
        console.log(`[UI] Enemy stats updated: HP=${elements.enemyHp.textContent}, Energy=${elements.enemyEnergy.textContent}, Block=${elements.enemyBlock.textContent}, Momentum=${elements.enemyMomentum.textContent}`);

        // Update enemy background image if applicable
        const enemyElement = document.getElementById('enemy');
        if (enemyElement && enemy.id) {
            const imagePath = `images/enemies/${enemy.id}.png`;
            // Basic check if image likely exists (more robust checks might be needed)
            // For simplicity, we just set it. Add error handling if needed.
            enemyElement.style.backgroundImage = `url('${imagePath}'), url('images/enemies/placeholder.png')`; // Fallback to placeholder
        }

    } else {
        // Clear enemy stats if no enemy or elements not found
        if(elements.enemyHp) {
            elements.enemyName.textContent = 'Enemy';
            elements.enemyHp.textContent = '--/--';
            elements.enemyEnergy.textContent = '-/-';
            // Clear enemy block and momentum if applicable
            elements.enemyBlock.textContent = '0';
            elements.enemyMomentum.textContent = `0/${defaultMaxMomentum}`;
        }
        const enemyElement = document.getElementById('enemy');
        if (enemyElement) {
            enemyElement.style.backgroundImage = `url('images/enemies/placeholder.png')`; // Reset to placeholder
        }
         console.log('[UI] Enemy stats cleared or enemy object/elements not found.');
    }
    console.log('[UI] Stats UI update complete.');
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
    const animationDuration = 1800; // Match CSS animation duration (1.8s)

    if (sourceIsPlayer) {
        // Find the card element in the player's hand and animate it
        const cardElements = elements.playerHand.querySelectorAll('.card');
        cardElements.forEach(card => {
            if (card.dataset.cardId === cardId) {
                card.classList.add('played');
                // Ensure the card isn't interactable during animation
                card.style.pointerEvents = 'none';
                card.style.zIndex = '1100'; // Bring player card slightly above floating name
                setTimeout(() => card.remove(), animationDuration - 100); // Remove slightly before animation ends
                console.log(`[UI] Found card element for ${cardId} in hand, applying 'played' class.`);
            }
        });
    } else {
        // Enemy played a card - create a temporary visual representation
        console.log(`[UI] Creating temporary visual for enemy card ${cardId} (${cardTemplate.name})`);
        const enemyCardElem = createCardElement(cardTemplate); // Use your card creation function
        enemyCardElem.style.position = 'absolute';
        enemyCardElem.style.top = '50%';
        enemyCardElem.style.left = '50%';
        enemyCardElem.style.transform = 'translate(-50%, -50%) scale(1.1)'; // Start slightly bigger and centered
        enemyCardElem.style.zIndex = '1050'; // Above most things but below player's played card animation
        enemyCardElem.style.pointerEvents = 'none'; // Not interactable
        document.body.appendChild(enemyCardElem);

        // Apply the played animation to the temporary enemy card visual
        enemyCardElem.classList.add('played');
        // Adjust animation slightly for enemy maybe? Or use same one. For now, using the same.
        // Note: The @keyframes card-played is defined globally, so it applies here too.
        console.log(`[UI] Applying 'played' class to temporary enemy card element.`);

        setTimeout(() => {
            enemyCardElem.remove();
            console.log(`[UI] Removed temporary enemy card element for ${cardId}.`);
        }, animationDuration - 100); // Remove slightly before animation ends
    }
}

export function getCardTypeColor(type) {
    switch (type) {
        case CARD_TYPES.ATTACK: return '#ff5555';
        case CARD_TYPES.DEFENSE: return '#5555ff';
        case CARD_TYPES.SKILL: return '#55ff55';
        default: return '#ffffff';
    }
}

export function showRewardUI(rewardCardIds, currentPickNum, totalPicks, onRewardChosen) {
    console.log(`[UI] Showing reward UI for pick ${currentPickNum}/${totalPicks}. Cards: ${rewardCardIds.join(', ')}`);
    elements.rewardContainer.classList.add('modal-active');
    elements.rewardContainer.style.display = 'flex';
    elements.rewardOptions.innerHTML = ''; // Clear previous options

    // Update the title or info text
    const titleElement = elements.rewardContainer.querySelector('h2');
    const picksInfo = document.getElementById('reward-picks-info');
    if (titleElement) {
        titleElement.textContent = `Choose Reward (Pick ${currentPickNum} of ${totalPicks})`;
    }
    if (picksInfo) {
         picksInfo.style.display = 'none'; // Hide the old "Picks remaining" text if using title
        // OR update it: picksInfo.textContent = `Pick ${currentPickNum} of ${totalPicks}`;
    }

    // Internal function to finalize this stage's choice
    function finalizeChoice(chosenCardId) {
        console.log(`[UI] Finalizing choice for pick ${currentPickNum}: ${chosenCardId}`);
        elements.rewardContainer.style.display = 'none';
        elements.rewardContainer.classList.remove('modal-active');
        console.log('[UI] Reward UI hidden for this pick.');
        onRewardChosen(chosenCardId); // Pass the single chosen card ID (or null)
    }

    // Add card elements
    rewardCardIds.forEach(cardId => {
        const cardTemplate = getCardTemplate(cardId);
        if (!cardTemplate) {
            console.error(`[UI] Card template not found for ID: ${cardId} during reward display.`);
            return;
        }
        const cardElement = createCardElement(cardTemplate);

        // Listener for picking THIS card
        cardElement.addEventListener('click', () => {
            console.log(`[UI] Reward card picked: ${cardId}`);
            finalizeChoice(cardId); // Finalize with the chosen card ID
        });
        elements.rewardOptions.appendChild(cardElement);
    });

    // Add Skip button for THIS pick
    const skipButton = document.createElement('button');
    // Text can be "Skip Pick" or just "Skip"
    skipButton.textContent = `Skip Pick ${currentPickNum}`;
    skipButton.classList.add('skip-button');
    skipButton.addEventListener('click', () => {
        console.log(`[UI] Skip chosen for pick ${currentPickNum}.`);
        finalizeChoice(null); // Finalize with null for skip
    });
    // Prepend or append based on desired layout, append is common
    elements.rewardOptions.appendChild(skipButton);

    console.log('[UI] Reward UI setup complete for this pick.');
}

export function showGameOverUI(floor) {
    console.log(`[UI] Showing Game Over UI. Floor: ${floor}`);
    elements.gameOver.style.display = 'block';
    // Always show the defeat message
    elements.gameOverMessage.textContent = `Defeat! You made it to floor ${floor}.`;

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
            <div class="stat-value">${player.hp ?? '--'}/${player.maxHp ?? '--'}</div>
        </div>
        <div class="player-stat">
            <div>Max Energy</div>
            <div class="stat-value">${player.maxEnergy ?? '-'}</div>
        </div>
        <div class="player-stat">
            <div>Strength</div>
            <div class="stat-value">${player.strength ?? 0}</div>
        </div>
         <div class="player-stat">
            <div>Momentum</div>
            <div class="stat-value">${player.momentum ?? 0}/10</div>
        </div>
        <!-- Add Block if needed in deck view -->
        <!-- <div>Block: <span id="player-block">${player.block ?? 0}</span></div> -->
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
export function updateNextCardPreviewUI(drawPile, isBerserkActive) {
    const previewContainer = document.getElementById('next-card-preview');
    previewContainer.innerHTML = ''; // Clear any existing content
    
    if (drawPile.length > 0) {
        const nextCardId = drawPile[drawPile.length - 1]; // Peek at the top card
        console.log(`[UI] Updating next card preview UI. Next card ID: ${nextCardId}`);
        const cardTemplate = getCardTemplate(nextCardId);
        
        if (cardTemplate) {
            // Create label
            const labelElement = document.createElement('div');
            labelElement.textContent = 'Next Draw:';
            labelElement.className = 'next-card-label';
            previewContainer.appendChild(labelElement);
            
            // Create card element using the existing createCardElement function
            const cardElement = createCardElement(cardTemplate);
            
            // Apply preview-specific styling classes
            cardElement.classList.add('next-card-preview-style');
            
            // Make sure the card isn't interactive
            cardElement.style.cursor = 'default';
            cardElement.style.pointerEvents = 'none';
            
            previewContainer.appendChild(cardElement);
            previewContainer.classList.remove('empty');
        } else {
            previewContainer.textContent = 'Next: ???';
            previewContainer.classList.add('empty');
        }
    } else {
        previewContainer.textContent = 'Next: Empty';
        previewContainer.classList.add('empty');
    }

    // Show or hide the berserk icon based on the passed status
    if (isBerserkActive) {
        const berserkIconElement = document.getElementById('berserk-status-icon'); // Or create dynamically
        berserkIconElement.style.display = 'inline-block'; // Or 'block', or add a visible class
        berserkIconElement.textContent = '🔥'; // Or use an image/icon font
        // Add tooltip maybe: berserkIconElement.title = 'Berserk Active! +1 Energy, -2 HP next turn.';
    } else {
        const berserkIconElement = document.getElementById('berserk-status-icon'); // Or create dynamically
        berserkIconElement.style.display = 'none'; // Or remove the visible class
    }

    console.log('[UI] Next card preview UI update complete.');
} 
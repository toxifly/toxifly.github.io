export function shuffleArray(array) {
    console.log(`[Utils] Shuffling array of length ${array.length}...`);
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
     // console.debug('[Utils] Array shuffled:', array); // Potentially very verbose
    return array;
}

export function delay(ms) {
    // console.debug(`[Utils] Starting delay for ${ms}ms...`); // Usually too noisy
    return new Promise(resolve => setTimeout(() => {
        // console.debug(`[Utils] Delay finished after ${ms}ms.`); // Usually too noisy
        resolve();
    }, ms));
}

// Add other utility functions if needed 
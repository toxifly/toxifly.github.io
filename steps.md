# Card Animation Rework Plan

This plan aims to fix animation inconsistencies and implement a new "throw to center and rotate" animation for played cards.

**Goal:** Ensure animations play reliably for every card played, including consecutive cards of the same type, and implement the new visual style.

**Approach:** Use component state in `CardDisplay` to manage the animation lifecycle, triggered by props, and use the `onAnimationEnd` event to clean up the state. Define the new animation in CSS.

**Steps:**

1.  **Modify `client/src/components/CardDisplay.tsx`:**
    *   **Add State:** Introduce a state variable to track if the animation is currently playing:
        ```typescript
        const [isAnimating, setIsAnimating] = useState(false);
        ```
    *   **Refactor `useEffect`:** Change the existing effect (that depends on `isNextCard`, `card?.id`) to set `isAnimating` to `true` when conditions are met, instead of directly manipulating the DOM class list.
        ```typescript
        useEffect(() => {
            if (isNextCard && card) {
                console.log(`[CardDisplay Effect] Triggering animation for card: ${card.id}`);
                setIsAnimating(true);
                // Remove any direct classList manipulation here
            }
            // We don't set isAnimating back to false here; onAnimationEnd will handle it.
        }, [isNextCard, card]);
        ```
    *   **Conditional Class:** Apply the `.playing` class (from CSS Modules) to the card's root element conditionally based on the `isAnimating` state.
        ```typescript
        // Example within the return statement's root div:
        className={`${styles.card} ${/* other classes */} ${isAnimating ? styles.playing : ''}`}
        ```
    *   **Add `onAnimationEnd` Handler:** Add a function to handle the end of the CSS animation and attach it to the card's root element. This function will reset the `isAnimating` state.
        ```typescript
        const handleAnimationEnd = () => {
            // Check if the card still exists to avoid errors during unmounts
            if (card) {
                console.log(`[CardDisplay] Animation ended for card: ${card.id}`);
            }
            setIsAnimating(false);
        };

        // In JSX:
        <div
            // ... other props
            className={`${styles.card} ${/* other classes */} ${isAnimating ? styles.playing : ''}`}
            onAnimationEnd={handleAnimationEnd}
        >
            {/* ... card content ... */}
        </div>
        ```

2.  **Modify `client/src/components/CardDisplay.module.css`:**
    *   **Define New Keyframes:** Create a `@keyframes` rule named `throwAndRotate` (or similar). This animation should:
        *   Translate the card towards the visual center of the play area. (Exact values might need tweaking based on layout - e.g., `transform: translate(-50%, -150px)` might move it left relative to its container and up).
        *   Rotate the card (e.g., `transform: rotate(360deg)`).
        *   Optionally scale or fade out (`opacity: 0`) towards the end.
        *   Use `transform-origin: center center;` if needed.
    *   **Update `.playing` Class:** Change the `.playing` class to use the new animation. Use `forwards` if you want the card to stay in its end state until it disappears (due to state change/unmounting), or `none`/omit it if the `handleAnimationEnd` logic should immediately hide/reset its visual state. `forwards` is often useful for smoother transitions if the element remains briefly after animating.
        ```css
        .playing {
          /* Ensure card is above others if needed */
          z-index: 10;
          /* Adjust duration and timing function as needed */
          animation: throwAndRotate 0.7s ease-in-out forwards;
        }

        @keyframes throwAndRotate {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
          50% {
             /* Mid-point: Move towards center, start rotating */
             /* Example: translate towards center-left and up */
            transform: translate(calc(-50vw + 150px), -200px) rotate(180deg) scale(1.1);
            opacity: 1;
          }
          100% {
             /* End-point: Further towards center/off-screen, full rotation, fade */
             /* Example: Further up and slightly more centered, faded */
            transform: translate(calc(-50vw + 100px), -250px) rotate(360deg) scale(1);
            opacity: 0;
          }
          /* NOTE: The translate values are EXAMPLES. They will need significant adjustment */
          /* based on the actual layout and desired target position relative to the card's origin. */
          /* Using viewport units (vw) can be tricky; targeting a parent element might be better. */
        }
        ```

3.  **Verify `client/src/components/GameUI.tsx`:**
    *   Ensure the `CardDisplay` component rendered for the playable card uses a unique `key` prop. The current `key={playableCardId}` is likely correct, but double-check it handles `null` values cleanly, perhaps like `key={playableCardId ?? 'playable-placeholder'}` to ensure a key exists even when no card is playable. This forces React to create a new component instance when the card *changes*, resetting its internal state (`isAnimating`).

4.  **Review `client/src/Game.tsx`:**
    *   No immediate changes seem necessary here based on the plan. The `setTimeout` delay controls *when* the `autoPlayCard` action is dispatched. The animation starts visually when the state updates *before* the timeout callback. The duration (1200ms) seems reasonable to let the player see the card before the action resolves. If the animation duration (e.g., 0.7s) feels too fast or slow relative to this delay, adjust either the animation duration or the `setTimeout` delay for better pacing.

5.  **Test:**
    *   Play multiple cards quickly.
    *   Play the same card type consecutively (e.g., two Strikes in a row).
    *   Observe the animation timing relative to the state updates and energy/card changes.
    *   Check the browser's console for the new log messages and any errors.
    *   Adjust CSS `@keyframes` values (`translate`, `rotate`, `opacity`, `scale`) and `animation` properties (`duration`, `timing-function`) until the visual effect is satisfactory.

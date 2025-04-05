import { getDOMElement } from './dom.js';
import { createCardElement } from './render.js';

/**
 * Animates a card element moving from a start position to an end position.
 * Creates a temporary, absolutely positioned clone for the animation.
 *
 * @param {Object} cardData - The data object of the card being animated.
 * @param {DOMRect} startRect - The starting bounding rectangle (e.g., card in hand).
 * @param {DOMRect} endRect - The ending bounding rectangle (e.g., slot on board).
 * @param {string} animationType - 'play' or 'attack'.
 * @param {number} [duration=400] - Animation duration in ms.
 * @returns {Promise<void>} A promise that resolves when the animation completes.
 */
export function animateCardMovement(cardData, startRect, endRect, animationType, duration = 400) {
    return new Promise(resolve => {
        const gameContainer = getDOMElement('gameContainer');
        if (!gameContainer || !startRect || !endRect) {
            console.warn("Animation prerequisites not met (container or rects missing).");
            resolve();
            return;
        }

        // Create a temporary element for the animation
        // Use createCardElement to get the correct visual representation
        const tempCardEl = createCardElement(cardData, 'animating'); // Use a specific location type for styling if needed
        tempCardEl.classList.add('card-animating'); // Add the base animation class

        // --- Calculate Positions Relative to Viewport ---
        // startRect and endRect are already relative to the viewport
        const startX = startRect.left;
        const startY = startRect.top;
        const endX = endRect.left;
        const endY = endRect.top;

        // --- Initial Setup ---
        tempCardEl.style.position = 'fixed'; // Position relative to viewport
        tempCardEl.style.left = `${startX}px`;
        tempCardEl.style.top = `${startY}px`;
        tempCardEl.style.width = `${startRect.width}px`; // Use actual start size
        tempCardEl.style.height = `${startRect.height}px`;
        tempCardEl.style.transition = `transform ${duration / 1000}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
        tempCardEl.style.zIndex = '1500'; // Ensure it's on top

        // Append to the game container (or body)
        gameContainer.appendChild(tempCardEl);

        // --- Trigger Animation ---
        // We need a slight delay to allow the browser to apply the initial styles
        // before applying the transform for the transition. requestAnimationFrame is good for this.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { // Double rAF for safety in some browsers
                if (animationType === 'play') {
                    // Move to the target position and potentially resize
                    const scaleX = endRect.width / startRect.width;
                    const scaleY = endRect.height / startRect.height;
                    tempCardEl.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(${scaleX}, ${scaleY})`;
                } else if (animationType === 'attack') {
                    // Lunge towards target and back
                    const dx = endX - startX; // Delta X to target center
                    const dy = endY - startY; // Delta Y to target center
                    const lungeDistanceFactor = 0.6; // How far towards the target to lunge

                    // Apply lunge transform
                    tempCardEl.style.transform = `translate(${dx * lungeDistanceFactor}px, ${dy * lungeDistanceFactor}px) scale(1.1)`;
                    tempCardEl.style.transitionDuration = `${duration * 0.5 / 1000}s`; // Faster lunge

                    // Set timeout to return after the lunge
                    setTimeout(() => {
                        tempCardEl.style.transform = 'translate(0, 0) scale(1)'; // Return to start
                        tempCardEl.style.transitionDuration = `${duration * 0.5 / 1000}s`; // Return speed
                    }, duration * 0.5); // Start return halfway through total duration
                }
            });
        });

        // --- Cleanup ---
        // Listen for the transition end event
        const onTransitionEnd = (event) => {
            // Ensure we're handling the end of the 'transform' transition
            if (event.propertyName === 'transform') {
                if (tempCardEl.parentNode) {
                    tempCardEl.remove(); // Remove the temporary element
                }
                tempCardEl.removeEventListener('transitionend', onTransitionEnd);
                resolve(); // Resolve the promise
            }
        };
        tempCardEl.addEventListener('transitionend', onTransitionEnd);

        // Safety timeout: If transitionend doesn't fire, remove element and resolve anyway
        setTimeout(() => {
            if (tempCardEl.parentNode) {
                tempCardEl.remove();
            }
            tempCardEl.removeEventListener('transitionend', onTransitionEnd); // Clean up listener
            console.warn("Card animation fallback timeout triggered.");
            resolve();
        }, duration + 100); // A bit longer than the animation duration
    });
}

/**
 * Animates a card being drawn from the deck to the hand area.
 *
 * @param {object} player - The player object who is drawing.
 * @param {number} [duration=500] - Animation duration in ms.
 * @returns {Promise<void>} A promise that resolves when the animation completes.
 */
export function animateDrawCard(player, duration = 500) {
    return new Promise(resolve => {
        const gameContainer = getDOMElement('gameContainer');
        const drawPileEl = player.drawPileElement; // e.g., 'player-draw-count' element
        const handEl = player.handElement; // e.g., 'player-hand' element

        if (!gameContainer || !drawPileEl || !handEl) {
            console.warn("Draw animation prerequisites not met.");
            resolve();
            return;
        }

        const startRect = drawPileEl.getBoundingClientRect();
        const handRect = handEl.getBoundingClientRect();

        // Create a temporary card back element
        const tempCardEl = document.createElement('div');
        tempCardEl.classList.add('card', 'card-draw-animating'); // Style as a card back

        // --- Initial Setup ---
        const startX = startRect.left + startRect.width / 2 - 40; // Center horizontally, adjust for card width (80px / 2)
        const startY = startRect.top + startRect.height / 2 - 60; // Center vertically, adjust for card height (120px / 2)
        // End position: Roughly center of the hand area, slightly above
        const endX = handRect.left + handRect.width / 2 - 40;
        const endY = handRect.top + handRect.height / 2 - 80; // End slightly higher than exact center

        tempCardEl.style.left = `${startX}px`;
        tempCardEl.style.top = `${startY}px`;

        gameContainer.appendChild(tempCardEl);

        // --- Trigger Animation ---
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                tempCardEl.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(1.1) rotate(5deg)`; // Move, scale up slightly, rotate
                tempCardEl.style.opacity = '0'; // Fade out at the end
            });
        });

        // --- Cleanup ---
        setTimeout(() => {
            if (tempCardEl.parentNode) {
                tempCardEl.remove();
            }
            resolve();
        }, duration); // Remove after animation duration
    });
}

/**
 * Creates and animates a simple visual effect for a spell.
 * The effect appears near the target (or caster if no target) and fades out.
 *
 * @param {HTMLElement} casterElement - The DOM element of the caster (usually hero).
 * @param {HTMLElement | null} targetElement - The DOM element of the target, or null.
 * @param {string} effectType - The type of effect (e.g., 'fire', 'frost'). Matches CSS class suffix.
 * @param {number} [duration=600] - Duration of the effect in ms (should match CSS animation).
 * @returns {Promise<void>} A promise that resolves when the effect finishes.
 */
export function animateSpellEffect(casterElement, targetElement, effectType, duration = 600) {
    return new Promise(resolve => {
        const gameContainer = getDOMElement('gameContainer');
        if (!gameContainer || !casterElement) {
            console.warn("Spell effect prerequisites not met (container or caster missing).");
            resolve();
            return;
        }

        // Determine position: Target center or Caster center
        const positioningElement = targetElement || casterElement;
        const rect = positioningElement.getBoundingClientRect();
        const effectX = rect.left + rect.width / 2;
        const effectY = rect.top + rect.height / 2;

        // Create effect element
        const effectEl = document.createElement('div');
        effectEl.classList.add('spell-effect', `spell-effect-${effectType}`);

        // Position the effect (centered on the calculated point)
        effectEl.style.left = `${effectX}px`;
        effectEl.style.top = `${effectY}px`;

        // Append and automatically remove after animation
        gameContainer.appendChild(effectEl);

        setTimeout(() => {
            if (effectEl.parentNode) {
                effectEl.remove();
            }
            resolve();
        }, duration); // Remove after the CSS animation duration
    });
}

/**
 * Creates and animates a spinning coin effect over the player's board area.
 *
 * @param {object} player - The player object who played the coin.
 * @param {number} [duration=1000] - Duration of the effect in ms (should match CSS animation).
 * @returns {Promise<void>} A promise that resolves when the effect finishes.
 */
export function animateCoinEffect(player, duration = 1000) {
    return new Promise(resolve => {
        const gameContainer = getDOMElement('gameContainer');
        const boardEl = player.boardElement; // Get the player's board element

        if (!gameContainer || !boardEl) {
            console.warn("Coin effect prerequisites not met (container or board missing).");
            resolve();
            return;
        }

        // Determine position: Center of the player's board
        const rect = boardEl.getBoundingClientRect();
        const effectX = rect.left + rect.width / 2;
        const effectY = rect.top + rect.height / 2;

        // Create effect element
        const effectEl = document.createElement('div');
        effectEl.classList.add('coin-spin-effect'); // Use the specific class for coin animation

        // Position the effect (centered on the calculated point)
        effectEl.style.left = `${effectX}px`;
        effectEl.style.top = `${effectY}px`;

        // Append and automatically remove after animation
        gameContainer.appendChild(effectEl);

        setTimeout(() => {
            if (effectEl.parentNode) {
                effectEl.remove();
            }
            resolve();
        }, duration); // Remove after the CSS animation duration
    });
}

/**
 * Creates and animates a spinning card effect in the center of the screen,
 * typically used during the "determining who goes first" phase.
 *
 * @param {number} [duration=1500] - Duration of the effect in ms (should match CSS animation).
 * @returns {Promise<void>} A promise that resolves when the effect finishes.
 */
export function animateStartGameCoinFlip(duration = 1500) {
    return new Promise(resolve => {
        const gameArea = getDOMElement('gameMainArea'); // Target the main game area
        if (!gameArea) {
            console.warn("Start game coin flip: Game main area not found.");
            resolve();
            return;
        }

        // Create effect element
        const effectEl = document.createElement('div');
        effectEl.classList.add('start-game-coin-spin-effect'); // Use the specific class for the start game animation

        // Position the effect in the center of the game area
        const rect = gameArea.getBoundingClientRect(); // Get dimensions relative to viewport
        effectEl.style.left = `${rect.left + rect.width / 2}px`;
        effectEl.style.top = `${rect.top + rect.height / 2}px`;

        // Append and automatically remove after animation
        document.body.appendChild(effectEl); // Append to body to ensure viewport positioning works correctly

        setTimeout(() => {
            if (effectEl.parentNode) {
                effectEl.remove();
            }
            resolve();
        }, duration); // Remove after the CSS animation duration
    });
}

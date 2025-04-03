// /js/mulligan.js
import { getState, getPlayer, isMulliganActive, getMulliganSelectedIndices } from './state.js';
import { getDOMElement } from './dom.js';
import { createCardElement, renderGame, renderHand } from './render.js';
import { confirmMulligan as confirmMulliganAction } from './gameLogic.js';
import { logMessage } from './messaging.js';

let mulliganOverlayEl = null;
let mulliganHandContainerEl = null;
let confirmMulliganButtonEl = null;
let mulliganInstructionsEl = null;

const ANIMATION_STAGGER_DELAY = 100; // ms delay between card draw animations
const DISCARD_ANIMATION_DURATION = 400; // ms, should match CSS
const POST_MULLIGAN_PAUSE = 1000; // ms pause after new cards drawn
const FLASH_ANIMATION_DURATION = 600; // ms, 2 flashes * 0.3s each

export function initMulligan() {
    console.log("Initializing Mulligan UI elements...");
    mulliganOverlayEl = getDOMElement('mulliganOverlayEl');
    mulliganHandContainerEl = getDOMElement('mulliganHandContainerEl');
    confirmMulliganButtonEl = getDOMElement('confirmMulliganButtonEl');
    mulliganInstructionsEl = getDOMElement('mulliganInstructionsEl');

    // Event listener for the confirm button (added when shown)
}

export function showMulliganUI() {
    const player = getPlayer('player');
    const state = getState();
    state.mulliganActive = true;
    state.mulliganSelectedIndices = []; // Reset selection

    // Cache elements if not already done
    if (!mulliganOverlayEl) mulliganOverlayEl = getDOMElement('mulliganOverlayEl');
    if (!mulliganHandContainerEl) mulliganHandContainerEl = getDOMElement('mulliganHandContainerEl');
    if (!confirmMulliganButtonEl) confirmMulliganButtonEl = getDOMElement('confirmMulliganButtonEl');
    if (!mulliganInstructionsEl) mulliganInstructionsEl = getDOMElement('mulliganInstructionsEl');


    if (!mulliganOverlayEl || !mulliganHandContainerEl || !confirmMulliganButtonEl || !mulliganInstructionsEl) {
        console.error("Mulligan UI elements not found!");
        return;
    }

    console.log("Showing Mulligan UI");
    logMessage("Mulligan phase started.", "log-info");

    // Update instructions
    updateMulliganInstructions(0);

    // Render the initial hand with draw animation
    renderMulliganHandWithAnimation(player.hand);

    // Add listener to confirm button
    // Remove previous listener first to avoid duplicates if shown multiple times (though it shouldn't be)
    confirmMulliganButtonEl.removeEventListener('click', handleMulliganConfirmClick);
    confirmMulliganButtonEl.addEventListener('click', handleMulliganConfirmClick);
    confirmMulliganButtonEl.disabled = false; // Ensure button is enabled

    // Show the overlay
    mulliganOverlayEl.classList.add('visible');
    mulliganOverlayEl.classList.remove('fading-out'); // Ensure fade-out class is removed

    // Prevent background interactions (handled by overlay visibility and z-index)
    // Disable end turn button explicitly
    const endTurnButton = getDOMElement('endTurnButton');
    if (endTurnButton) endTurnButton.disabled = true;
}

export function hideMulliganUI() {
    if (mulliganOverlayEl) {
        mulliganOverlayEl.classList.remove('visible');
        mulliganOverlayEl.classList.add('fading-out'); // Add fade-out class

        // Use transitionend to fully hide after fade
        mulliganOverlayEl.addEventListener('transitionend', () => {
            // Check if still fading out before hiding completely
            if (mulliganOverlayEl.classList.contains('fading-out')) {
                mulliganOverlayEl.classList.remove('fading-out');
                // Setting display: none is handled by the .visible class removal now
            }
        }, { once: true });
    }
    const state = getState();
    state.mulliganActive = false;
    state.mulliganSelectedIndices = [];

    // Re-enable end turn button if it's player's turn (handled by startTurn)
    const endTurnButton = getDOMElement('endTurnButton');
    // if (endTurnButton && state.currentPlayerId === 'player') {
    //     endTurnButton.disabled = false; // This will be set correctly when startTurn is called
    // }
     console.log("Hiding Mulligan UI");
}

function renderMulliganHand(handCards) {
    if (!mulliganHandContainerEl) return;
    mulliganHandContainerEl.innerHTML = ''; // Clear previous

    handCards.forEach((card, index) => {
        // Use createCardElement, but attach mulligan-specific click handler
        const cardEl = createCardElement(card, 'mulligan', index);
        cardEl.dataset.handIndex = index; // Ensure hand index is stored

        // Remove default game listeners if createCardElement adds them
        // cardEl.removeEventListener('click', ...); // If necessary

        // Add mulligan click listener
        cardEl.addEventListener('click', () => handleMulliganCardClick(card, index, cardEl));

        mulliganHandContainerEl.appendChild(cardEl);
    });
}

function renderMulliganHandWithAnimation(handCards) {
    if (!mulliganHandContainerEl) return;
    mulliganHandContainerEl.innerHTML = ''; // Clear previous

    handCards.forEach((card, index) => {
        const cardEl = createCardElement(card, 'mulligan', index);
        cardEl.dataset.handIndex = index;
        cardEl.style.setProperty('--card-index', index); // For potential CSS stagger

        // Add animation class with delay
        cardEl.classList.add('mulligan-card-enter');
        cardEl.style.animationDelay = `${index * ANIMATION_STAGGER_DELAY}ms`;

        cardEl.addEventListener('click', () => handleMulliganCardClick(card, index, cardEl));
        mulliganHandContainerEl.appendChild(cardEl);
    });
}

function handleMulliganCardClick(card, index, cardEl) {
    if (!isMulliganActive()) return;

    const selectedIndices = getMulliganSelectedIndices();
    const alreadySelected = selectedIndices.includes(index);

    if (alreadySelected) {
        // Deselect
        const i = selectedIndices.indexOf(index);
        selectedIndices.splice(i, 1);
        cardEl.classList.remove('selected-for-mulligan');
        console.log(`Mulligan: Deselected card at index ${index}`);
    } else {
        // Select (only if less than 3 already selected)
        if (selectedIndices.length < 3) {
            selectedIndices.push(index);
            cardEl.classList.add('selected-for-mulligan');
            console.log(`Mulligan: Selected card at index ${index}`);
        } else {
            console.log("Mulligan: Cannot select more than 3 cards.");
            // Optionally provide user feedback (e.g., flash instruction text)
        }
    }
    updateMulliganInstructions(selectedIndices.length);
}

function handleMulliganConfirmClick() {
    if (!isMulliganActive()) return;
    console.log("Confirm Mulligan button clicked");
    const selectedIndices = [...getMulliganSelectedIndices()]; // Copy indices
    logMessage(`Player confirms mulligan, replacing ${selectedIndices.length} card(s).`, "log-action");

    // Disable button and card clicks during animation
    if (confirmMulliganButtonEl) confirmMulliganButtonEl.disabled = true;
    mulliganHandContainerEl.querySelectorAll('.card').forEach(el => el.style.pointerEvents = 'none');

    const player = getPlayer('player');
    const cardElements = Array.from(mulliganHandContainerEl.querySelectorAll('.card'));
    const discardPromises = [];

    // 1. Animate discarded cards away
    selectedIndices.forEach(index => {
        const cardEl = cardElements.find(el => parseInt(el.dataset.handIndex) === index);
        if (cardEl) {
            cardEl.classList.add('mulligan-card-exit');
            // Create a promise that resolves when the animation ends
            const promise = new Promise(resolve => {
                cardEl.addEventListener('animationend', resolve, { once: true });
                // Fallback timeout in case animationend doesn't fire
                setTimeout(resolve, DISCARD_ANIMATION_DURATION + 50);
            });
            discardPromises.push(promise);
        }
    });

    // 2. Wait for discard animations, then update state and draw new cards
    Promise.all(discardPromises).then(() => {
        console.log("Discard animations finished.");

        // Hide discarded cards completely before state update
        selectedIndices.forEach(index => {
            const cardEl = cardElements.find(el => parseInt(el.dataset.handIndex) === index);
            if (cardEl) cardEl.classList.add('mulligan-card-hidden');
        });

        // Perform the actual mulligan logic (state update)
        const newHand = confirmMulliganAction(selectedIndices); // Refactored action returns the new hand

        // 3. Render the final hand in the main game hand area (not mulligan area)
        renderHand(player); // Render the new hand in the actual player hand area

        // 4. Animate new cards entering the main hand area
        const playerHandEl = getDOMElement('playerHandEl');
        if (playerHandEl) {
            const newCardElements = playerHandEl.querySelectorAll('.card');
            newCardElements.forEach((cardEl, index) => {
                cardEl.classList.add('mulligan-card-enter'); // Reuse draw animation
                cardEl.style.animationDelay = `${index * ANIMATION_STAGGER_DELAY}ms`;
            });
        }

        // 5. Wait for new card draw animation + pause
        const drawAnimationDuration = (newHand.length * ANIMATION_STAGGER_DELAY) + 500; // Estimate based on stagger + card anim duration
        setTimeout(() => {
            console.log("New card draw animation finished, pausing...");
            // 6. Flash final hand
            flashFinalHand();
        }, drawAnimationDuration + POST_MULLIGAN_PAUSE);

    });
}

function updateMulliganInstructions(count) {
    if (mulliganInstructionsEl) {
        mulliganInstructionsEl.textContent = `Selected ${count}/3 cards to replace. Click Confirm when ready.`;
    }
}

function flashFinalHand() {
    console.log("Flashing final hand...");
    const playerHandEl = getDOMElement('playerHandEl');
    if (!playerHandEl) return;

    const cardElements = playerHandEl.querySelectorAll('.card');
    cardElements.forEach(cardEl => {
        cardEl.classList.add('mulligan-card-confirm-flash');
        // Remove class after animation finishes to prevent re-triggering
        cardEl.addEventListener('animationend', () => {
            cardEl.classList.remove('mulligan-card-confirm-flash');
        }, { once: true });
    });

    // 7. Hide mulligan overlay and start game after flash
    setTimeout(() => {
        hideMulliganUI();
        // Start turn is now called by the refactored confirmMulliganAction
    }, FLASH_ANIMATION_DURATION); // Wait for flash to finish
}

// This function will be called by renderGame when mulligan is active
export function renderMulliganUI() {
    // This might not be strictly necessary if showMulliganUI renders everything initially,
    // but it's good practice in case the state changes mid-mulligan (unlikely).
    // For now, it mainly ensures the correct cards are marked as selected.
    const player = getPlayer('player');
    const selectedIndices = getMulliganSelectedIndices();

    if (!mulliganHandContainerEl) return;

    const cardElements = mulliganHandContainerEl.querySelectorAll('.card');
    cardElements.forEach((cardEl, index) => {
        if (selectedIndices.includes(index)) {
            cardEl.classList.add('selected-for-mulligan');
        } else {
            cardEl.classList.remove('selected-for-mulligan');
        }
    });

    updateMulliganInstructions(selectedIndices.length);
}

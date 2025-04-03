// /js/mulligan.js
import { getState, getPlayer, isMulliganActive, getMulliganSelectedIndices } from './state.js';
import { getDOMElement } from './dom.js';
import { createCardElement, renderGame } from './render.js';
import { confirmMulligan as confirmMulliganAction } from './gameLogic.js';
import { logMessage } from './messaging.js';

let mulliganOverlayEl = null;
let mulliganHandContainerEl = null;
let confirmMulliganButtonEl = null;
let mulliganInstructionsEl = null;

export function initMulligan() {
    console.log("Initializing Mulligan UI elements...");
    mulliganOverlayEl = getDOMElement('mulliganOverlayEl'); // Use getDOMElement
    mulliganHandContainerEl = getDOMElement('mulliganHandContainerEl'); // Use getDOMElement
    confirmMulliganButtonEl = getDOMElement('confirmMulliganButtonEl'); // Use getDOMElement
    mulliganInstructionsEl = getDOMElement('mulliganInstructionsEl'); // Use getDOMElement

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

    // Render the initial hand into the mulligan container
    renderMulliganHand(player.hand);

    // Update instructions
    updateMulliganInstructions(0);

    // Add listener to confirm button
    // Remove previous listener first to avoid duplicates if shown multiple times (though it shouldn't be)
    confirmMulliganButtonEl.removeEventListener('click', handleMulliganConfirmClick);
    confirmMulliganButtonEl.addEventListener('click', handleMulliganConfirmClick);
    confirmMulliganButtonEl.disabled = false; // Ensure button is enabled

    // Show the overlay
    mulliganOverlayEl.classList.add('visible');

    // Prevent background interactions (handled by overlay visibility and z-index)
    // Disable end turn button explicitly
    const endTurnButton = getDOMElement('endTurnButton');
    if (endTurnButton) endTurnButton.disabled = true;
}

export function hideMulliganUI() {
    if (mulliganOverlayEl) {
        mulliganOverlayEl.classList.remove('visible');
    }
    const state = getState();
    state.mulliganActive = false;
    state.mulliganSelectedIndices = [];

    // Re-enable end turn button if it's player's turn
    const endTurnButton = getDOMElement('endTurnButton');
    if (endTurnButton && state.currentPlayerId === 'player') {
        endTurnButton.disabled = false;
    }
     console.log("Hiding Mulligan UI");
}

function renderMulliganHand(handCards) {
    if (!mulliganHandContainerEl) return;
    mulliganHandContainerEl.innerHTML = ''; // Clear previous

    handCards.forEach((card, index) => {
        // Use createCardElement, but attach mulligan-specific click handler
        const cardEl = createCardElement(card, 'mulligan', index); // Use 'mulligan' location type
        cardEl.dataset.handIndex = index; // Ensure hand index is stored

        // Remove default game listeners if createCardElement adds them
        // cardEl.removeEventListener('click', ...); // If necessary

        // Add mulligan click listener
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
     const selectedIndices = getMulliganSelectedIndices();
     logMessage(`Player confirms mulligan, replacing ${selectedIndices.length} card(s).`, "log-action");

     // Disable button to prevent double clicks
     if (confirmMulliganButtonEl) confirmMulliganButtonEl.disabled = true;

     // Call the core game logic function to perform the mulligan action
     confirmMulliganAction(selectedIndices);

     // The confirmMulliganAction should handle hiding the UI and starting the first turn
}

function updateMulliganInstructions(count) {
    if (mulliganInstructionsEl) {
        mulliganInstructionsEl.textContent = `Selected ${count}/3 cards to replace. Click Confirm when ready.`;
    }
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

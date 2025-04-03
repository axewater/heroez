// /js/cardZoom.js
import { getDOMElement } from './dom.js';
import { getState, getPlayer } from './state.js';
import { createCardElement } from './render.js'; // We can reuse the card element creation logic

let zoomTimeout = null;
const ZOOM_DELAY = 150; // ms delay before showing zoom

/**
 * Finds the card data associated with a DOM element.
 * @param {HTMLElement} element - The card DOM element.
 * @returns {object|null} The card instance data or null if not found.
 */
function getCardDataFromElement(element) {
    if (!element) return null;
    const instanceId = element.dataset.instanceId;
    if (!instanceId) return null;

    const state = getState();
    const player = getPlayer('player');
    const opponent = getPlayer('opponent');

    // Check player hand, board, opponent hand, opponent board
    let cardData = player.hand.find(c => c.instanceId === instanceId) ||
                   player.board.find(c => c.instanceId === instanceId) ||
                   opponent.hand.find(c => c.instanceId === instanceId) ||
                   opponent.board.find(c => c.instanceId === instanceId);

    return cardData || null;
}

/**
 * Shows the zoomed card view for a given card element.
 * @param {HTMLElement} cardElement - The card element being hovered over.
 */
export function showCardZoom(cardElement) {
    clearTimeout(zoomTimeout); // Clear any pending hide actions

    const cardData = getCardDataFromElement(cardElement);
    const zoomContainer = getDOMElement('cardZoomContainerEl');
    const state = getState();

    if (!cardData || !zoomContainer) {
        console.warn("Cannot show zoom: Card data or zoom container not found.");
        hideCardZoom(); // Ensure it's hidden if data is missing
        return;
    }

    // Check if opponent hand card should be hidden
    const isOpponentHandCard = cardData.owner === 'opponent' && cardElement.closest('.hand');
    const shouldHideDetails = isOpponentHandCard && !state.isDebugMode;

    // Use a timeout to delay showing the zoom
    zoomTimeout = setTimeout(() => {
        zoomContainer.innerHTML = ''; // Clear previous content

        // Create content based on card data, applying zoom-specific styles implicitly via CSS
        // We need to replicate the structure expected by the CSS rules for #card-zoom-container
        let effectText = cardData.effectText || "";
        if (cardData.mechanics && cardData.mechanics.length > 0) {
            const mechanicsText = `<b>${cardData.mechanics.join(', ')}</b>`;
            effectText = effectText ? `${mechanicsText}. ${effectText}` : mechanicsText;
        }

        // Basic structure matching the CSS selectors
        zoomContainer.innerHTML = `
            <div class="card-cost">${shouldHideDetails ? '' : cardData.cost}</div>
            <div class="card-name">${shouldHideDetails ? '???' : cardData.name}</div>
            ${cardData.type === 'Creature' ? `<div class="card-attack">${shouldHideDetails ? '' : (cardData.currentAttack ?? cardData.attack)}</div>` : ''}
            ${cardData.type === 'Creature' ? `<div class="card-health">${shouldHideDetails ? '' : (cardData.currentHealth ?? cardData.health)}</div>` : ''}
            <div class="card-effect">${shouldHideDetails ? '' : effectText}</div>
        `;

        // Add classes for type and state for background/borders
        zoomContainer.className = 'card'; // Reset classes first
        zoomContainer.classList.add(cardData.type); // Add type class (Creature/Spell)
        if (cardData.isTaunt) zoomContainer.classList.add('is-taunt');
        if (cardData.isFrozen) zoomContainer.classList.add('is-frozen');
        if (cardData.mechanics?.includes("Frenzy") && !cardData.frenzyTriggered) zoomContainer.classList.add('has-frenzy');
        if (cardData.isStealthed) zoomContainer.classList.add('is-stealthed');
        // Add the main container ID back and remove hidden
        zoomContainer.id = 'card-zoom-container';
        zoomContainer.classList.remove('hidden');

    }, ZOOM_DELAY);
}

/**
 * Hides the zoomed card view.
 */
export function hideCardZoom() {
    clearTimeout(zoomTimeout); // Clear any pending show actions
    const zoomContainer = getDOMElement('cardZoomContainerEl');
    if (zoomContainer && !zoomContainer.classList.contains('hidden')) {
        zoomContainer.classList.add('hidden');
        // Optional: Clear content after hiding transition
        // setTimeout(() => { zoomContainer.innerHTML = ''; }, 100); // Adjust timing based on CSS transition
    }
}

/**
 * Initializes the card zoom functionality by adding event listeners.
 */
export function initCardZoomListeners() {
    const gameContainer = getDOMElement('gameContainer');
    if (!gameContainer) return;

    console.log("Initializing card zoom event listeners...");

    // Use event delegation on the game container
    gameContainer.addEventListener('mouseover', (event) => {
        const cardElement = event.target.closest('.card');
        // Ensure it's a card within a hand or board area, not the zoom container itself
        if (cardElement && cardElement.closest('.hand, .board')) {
            showCardZoom(cardElement);
        }
    });

    gameContainer.addEventListener('mouseout', (event) => {
        const cardElement = event.target.closest('.card');
         // Ensure it's a card within a hand or board area
        if (cardElement && cardElement.closest('.hand, .board')) {
            // Check if the relatedTarget (where the mouse moved to) is still within the same card element or the zoom container
            // If it is, don't hide yet. This prevents flickering when moving mouse over internal elements.
            if (!cardElement.contains(event.relatedTarget) && event.relatedTarget !== getDOMElement('cardZoomContainerEl')) {
                 hideCardZoom();
            }
        } else if (!event.target.closest('#card-zoom-container') && !event.relatedTarget?.closest('.card')) {
            // If mouse out of game container entirely or moved from non-card to non-card, ensure zoom is hidden
             hideCardZoom();
        }
    });

     // Ensure zoom hides if mouse leaves the entire game container
     gameContainer.addEventListener('mouseleave', hideCardZoom);

    console.log("Card zoom listeners initialized.");
}

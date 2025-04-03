// /js/main.js
import { initGame, endTurn } from './gameLogic.js';
import { getState, isGameOver, setDebugMode, isMulliganActive } from './state.js';
import { handleHandCardClick, handleBoardCardClick, handleTargetClick } from './eventHandlers.js';
import { getDOMElement, cacheDOMElements } from './dom.js';
import { deselectCard, deselectAttacker, showGameUI, hideGameUI } from './uiState.js';
import { initMenu } from './menu.js';
import { initHeroSelection } from './heroSelection.js';
import { renderGame } from './render.js';
import { initCardZoomListeners } from './cardZoom.js';
import { initMulligan } from './mulligan.js';
import { initDeckSelection, showDeckSelection } from './deckSelection.js';

function setupEventListeners() {
    console.log("Setting up event listeners...");

    const endTurnButton = getDOMElement('endTurnButton');
    if (endTurnButton) {
        endTurnButton.addEventListener('click', () => {
            if (getState().currentPlayerId === 'player' && !getState().targetingMode && !isGameOver() && !isMulliganActive()) {
                endTurn();
            } else {
                console.log("Cannot end turn now.");
            }
        });
    } else {
        console.error("End turn button not found!");
    }

    const restartButton = getDOMElement('restartButton');
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            // Restarting should probably go back to the menu or hero select?
            // For now, just re-init the menu flow.
            initMenu();
        });
    } else {
         console.error("Restart button not found!");
    }

    const opponentBoard = getDOMElement('opponentBoardEl');
    if (opponentBoard) {
        opponentBoard.addEventListener('click', (e) => {
            const targetCardEl = e.target.closest('.card');
            if (targetCardEl && getState().targetingMode) {
                handleTargetClick(targetCardEl);
            }
        });
    } else {
         console.error("Opponent board element not found!");
    }

    const opponentHero = getDOMElement('opponentHeroEl');
    if (opponentHero) {
        opponentHero.addEventListener('click', (e) => {
             const heroEl = e.target.closest('.hero-info');
             if (heroEl && getState().targetingMode) {
                 handleTargetClick(heroEl);
             }
        });
    } else {
         console.error("Opponent hero element not found!");
    }

     const playerBoard = getDOMElement('playerBoardEl');
     if (playerBoard) {
         playerBoard.addEventListener('click', (e) => {
             const targetCardEl = e.target.closest('.card');
             if (targetCardEl && getState().targetingMode === 'spell') {
                 handleTargetClick(targetCardEl);
             }
         });
     } else {
          console.error("Player board element not found!");
     }

    const playerHero = getDOMElement('playerHeroEl');
    if (playerHero) {
        playerHero.addEventListener('click', (e) => {
             const heroEl = e.target.closest('.hero-info');
             if (heroEl && getState().targetingMode === 'spell') {
                  handleTargetClick(heroEl);
             }
        });
    } else {
         console.error("Player hero element not found!");
    }

     document.body.addEventListener('click', (e) => {
         if (getState().targetingMode || getState().selectedCard || getState().selectedAttacker) {
             const clickedInteractive = e.target.closest('.card, .hero-info, button');
             if (!clickedInteractive) {
                 console.log("Clicked outside interactive area, deselecting...");
                 deselectCard();
                 deselectAttacker();
                 renderGame(); // <-- Added this line to update the UI
             }
         }
     }, true);

    console.log("Event listeners set up.");
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded.");

    // 1. Cache DOM elements FIRST
    cacheDOMElements();

    // Initialize the pre-game UI modules
    initMenu();
    initHeroSelection(); // Initialize elements, but don't show yet
    initDeckSelection(); // Initialize deck selection elements
    initMulligan(); // Initialize mulligan elements
    initCardZoomListeners(); // Initialize card zoom hover listeners (can be done once)
    setupEventListeners(); // Setup general game event listeners
});

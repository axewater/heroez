import { initGame, endTurn } from './gameLogic.js';
import { getState, isGameOver } from './state.js';
import { handleHandCardClick, handleBoardCardClick, handleTargetClick, getDOMElement } from './ui.js';

function setupEventListeners() {
    console.log("Setting up event listeners...");

    const endTurnButton = getDOMElement('endTurnButton');
    if (endTurnButton) {
        endTurnButton.addEventListener('click', () => {
            if (getState().currentPlayerId === 'player' && !getState().targetingMode && !isGameOver()) {
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
        restartButton.addEventListener('click', initGame);
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
             }
         }
     }, true);

    console.log("Event listeners set up.");
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing game.");
    initGame();
    setupEventListeners();
});

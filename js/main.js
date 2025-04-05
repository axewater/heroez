// /js/main.js
import { initGame, endTurn } from './gameLogic.js';
import { getState, isGameOver, setDebugMode, isMulliganActive, loadSettings } from './state.js';
import { handleHandCardClick, handleBoardCardClick, handleTargetClick } from './eventHandlers.js';
import { getDOMElement, cacheDOMElements } from './dom.js';
import { deselectCard, deselectAttacker, showGameUI, hideGameUI } from './uiState.js';
import { initMenu } from './menu.js';
import { initHeroSelection } from './heroSelection.js';
import { renderGame } from './render.js';
import { initCardZoomListeners } from './cardZoom.js';
import { initMulligan } from './mulligan.js';
import { initDeckSelection, showDeckSelection } from './deckSelection.js';
import { initDeckEditor } from './deckEditor.js';
import { initSettings } from './settings.js'; // Added settings init
import { playMenuMusic, setMusicVolume, setSfxVolume } from './audioUtils.js'; // Import audio functions

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
        // Only handle left clicks within game container
        if (e.button !== 0 || !e.target.closest('#game-container')) return;
        
        if (getState().targetingMode || getState().selectedCard || getState().selectedAttacker) {            
            const clickedInteractive = e.target.closest('.card, .hero-info, button');
            if (!clickedInteractive) {
                console.log("Clicked outside interactive area, deselecting...");
                deselectCard();
                deselectAttacker();
                renderGame();
            }
        }
    }, true);

    console.log("Event listeners set up.");
}

// --- Intro Screen Logic ---
function handleIntroInteraction() {
    console.log("handleIntroInteraction triggered."); // Log function start
    const introScreen = getDOMElement('introScreen');
    const openingMenu = getDOMElement('openingMenuEl');

    console.log("Intro Screen Element:", introScreen); // Log found intro screen element
    console.log("Opening Menu Element:", openingMenu); // Log found opening menu element

    if (introScreen && openingMenu) {
        console.log("Intro interaction detected.");
        // 1. Start Menu Music
        playMenuMusic();

        // 2. Hide Intro Screen
        introScreen.style.opacity = '0';
        setTimeout(() => {
            introScreen.style.display = 'none';
        }, 500); // Match potential CSS transition

        // 3. Show Opening Menu
        openingMenu.classList.remove('hidden'); // Remove hidden class
        openingMenu.style.display = 'flex'; // Ensure display is flex
        requestAnimationFrame(() => openingMenu.style.opacity = '1'); // Trigger fade-in

        // 4. Remove listeners to prevent multiple triggers
        document.removeEventListener('keydown', handleIntroInteraction);
        // Only handle left mouse button clicks
        introScreen.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click only
                handleIntroInteraction();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded.");

    // 1. Cache DOM elements FIRST
    cacheDOMElements();

    // 2. Load Settings (before initializing modules that use them, like audio)
    loadSettings();
    setMusicVolume(getState().settings.musicVolume); // Apply initial music volume
    setSfxVolume(getState().settings.sfxVolume);   // Apply initial SFX volume base

    // Initialize the pre-game UI modules
    initMenu();
    initHeroSelection(); // Initialize elements, but don't show yet
    initDeckSelection(); // Initialize deck selection elements
    initMulligan(); // Initialize mulligan elements
    initDeckEditor(); // Initialize deck editor elements
    initCardZoomListeners(); // Initialize card zoom hover listeners (can be done once)
    initSettings(); // Initialize settings screen elements and listeners
    setupEventListeners(); // Setup general game event listeners

    // Setup Intro Screen Listeners
    const introScreen = getDOMElement('introScreen');
    if (introScreen) {
        // Only listen for spacebar key
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                handleIntroInteraction();
            }
        }, { once: true });
        
        // Only handle left mouse button clicks
        introScreen.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click only
                handleIntroInteraction();
            }
        });
    }
});

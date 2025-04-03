// --- DOM Element References ---
let domElements = {};

export function cacheDOMElements() {
    domElements = {
        opponentHealthEl: document.getElementById('opponent-health'),
        opponentManaContainerEl: document.getElementById('opponent-mana-container'),
        opponentDrawCountEl: document.getElementById('opponent-draw-count'),
        opponentDiscardCountEl: document.getElementById('opponent-discard-count'),
        opponentHandEl: document.getElementById('opponent-hand'),
        opponentBoardEl: document.getElementById('opponent-board'),
        opponentHeroEl: document.getElementById('opponent-hero'),

        playerHealthEl: document.getElementById('player-health'),
        playerManaContainerEl: document.getElementById('player-mana-container'),
        playerDrawCountEl: document.getElementById('player-draw-count'),
        playerDiscardCountEl: document.getElementById('player-discard-count'),
        playerHandEl: document.getElementById('player-hand'),
        playerBoardEl: document.getElementById('player-board'),
        playerHeroEl: document.getElementById('player-hero'),

        messageAreaEl: document.getElementById('message-area'),
        turnCounterDisplayEl: document.getElementById('turn-counter-display'),
        endTurnButton: document.getElementById('end-turn-button'),
        gameOverOverlay: document.getElementById('game-over-overlay'),
        gameOverMessage: document.getElementById('game-over-message'),
        restartButton: document.getElementById('restart-button'),

        messageLogContentEl: document.getElementById('message-log-content'),
        messageLogPanelEl: document.getElementById('message-log-panel'),

        gameContainer: document.getElementById('game-container'),
        cardZoomContainerEl: document.getElementById('card-zoom-container'), // Zoom container

        // Mulligan UI Elements
        mulliganOverlayEl: document.getElementById('mulligan-overlay'),
        mulliganHandContainerEl: document.getElementById('mulligan-hand-container'),
        confirmMulliganButtonEl: document.getElementById('confirm-mulligan-button'),
        mulliganInstructionsEl: document.getElementById('mulligan-instructions'),
    };
    console.log("DOM elements cached.");

    // Assign elements to player state objects (Requires getPlayer)
    // This part might need to be called from gameLogic or main after state is initialized
    // Or, pass getPlayer function as an argument
}

export function assignElementsToPlayerState(getPlayer) {
     // Assign elements to player state objects
    const player = getPlayer('player');
    if (player) {
        player.heroElement = domElements.playerHeroEl;
        player.healthElement = domElements.playerHealthEl;
        player.manaElement = domElements.playerManaContainerEl;
        player.drawPileElement = domElements.playerDrawCountEl;
        player.discardPileElement = domElements.playerDiscardCountEl;
        player.handElement = domElements.playerHandEl;
        player.boardElement = domElements.playerBoardEl;
    }

    const opponent = getPlayer('opponent');
     if (opponent) {
        opponent.heroElement = domElements.opponentHeroEl;
        opponent.healthElement = domElements.opponentHealthEl;
        opponent.manaElement = domElements.opponentManaContainerEl;
        opponent.drawPileElement = domElements.opponentDrawCountEl;
        opponent.discardPileElement = domElements.opponentDiscardCountEl;
        opponent.handElement = domElements.opponentHandEl;
        opponent.boardElement = domElements.opponentBoardEl;
    }
}


export function getDOMElement(id) {
    return domElements[id];
}

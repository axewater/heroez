// --- DOM Element References ---
let domElements = {};

export function cacheDOMElements() {
    domElements = {
        opponentHealthEl: document.getElementById('opponent-health'),
        opponentManaEl: document.getElementById('opponent-mana'),
        opponentDeckEl: document.getElementById('opponent-deck'),
        opponentHandEl: document.getElementById('opponent-hand'),
        opponentBoardEl: document.getElementById('opponent-board'),
        opponentHeroEl: document.getElementById('opponent-hero'),

        playerHealthEl: document.getElementById('player-health'),
        playerManaEl: document.getElementById('player-mana'),
        playerDeckEl: document.getElementById('player-deck'),
        playerHandEl: document.getElementById('player-hand'),
        playerBoardEl: document.getElementById('player-board'),
        playerHeroEl: document.getElementById('player-hero'),

        messageAreaEl: document.getElementById('message-area'),
        endTurnButton: document.getElementById('end-turn-button'),
        gameOverOverlay: document.getElementById('game-over-overlay'),
        gameOverMessage: document.getElementById('game-over-message'),
        restartButton: document.getElementById('restart-button'),

        messageLogContentEl: document.getElementById('message-log-content'),
        messageLogPanelEl: document.getElementById('message-log-panel'),
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
        player.manaElement = domElements.playerManaEl;
        player.deckElement = domElements.playerDeckEl;
        player.handElement = domElements.playerHandEl;
        player.boardElement = domElements.playerBoardEl;
    }

    const opponent = getPlayer('opponent');
     if (opponent) {
        opponent.heroElement = domElements.opponentHeroEl;
        opponent.healthElement = domElements.opponentHealthEl;
        opponent.manaElement = domElements.opponentManaEl;
        opponent.deckElement = domElements.opponentDeckEl;
        opponent.handElement = domElements.opponentHandEl;
        opponent.boardElement = domElements.opponentBoardEl;
    }
}


export function getDOMElement(id) {
    return domElements[id];
}
